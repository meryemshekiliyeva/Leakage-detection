import { useMemo } from 'react';
import type { SensorData, TimeRange } from '@/types';
import { seedHistory, generateHistoricalData } from '@/data/mockData';
import type { ChartPoint } from '@/components/charts/SensorChart';

export interface SeriesResult {
  points: ChartPoint[];
  current: number;
  min: number;
  max: number;
  avg: number;
}

function label(iso: string, range: TimeRange): string {
  const d = new Date(iso);
  if (range === '1h' || range === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Builds the water-level chart series for a given time range.
 *
 * Short ranges (1m / 10m) use the LIVE rolling history from context so the
 * chart animates with the stream. Longer ranges (1h / 24h) represent stored
 * history and use a seeded dataset — this mirrors how a real deployment would
 * fetch aggregated history from the Raspberry Pi rather than keep every raw
 * sample in memory.
 */
export function useWaterLevelSeries(
  liveHistory: SensorData[],
  range: TimeRange,
  tankHeight: number,
): SeriesResult {
  return useMemo(() => {
    let source: SensorData[];
    if (range === '1m') {
      source = liveHistory.slice(-30);
    } else if (range === '10m') {
      source = liveHistory.slice(-120);
    } else if (range === '1h') {
      source = seedHistory(60, 60, tankHeight);
    } else {
      source = generateHistoricalData(96, 24, tankHeight);
    }

    const points: ChartPoint[] = source.map((r) => ({
      label: label(r.timestamp, range),
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
  }, [liveHistory, range, tankHeight]);
}
