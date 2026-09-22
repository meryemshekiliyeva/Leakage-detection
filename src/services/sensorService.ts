// ---------------------------------------------------------------------------
// sensorService — the sensor data API boundary.
//
// Today these functions return mock data. Tomorrow the SAME signatures can be
// backed by REST / WebSocket / MQTT calls to the Raspberry Pi. UI and state
// code depend only on these signatures, never on how the data is produced.
// ---------------------------------------------------------------------------

import type { HistoryRange, SensorData, SystemSettings, TimeRange } from '@/types';
import {
  DEFAULT_SETTINGS,
  generateHistoricalData,
  makeReading,
  seedHistory,
  BASELINE_LEVEL,
} from '@/data/mockData';

// Simulated network latency so the app behaves like a real async backend.
const simulateLatency = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/** Fetch the most recent single reading. */
export async function getCurrentSensorData(
  settings: SystemSettings = DEFAULT_SETTINGS,
): Promise<SensorData> {
  return simulateLatency(
    makeReading({ waterLevel: BASELINE_LEVEL }, settings.tankHeight),
  );
}

/** Number of points to render for each real-time range. */
const RANGE_POINTS: Record<TimeRange, number> = {
  '1m': 30,
  '10m': 60,
  '1h': 60,
  '24h': 96,
};

const RANGE_INTERVAL_SEC: Record<TimeRange, number> = {
  '1m': 2,
  '10m': 10,
  '1h': 60,
  '24h': 900,
};

/** Fetch a recent window of readings for the real-time chart. */
export async function getHistoricalSensorData(
  range: TimeRange = '10m',
  settings: SystemSettings = DEFAULT_SETTINGS,
): Promise<SensorData[]> {
  const data = seedHistory(
    RANGE_POINTS[range],
    RANGE_INTERVAL_SEC[range],
    settings.tankHeight,
  );
  return simulateLatency(data);
}

const HISTORY_CONFIG: Record<HistoryRange, { points: number; hours: number }> = {
  today: { points: 96, hours: 24 },
  '7d': { points: 168, hours: 24 * 7 },
  '30d': { points: 180, hours: 24 * 30 },
};

/** Fetch long-horizon history for the History page. */
export async function getLongHistory(
  range: HistoryRange = 'today',
  settings: SystemSettings = DEFAULT_SETTINGS,
): Promise<SensorData[]> {
  const cfg = HISTORY_CONFIG[range];
  return simulateLatency(
    generateHistoricalData(cfg.points, cfg.hours, settings.tankHeight),
    160,
  );
}
