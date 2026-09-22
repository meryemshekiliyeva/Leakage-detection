// ---------------------------------------------------------------------------
// alertService — alert generation + retrieval API boundary.
// ---------------------------------------------------------------------------

import type { AIAnalysis, Alert, SensorData } from '@/types';
import { seedAlerts } from '@/data/mockData';

let counter = 0;
const nextId = () => `alert-${Date.now()}-${counter++}`;

/** Fetch the current set of seed alerts. */
export async function getAlerts(): Promise<Alert[]> {
  return Promise.resolve(seedAlerts());
}

/**
 * Given a fresh reading + AI analysis and the previous reading, decide whether
 * a new alert should be raised. Returns null when nothing new happened, so the
 * caller only appends real transitions (no alert spam).
 */
export function evaluateAlert(
  reading: SensorData,
  analysis: AIAnalysis,
  prev: SensorData | null,
): Alert | null {
  const wasLeaking = prev?.leakDetected ?? false;
  const wasAnomaly = prev?.aiStatus === 'ANOMALY';

  // Rising edge of a leak -> critical alert.
  if (reading.leakDetected && !wasLeaking) {
    return {
      id: nextId(),
      severity: 'critical',
      type: 'LEAK',
      title: 'Water leak detected',
      message:
        'The water-leak sensor is wet. Immediate attention required to prevent water damage.',
      timestamp: reading.timestamp,
      sensor: 'Water Leak Sensor',
      status: 'active',
    };
  }

  // Rising edge of an AI anomaly (that is not a leak) -> warning alert.
  if (reading.aiStatus === 'ANOMALY' && !wasAnomaly && !reading.leakDetected) {
    return {
      id: nextId(),
      severity: 'warning',
      type: 'AI_ANOMALY',
      title: 'Abnormal water-level pattern',
      message: `AI flagged an anomaly (score ${Math.round(
        analysis.anomalyScore * 100,
      )}%). ${analysis.pattern}.`,
      timestamp: reading.timestamp,
      sensor: 'Ultrasonic Sensor',
      status: 'active',
    };
  }

  return null;
}
