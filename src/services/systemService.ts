// ---------------------------------------------------------------------------
// systemService — system/link health API boundary.
// ---------------------------------------------------------------------------

import type { SensorData, SystemStatus } from '@/types';

const latency = <T>(value: T, ms = 100): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/** Current health of the system and its connections. */
export async function getSystemStatus(): Promise<SystemStatus> {
  return latency({
    system: 'OPERATIONAL',
    arduino: 'CONNECTED',
    raspberryPi: 'CONNECTED',
    wifi: 'CONNECTED',
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Derive the overall system state from the latest reading. A leak or AI
 * anomaly escalates the system to WARNING while links stay connected.
 */
export function deriveSystemStatus(
  reading: SensorData | null,
  base: SystemStatus,
): SystemStatus {
  if (!reading) return base;
  const warning = reading.leakDetected || reading.aiStatus === 'ANOMALY';
  return {
    ...base,
    system:
      base.arduino === 'DISCONNECTED' || base.raspberryPi === 'DISCONNECTED'
        ? 'OFFLINE'
        : warning
          ? 'WARNING'
          : 'OPERATIONAL',
    lastUpdated: reading.timestamp,
  };
}
