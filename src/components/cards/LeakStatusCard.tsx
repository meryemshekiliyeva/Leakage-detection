import { Droplets, ShieldCheck, ShieldAlert } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { clockTime } from '@/lib/format';
import type { SensorData } from '@/types';

export function LeakStatusCard({ reading }: { reading: SensorData }) {
  const leak = reading.leakDetected;
  return (
    <StatusCard
      icon={Droplets}
      label="Leak Sensor"
      tone={leak ? 'danger' : 'normal'}
      alarm={leak}
      badge={
        <StatusBadge tone={leak ? 'danger' : 'normal'} pulse={leak}>
          {leak ? 'LEAK ALERT' : 'NO LEAK'}
        </StatusBadge>
      }
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {leak ? 'Detected at' : 'Last check'}
          </span>
          <span className="stat-value">{clockTime(reading.timestamp)}</span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-3 text-center">
        {leak ? (
          <ShieldAlert className="mb-2 h-12 w-12 text-danger-400" />
        ) : (
          <ShieldCheck className="mb-2 h-12 w-12 text-normal-400" />
        )}
        <div
          className={`stat-value text-3xl ${
            leak ? 'text-danger-400' : 'text-normal-400'
          }`}
        >
          {leak ? 'WATER DETECTED' : 'DRY'}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          {leak ? 'Immediate attention required' : 'No leak detected'}
        </div>
      </div>
    </StatusCard>
  );
}
