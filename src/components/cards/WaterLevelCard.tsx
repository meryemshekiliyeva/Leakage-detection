import { Waves } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { CircularProgress } from '@/components/common/CircularProgress';
import { StatusBadge, type Tone } from '@/components/common/StatusBadge';
import type { SensorData } from '@/types';

export function waterLevelStatus(level: number): { label: string; tone: Tone } {
  if (level < 20) return { label: 'CRITICAL LOW', tone: 'danger' };
  if (level < 35) return { label: 'LOW', tone: 'warn' };
  if (level > 90) return { label: 'HIGH', tone: 'warn' };
  return { label: 'NORMAL', tone: 'normal' };
}

const ARC_COLOR: Record<Tone, string> = {
  normal: 'text-accent-400',
  warn: 'text-warn-400',
  danger: 'text-danger-400',
  info: 'text-cyanx-400',
  neutral: 'text-accent-400',
};

export function WaterLevelCard({
  reading,
  volumeLiters,
  awaiting = false,
}: {
  reading: SensorData;
  volumeLiters?: number;
  awaiting?: boolean;
}) {
  const status = waterLevelStatus(reading.waterLevel);
  const tone: Tone = awaiting ? 'neutral' : status.tone;
  return (
    <StatusCard
      icon={Waves}
      label="Water Level"
      tone={tone}
      badge={
        <StatusBadge tone={tone} dot={!awaiting}>
          {awaiting ? 'NO DATA' : status.label}
        </StatusBadge>
      }
      footer={
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Distance to surface</span>
            <span className="stat-value">
              {awaiting ? '—' : `${reading.distance} cm`}
            </span>
          </div>
          {(awaiting || volumeLiters !== undefined) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Volume</span>
              <span className="stat-value">
                {awaiting ? '—' : `${volumeLiters!.toFixed(2)} L`}
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="flex items-center justify-center py-1">
        <CircularProgress
          value={awaiting ? 0 : reading.waterLevel}
          colorClass={awaiting ? 'text-slate-600' : ARC_COLOR[status.tone]}
          label={awaiting ? '—' : `${Math.round(reading.waterLevel)}%`}
          sublabel={awaiting ? 'no data' : 'of tank'}
        />
      </div>
    </StatusCard>
  );
}
