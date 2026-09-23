import { useState } from 'react';
import { Waves, Usb } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { useWaterLevelSeries } from '@/hooks/useWaterLevelSeries';
import { SensorChart } from './SensorChart';
import { Stat } from '@/components/common/Stat';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import type { TimeRange } from '@/types';

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1m', label: '1 min' },
  { value: '10m', label: '10 min' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
];

interface Props {
  title?: string;
  height?: number;
}

export function RealTimeWaterChart({
  title = 'Real-Time Water Level',
  height = 300,
}: Props) {
  const { history, currentReading, hasData } = useSystem();
  const [range, setRange] = useState<TimeRange>('10m');
  const series = useWaterLevelSeries(history, range);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
            <Waves className="h-[18px] w-[18px] text-accent-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <div className="text-xs text-slate-400">Live rolling window</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge compact />
          <div className="flex rounded-lg border border-white/5 bg-navy-900/60 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  range === r.value
                    ? 'bg-accent-500/20 text-accent-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasData ? (
        <>
          <SensorChart
            data={series.points}
            color="#3cc6c6"
            height={height}
            unit="%"
            yDomain={[0, 100]}
            seriesName="Water Level"
            gradientId="waterLevelGradient"
            referenceLines={[{ y: 20, label: 'Low', color: 'rgba(245,158,11,0.55)' }]}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Current"
              value={`${Math.round(currentReading.waterLevel)}%`}
              valueClass="text-accent-400"
            />
            <Stat label="Minimum" value={`${series.min}%`} />
            <Stat label="Maximum" value={`${series.max}%`} />
            <Stat label="Average" value={`${series.avg}%`} />
          </div>
        </>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-navy-900/40 text-center"
          style={{ height: height + 76 }}
        >
          <Usb className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">Waiting for Arduino…</p>
          <p className="max-w-xs text-xs text-slate-500">
            Connect the Arduino (button in the top bar) to see the live water
            level, or turn on Demo Mode to preview.
          </p>
        </div>
      )}
    </div>
  );
}
