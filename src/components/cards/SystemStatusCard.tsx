import { Server, CircuitBoard, Cpu, Wifi } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { StatusBadge, type Tone } from '@/components/common/StatusBadge';
import type { ConnectionState, SystemStatus } from '@/types';

const SYSTEM_TONE: Record<SystemStatus['system'], Tone> = {
  OPERATIONAL: 'normal',
  WARNING: 'warn',
  OFFLINE: 'danger',
};

function ConnRow({
  icon: Icon,
  label,
  state,
}: {
  icon: typeof Cpu;
  label: string;
  state: ConnectionState;
}) {
  const ok = state === 'CONNECTED';
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
          ok ? 'text-normal-400' : 'text-danger-400'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-normal-500' : 'bg-danger-500'}`}
        />
        {ok ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

export function SystemStatusCard({ status }: { status: SystemStatus }) {
  const tone = SYSTEM_TONE[status.system];
  return (
    <StatusCard
      icon={Server}
      label="System"
      tone={tone}
      badge={
        <StatusBadge tone={tone} pulse={status.system === 'OPERATIONAL'}>
          {status.system}
        </StatusBadge>
      }
    >
      <div className="space-y-0.5 py-1">
        <ConnRow icon={CircuitBoard} label="Arduino" state={status.arduino} />
        <ConnRow icon={Cpu} label="Raspberry Pi" state={status.raspberryPi} />
        <ConnRow icon={Wifi} label="Wi-Fi" state={status.wifi} />
      </div>
    </StatusCard>
  );
}
