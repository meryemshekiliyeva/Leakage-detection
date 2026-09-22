// ---------------------------------------------------------------------------
// liveService — connects the dashboard to the Raspberry Pi bridge.
//
// This is the real-hardware counterpart to the mock simulation. When
// VITE_LIVE_API_URL is set, SystemContext opens a live connection here and
// feeds incoming Arduino readings through the SAME pipeline the simulation
// uses — so nothing else in the app changes.
//
// Bridge message shape (see raspberry-pi/bridge.py):
//   {
//     reading: { timestamp, waterLevel, distance, leakDetected, aiStatus, anomalyScore },
//     analysis: { anomalyScore, aiStatus, confidence, pattern },
//     volumeLiters, source: "hardware" | "mock", arduinoConnected, ...
//   }
// ---------------------------------------------------------------------------

import type { SensorData } from '@/types';

export interface LiveMeta {
  /** "hardware" when a real Arduino is attached, "mock" when the bridge fakes it. */
  source: 'hardware' | 'mock';
  arduinoConnected: boolean;
}

export interface LiveHandlers {
  onReading: (reading: SensorData, meta: LiveMeta) => void;
  onOpen: () => void;
  onClose: () => void;
}

export interface LiveConnection {
  close: () => void;
}

/** The configured bridge URL, or null when no backend is configured. */
export function getLiveApiUrl(): string | null {
  const url = import.meta.env.VITE_LIVE_API_URL as string | undefined;
  return url && url.trim() ? url.trim().replace(/\/$/, '') : null;
}

function toWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/, 'ws') + '/ws';
}

function coerceReading(raw: unknown): SensorData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.waterLevel !== 'number' || typeof r.distance !== 'number') {
    return null;
  }
  return {
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date().toISOString(),
    waterLevel: r.waterLevel,
    distance: r.distance,
    leakDetected: Boolean(r.leakDetected),
    aiStatus: r.aiStatus === 'ANOMALY' ? 'ANOMALY' : 'NORMAL',
    anomalyScore: typeof r.anomalyScore === 'number' ? r.anomalyScore : 0,
  };
}

/**
 * Open a resilient live connection to the bridge. Reconnects automatically with
 * capped backoff. Call `.close()` to stop (e.g. on unmount).
 */
export function createLiveConnection(
  baseUrl: string,
  handlers: LiveHandlers,
): LiveConnection {
  let ws: WebSocket | null = null;
  let closedByCaller = false;
  let retry = 0;
  let reconnectTimer: number | undefined;

  const connect = () => {
    if (closedByCaller) return;
    try {
      ws = new WebSocket(toWsUrl(baseUrl));
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      handlers.onOpen();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const reading = coerceReading(msg.reading ?? msg);
        if (reading) {
          handlers.onReading(reading, {
            source: msg.source === 'hardware' ? 'hardware' : 'mock',
            arduinoConnected: Boolean(msg.arduinoConnected),
          });
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      handlers.onClose();
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will follow and handle the reconnect.
      ws?.close();
    };
  };

  const scheduleReconnect = () => {
    if (closedByCaller) return;
    retry += 1;
    const delay = Math.min(5000, 1000 * 2 ** Math.min(retry, 3));
    window.clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(connect, delay);
  };

  connect();

  return {
    close: () => {
      closedByCaller = true;
      window.clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
