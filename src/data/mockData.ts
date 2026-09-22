// ---------------------------------------------------------------------------
// Centralized mock data + generators.
//
// Nothing in the UI hardcodes sensor values directly. Everything flows from
// here (through the service layer), so replacing this with a real Raspberry Pi
// feed is a localized change.
// ---------------------------------------------------------------------------

import type {
  AIStatus,
  Alert,
  LeakEvent,
  Scenario,
  SensorData,
  SystemSettings,
} from '@/types';

// --- Physical model defaults -----------------------------------------------

/** Default tank height in cm. With a full tank at 100cm, level% maps cleanly
 *  to distance: 74% level => 26cm distance (matches the reference design). */
export const DEFAULT_TANK_HEIGHT = 100;

export const DEFAULT_SETTINGS: SystemSettings = {
  tankHeight: DEFAULT_TANK_HEIGHT,
  samplingInterval: 2,
  ultrasonicOffset: 0,
  leakSensorThreshold: 55,
  anomalySensitivity: 60,
  analysisInterval: 2,
  modelEnabled: true,
  notifyLeak: true,
  notifyAnomaly: true,
  notifyOffline: true,
};

// --- Small numeric helpers -------------------------------------------------

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const round = (v: number, decimals = 0) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

export const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

/** Convert a water-level percentage to an ultrasonic distance reading (cm). */
export const levelToDistance = (level: number, tankHeight: number, offset = 0) =>
  round(clamp((tankHeight * (100 - level)) / 100 + offset, 0, tankHeight), 1);

// --- The reference "starting point" for the whole system -------------------

export const BASELINE_LEVEL = 74;

export function makeReading(
  partial: Partial<SensorData> & { waterLevel: number },
  tankHeight = DEFAULT_TANK_HEIGHT,
): SensorData {
  const waterLevel = round(clamp(partial.waterLevel, 0, 100), 1);
  return {
    timestamp: partial.timestamp ?? new Date().toISOString(),
    waterLevel,
    distance: partial.distance ?? levelToDistance(waterLevel, tankHeight),
    leakDetected: partial.leakDetected ?? false,
    aiStatus: partial.aiStatus ?? 'NORMAL',
    anomalyScore:
      partial.anomalyScore ?? round(randomBetween(0.05, 0.16), 3),
  };
}

// --- Seed a rolling window of recent "normal" history ----------------------

/**
 * Build a plausible recent history of readings ending "now".
 * Used to prime charts so they are never empty on first paint.
 */
export function seedHistory(
  count = 60,
  intervalSec = 2,
  tankHeight = DEFAULT_TANK_HEIGHT,
): SensorData[] {
  const now = Date.now();
  const readings: SensorData[] = [];
  let level = BASELINE_LEVEL;
  for (let i = count - 1; i >= 0; i--) {
    level = clamp(level + randomBetween(-0.6, 0.5), 68, 78);
    readings.push(
      makeReading(
        {
          timestamp: new Date(now - i * intervalSec * 1000).toISOString(),
          waterLevel: level,
          anomalyScore: round(randomBetween(0.05, 0.15), 3),
          aiStatus: 'NORMAL',
        },
        tankHeight,
      ),
    );
  }
  return readings;
}

// --- Longer-horizon history for the History page ---------------------------

/**
 * Generate historical readings across many hours/days with realistic
 * day/night draw patterns plus a few embedded anomaly + leak events.
 */
export function generateHistoricalData(
  points: number,
  spanHours: number,
  tankHeight = DEFAULT_TANK_HEIGHT,
): SensorData[] {
  const now = Date.now();
  const stepMs = (spanHours * 3600 * 1000) / points;
  const data: SensorData[] = [];
  let level = 72;

  // Deterministic-ish anomaly windows so charts look intentional.
  const anomalyAt = Math.floor(points * 0.32);
  const leakAt = Math.floor(points * 0.68);

  for (let i = 0; i < points; i++) {
    const t = new Date(now - (points - i) * stepMs);
    const hour = t.getHours();
    // Gentle diurnal draw: more usage morning + evening.
    const diurnal = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 3;
    level = clamp(level + randomBetween(-0.7, 0.7) - diurnal * 0.05, 45, 92);

    let anomalyScore = round(randomBetween(0.04, 0.15), 3);
    let aiStatus: AIStatus = 'NORMAL';
    let leakDetected = false;

    if (i >= anomalyAt && i < anomalyAt + 4) {
      level = clamp(level - (i - anomalyAt) * 6, 20, 92);
      anomalyScore = round(randomBetween(0.62, 0.88), 3);
      aiStatus = 'ANOMALY';
    }
    if (i >= leakAt && i < leakAt + 3) {
      level = clamp(level - (i - leakAt) * 9, 8, 92);
      anomalyScore = round(randomBetween(0.7, 0.95), 3);
      aiStatus = 'ANOMALY';
      leakDetected = true;
    }

    data.push(
      makeReading(
        {
          timestamp: t.toISOString(),
          waterLevel: level,
          anomalyScore,
          aiStatus,
          leakDetected,
        },
        tankHeight,
      ),
    );
  }
  return data;
}

// --- Static comparison series for the AI Analysis page ---------------------

export const NORMAL_PATTERN_SERIES = [72, 71, 72, 73, 71, 72];
export const ABNORMAL_PATTERN_SERIES = [72, 71, 69, 55, 32, 10];

export const ANOMALY_POSSIBLE_CAUSES = [
  'Possible leakage in the pipeline or tank',
  'Rapid water-level change (high draw or fast drain)',
  'Ultrasonic sensor fault or obstruction',
  'Unexpected system behavior requiring inspection',
];

// --- Scenario metadata (used by Demo Mode) ---------------------------------

export const SCENARIOS: Record<
  Scenario,
  { label: string; description: string }
> = {
  NORMAL: {
    label: 'Normal Operation',
    description: 'Stable water level, dry leak sensor, AI reports normal.',
  },
  LEAK: {
    label: 'Water Leak',
    description:
      'Water level drops rapidly, leak sensor wet, AI flags an anomaly.',
  },
  ANOMALY: {
    label: 'Sensor Anomaly',
    description:
      'Leak sensor stays dry but ultrasonic readings become erratic; AI flags an anomaly.',
  },
};

// --- Seed alerts -----------------------------------------------------------

export function seedAlerts(): Alert[] {
  const now = Date.now();
  return [
    {
      id: 'alert-seed-1',
      severity: 'info',
      type: 'CONNECTIVITY',
      title: 'System reconnected',
      message: 'Raspberry Pi re-established the sensor data link.',
      timestamp: new Date(now - 1000 * 60 * 42).toISOString(),
      sensor: 'Raspberry Pi',
      status: 'resolved',
    },
    {
      id: 'alert-seed-2',
      severity: 'warning',
      type: 'AI_ANOMALY',
      title: 'Abnormal water-level change',
      message:
        'AI observed a faster-than-usual decrease in water level. Automatically cleared after readings stabilized.',
      timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      sensor: 'Ultrasonic Sensor',
      status: 'resolved',
    },
    {
      id: 'alert-seed-3',
      severity: 'info',
      type: 'SYSTEM',
      title: 'Calibration completed',
      message: 'Ultrasonic sensor calibration finished successfully.',
      timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      sensor: 'System',
      status: 'resolved',
    },
  ];
}

export function seedLeakEvents(): LeakEvent[] {
  const now = Date.now();
  return [
    {
      id: 'leak-1',
      start: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
      end: new Date(now - 1000 * 60 * 60 * 29.6).toISOString(),
      durationMinutes: 24,
      resolved: true,
    },
    {
      id: 'leak-2',
      start: new Date(now - 1000 * 60 * 60 * 74).toISOString(),
      end: new Date(now - 1000 * 60 * 60 * 73.8).toISOString(),
      durationMinutes: 12,
      resolved: true,
    },
  ];
}
