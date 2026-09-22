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
}: {
  reading: SensorData;
  volumeLiters?: number;
}) {
  const status = waterLevelStatus(reading.waterLevel);
  return (
    <StatusCard
      icon={Waves}
      label="Water Level"
      tone={status.tone}
      badge={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      footer={
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Distance to surface</span>
            <span className="stat-value">{reading.distance} cm</span>
          </div>
          {volumeLiters !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Volume</span>
              <span className="stat-value">{volumeLiters.toFixed(2)} L</span>
            </div>
          )}
        </div>
      }
    >
      <div className="flex items-center justify-center py-1">
        <CircularProgress
          value={reading.waterLevel}
          colorClass={ARC_COLOR[status.tone]}
          label={`${Math.round(reading.waterLevel)}%`}
          sublabel="of tank"
        />
      </div>
    </StatusCard>
  );
}
