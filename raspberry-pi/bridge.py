#!/usr/bin/env python3
"""
Smart Water AI - Raspberry Pi bridge.

This is the "THINK" stage of the system. It:
  1. Reads the Arduino's serial stream  ->  "waterLevel,distance,leakDetected"
  2. Runs a lightweight anomaly detector over a rolling window
  3. Serves the enriched readings to the web dashboard over HTTP + WebSocket

The dashboard (the React app in this repo) connects to this bridge. Point the
frontend at it with VITE_LIVE_API_URL, e.g. http://raspberrypi.local:8000

Run:
    pip install -r requirements.txt
    python bridge.py                      # auto-detect the Arduino serial port
    python bridge.py --port /dev/ttyACM0  # or specify it
    python bridge.py --mock               # no Arduino needed (generates data)

Matches the Arduino sketch (IESL_Project1.ino): 9600 baud, tank height 21 cm,
volume cross-section 37.4 cm^2.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import random
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any, Deque, Optional

try:
    import serial  # pyserial
    from serial.tools import list_ports
except Exception:  # pragma: no cover - only in --mock without pyserial
    serial = None
    list_ports = None

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Smart Water AI Raspberry Pi bridge")
    p.add_argument("--port", default=None, help="Serial port (auto-detected if omitted)")
    p.add_argument("--baud", type=int, default=9600, help="Serial baud rate (Arduino uses 9600)")
    p.add_argument("--http-port", type=int, default=8000, help="HTTP/WebSocket port to serve on")
    p.add_argument("--host", default="0.0.0.0", help="Host/interface to bind")
    p.add_argument("--tank-height", type=float, default=21.0, help="Tank height in cm")
    p.add_argument("--cross-section", type=float, default=37.4, help="Water column area in cm^2")
    p.add_argument("--sensitivity", type=float, default=0.6, help="Anomaly threshold (0-1)")
    p.add_argument("--window", type=int, default=20, help="Anomaly-detector window size")
    p.add_argument("--mock", action="store_true", help="Generate fake data (no Arduino)")
    return p.parse_args()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Anomaly detection  (the "AI" stage — runs on the Pi)
# ---------------------------------------------------------------------------

class AnomalyDetector:
    """
    Lightweight, explainable detector over a rolling window of water levels.

    Signals combined into a 0-1 anomaly score:
      * rapid drop  - a fast fall in level across the window (possible leak/drain)
      * z-score     - the latest reading vs the window mean/spread (erratic sensor)
      * leak sensor - a wet leak sensor forces a high score
    """

    def __init__(self, window: int, sensitivity: float) -> None:
        self.levels: Deque[float] = deque(maxlen=window)
        self.sensitivity = sensitivity

    def update(self, water_level: float, leak: bool) -> dict[str, Any]:
        self.levels.append(water_level)
        recent = list(self.levels)

        # Warm-up: not enough data yet.
        if len(recent) < 5:
            score = 0.9 if leak else round(random.uniform(0.04, 0.12), 3)
            status = "ANOMALY" if leak else "NORMAL"
            return {
                "anomalyScore": score,
                "aiStatus": status,
                "confidence": 0.8,
                "pattern": "Warming up — collecting readings"
                if not leak
                else "Rapid water-level drop with wet leak sensor",
            }

        window = recent[-8:]
        mean = sum(window) / len(window)
        variance = sum((x - mean) ** 2 for x in window) / len(window)
        std = math.sqrt(variance)
        drop = window[0] - window[-1]  # positive when falling across the window
        latest = window[-1]
        z = abs(latest - mean) / std if std > 0.5 else 0.0

        score = 0.0
        score += max(0.0, min(1.0, drop / 25.0))       # 25% drop over window -> full
        score += max(0.0, min(1.0, (z - 2.0) / 3.0))    # z>2 starts to count
        score = min(1.0, score)
        if leak:
            score = max(score, 0.9)

        status = "ANOMALY" if (score >= self.sensitivity or leak) else "NORMAL"

        # Human-readable pattern for the dashboard.
        if status == "ANOMALY":
            if leak:
                pattern = "Rapid water-level drop with wet leak sensor"
            elif std > 5:
                pattern = "Irregular ultrasonic readings — unstable signal"
            elif drop > 10:
                pattern = "Rapid decrease in water-level measurements"
            else:
                pattern = "Unusual sensor pattern detected"
        else:
            pattern = (
                "Stable water-level behavior"
                if std < 2
                else "Normal water-level behavior with minor variation"
            )

        coherence = max(0.0, min(1.0, 1 - abs(variance - 4) / 40))
        confidence = round(min(0.98, max(0.75, 0.82 + coherence * 0.14)), 2)

        return {
            "anomalyScore": round(score, 3),
            "aiStatus": status,
            "confidence": confidence,
            "pattern": pattern,
        }


# ---------------------------------------------------------------------------
# Shared hub: holds latest state and fans out to WebSocket clients
# ---------------------------------------------------------------------------

class SensorHub:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.detector = AnomalyDetector(args.window, args.sensitivity)
        self.history: Deque[dict[str, Any]] = deque(maxlen=150)
        self.latest: Optional[dict[str, Any]] = None
        self.arduino_connected = False
        self.source = "mock" if args.mock else "hardware"
        self.clients: set[WebSocket] = set()
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self._lock = threading.Lock()

    # -- payload construction ------------------------------------------------

    def build_message(self, water_level: float, distance: float, leak: bool) -> dict[str, Any]:
        analysis = self.detector.update(water_level, leak)
        volume_l = round(
            max(0.0, self.args.tank_height - distance) * self.args.cross_section / 1000.0, 2
        )
        reading = {
            "timestamp": now_iso(),
            "waterLevel": round(water_level, 1),
            "distance": round(distance, 1),
            "leakDetected": bool(leak),
            "aiStatus": analysis["aiStatus"],
            "anomalyScore": analysis["anomalyScore"],
        }
        return {
            "reading": reading,
            "analysis": analysis,
            "volumeLiters": volume_l,
            "source": self.source,
            "arduinoConnected": self.arduino_connected,
            "tankHeight": self.args.tank_height,
            "crossSection": self.args.cross_section,
        }

    def publish(self, water_level: float, distance: float, leak: bool) -> None:
        msg = self.build_message(water_level, distance, leak)
        with self._lock:
            self.latest = msg
            self.history.append(msg["reading"])
        if self.loop is not None:
            asyncio.run_coroutine_threadsafe(self._broadcast(msg), self.loop)

    async def _broadcast(self, msg: dict[str, Any]) -> None:
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.discard(ws)


# ---------------------------------------------------------------------------
# Serial reader (runs in a background thread)
# ---------------------------------------------------------------------------

def autodetect_port() -> Optional[str]:
    if list_ports is None:
        return None
    for p in list_ports.comports():
        dev = (p.device or "").lower()
        desc = (p.description or "").lower()
        if any(k in dev for k in ("ttyacm", "ttyusb", "usbmodem", "usbserial")) or "arduino" in desc:
            return p.device
    return None


def serial_reader(hub: SensorHub, stop: threading.Event) -> None:
    """Continuously read '<level>,<distance>,<leak>' lines and publish them."""
    args = hub.args
    while not stop.is_set():
        port = args.port or autodetect_port()
        if not port or serial is None:
            hub.arduino_connected = False
            print("[serial] Arduino not found — retrying in 3s "
                  "(use --mock to run without hardware)")
            time.sleep(3)
            continue
        try:
            with serial.Serial(port, args.baud, timeout=2) as ser:
                hub.arduino_connected = True
                print(f"[serial] Connected to Arduino on {port} @ {args.baud} baud")
                # Give the Arduino time to reset after opening the port.
                time.sleep(2)
                ser.reset_input_buffer()
                while not stop.is_set():
                    raw = ser.readline().decode("utf-8", errors="ignore").strip()
                    if not raw:
                        continue
                    parsed = parse_line(raw)
                    if parsed is None:
                        continue
                    level, distance, leak = parsed
                    hub.publish(level, distance, leak)
        except Exception as exc:  # serial error -> reconnect
            hub.arduino_connected = False
            print(f"[serial] Error ({exc}); reconnecting in 3s")
            time.sleep(3)


def parse_line(raw: str) -> Optional[tuple[float, float, bool]]:
    """Parse 'waterLevel,distance,leakDetected' -> (level, distance, leak)."""
    parts = raw.split(",")
    if len(parts) != 3:
        return None
    try:
        level = float(parts[0])
        distance = float(parts[1])
        leak = parts[2].strip() in ("1", "true", "True")
        return level, distance, leak
    except ValueError:
        return None


def mock_reader(hub: SensorHub, stop: threading.Event) -> None:
    """Generate plausible data so the whole pipeline runs without an Arduino."""
    hub.arduino_connected = False
    level = 74.0
    tank = hub.args.tank_height
    print("[mock] Generating simulated readings (no Arduino)")
    while not stop.is_set():
        level = max(60.0, min(80.0, level + random.uniform(-0.6, 0.6)))
        distance = max(0.0, tank * (100 - level) / 100)
        hub.publish(level, distance, False)
        time.sleep(1)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

def create_app(hub: SensorHub, stop: threading.Event) -> FastAPI:
    app = FastAPI(title="Smart Water AI Bridge")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def _startup() -> None:
        hub.loop = asyncio.get_running_loop()
        target = mock_reader if hub.args.mock else serial_reader
        threading.Thread(target=target, args=(hub, stop), daemon=True).start()

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        stop.set()

    @app.get("/")
    async def root() -> JSONResponse:
        return JSONResponse(
            {
                "service": "smart-water-ai-bridge",
                "source": hub.source,
                "arduinoConnected": hub.arduino_connected,
                "hasReading": hub.latest is not None,
            }
        )

    @app.get("/api/current")
    async def current() -> JSONResponse:
        if hub.latest is None:
            return JSONResponse({"error": "no reading yet"}, status_code=503)
        return JSONResponse(hub.latest)

    @app.get("/api/history")
    async def history() -> JSONResponse:
        with hub._lock:
            return JSONResponse({"readings": list(hub.history)})

    @app.websocket("/ws")
    async def ws_endpoint(ws: WebSocket) -> None:
        await ws.accept()
        hub.clients.add(ws)
        try:
            # Send the latest snapshot immediately so the client isn't blank.
            if hub.latest is not None:
                await ws.send_text(json.dumps(hub.latest))
            while True:
                # We don't expect client messages; this keeps the socket open.
                await ws.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            hub.clients.discard(ws)

    return app


def main() -> None:
    args = parse_args()
    stop = threading.Event()
    hub = SensorHub(args)
    app = create_app(hub, stop)
    print(f"[bridge] Serving on http://{args.host}:{args.http_port}  "
          f"(WebSocket at /ws)  source={hub.source}")
    try:
        uvicorn.run(app, host=args.host, port=args.http_port, log_level="warning")
    finally:
        stop.set()


if __name__ == "__main__":
    main()
