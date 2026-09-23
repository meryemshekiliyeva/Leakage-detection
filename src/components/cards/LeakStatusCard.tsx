import { Droplets, ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { clockTime } from '@/lib/format';
import type { SensorData } from '@/types';

export function LeakStatusCard({
  reading,
  awaiting = false,
}: {
  reading: SensorData;
  awaiting?: boolean;
}) {
  const leak = reading.leakDetected;
  return (
    <StatusCard
      icon={Droplets}
      label="Leak Sensor"
      tone={awaiting ? 'neutral' : leak ? 'danger' : 'normal'}
      alarm={!awaiting && leak}
      badge={
        <StatusBadge
          tone={awaiting ? 'neutral' : leak ? 'danger' : 'normal'}
          pulse={!awaiting && leak}
          dot={!awaiting}
        >
          {awaiting ? 'NO DATA' : leak ? 'LEAK ALERT' : 'NO LEAK'}
        </StatusBadge>
      }
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {awaiting ? 'Status' : leak ? 'Detected at' : 'Last check'}
          </span>
          <span className="stat-value">
            {awaiting ? '—' : clockTime(reading.timestamp)}
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-3 text-center">
        {awaiting ? (
          <HelpCircle className="mb-2 h-12 w-12 text-slate-600" />
        ) : leak ? (
          <ShieldAlert className="mb-2 h-12 w-12 text-danger-400" />
        ) : (
          <ShieldCheck className="mb-2 h-12 w-12 text-normal-400" />
        )}
        <div
          className={`stat-value text-3xl ${
            awaiting ? 'text-slate-500' : leak ? 'text-danger-400' : 'text-normal-400'
          }`}
        >
          {awaiting ? '—' : leak ? 'WATER DETECTED' : 'DRY'}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          {awaiting
            ? 'Waiting for Arduino'
            : leak
              ? 'Immediate attention required'
              : 'No leak detected'}
        </div>
      </div>
    </StatusCard>
  );
}
