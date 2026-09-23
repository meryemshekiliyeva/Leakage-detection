import { useMemo } from 'react';
import type { SensorData, TimeRange } from '@/types';
import type { ChartPoint } from '@/components/charts/SensorChart';

export interface SeriesResult {
  points: ChartPoint[];
  current: number;
  min: number;
  max: number;
  avg: number;
}

function label(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const RANGE_POINTS: Record<TimeRange, number> = {
  '1m': 30,
  '10m': 90,
  '1h': 150,
  '24h': 150,
};

/**
 * Builds the water-level chart series from the LIVE rolling history only, so the
 * chart always reflects real data (from the Arduino or Demo Mode) and never
 * invents values. The range simply selects how many recent points to show.
 */
export function useWaterLevelSeries(
  liveHistory: SensorData[],
  range: TimeRange,
): SeriesResult {
  return useMemo(() => {
    const source = liveHistory.slice(-RANGE_POINTS[range]);

    const points: ChartPoint[] = source.map((r) => ({
      label: label(r.timestamp),
      value: r.waterLevel,
    }));

    const values = source.map((r) => r.waterLevel);
    const current = values.length ? values[values.length - 1] : 0;
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    return {
      points,
      current: Math.round(current),
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
    };
  }, [liveHistory, range]);
}
