# Raspberry Pi bridge (optional / future)

> **You don't need this to connect the Arduino today.** The dashboard reads the
> Arduino **directly over USB** using the browser's Web Serial API — just click
> **Connect Arduino** in the app (Chrome/Edge). See the main README.

This folder is for the **future** setup, when a Raspberry Pi sits between the
Arduino and the dashboard (the "Think" stage running on the Pi instead of in the
browser). It reads the Arduino serial stream, runs anomaly detection, and serves
the data to the dashboard over WebSocket + HTTP.

## Run

```bash
pip install -r requirements.txt

python bridge.py                      # auto-detect the Arduino serial port
python bridge.py --port /dev/ttyACM0  # or specify the port
python bridge.py --mock               # no Arduino needed (generates data)
```

Then point the dashboard at the bridge by setting, in the web app's `.env`:

```
VITE_LIVE_API_URL=http://raspberrypi.local:8000
```

The dashboard will connect automatically and show `LIVE · Arduino` when a real
board is attached.

## What it serves

- `GET /api/current` — latest reading + AI analysis
- `GET /api/history` — recent readings
- `WS  /ws`          — live push of each reading

It expects the Arduino's serial format from `IESL_Project1.ino`:
`waterLevel,distance,leakDetected` at 9600 baud.
