import { Menu, Cpu, Wifi, CircuitBoard, FlaskConical, RefreshCw } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { useNow } from '@/hooks/useNow';
import { timeAgo } from '@/lib/format';
import { StatusBadge, type Tone } from '@/components/common/StatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import type { ConnectionState, SystemState } from '@/types';

interface Props {
  onMenuClick: () => void;
  onDemoClick: () => void;
}

const SYSTEM_TONE: Record<SystemState, Tone> = {
  OPERATIONAL: 'normal',
  WARNING: 'warn',
  OFFLINE: 'danger',
};

const SYSTEM_LABEL: Record<SystemState, string> = {
  OPERATIONAL: 'System Operational',
  WARNING: 'System Warning',
  OFFLINE: 'System Offline',
};

function ConnPill({
  icon: Icon,
  label,
  state,
}: {
  icon: typeof Cpu;
  label: string;
  state: ConnectionState;
}) {
  const connected = state === 'CONNECTED';
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-white/5 bg-navy-850/60 px-2.5 py-1.5"
      title={`${label}: ${connected ? 'Connected' : 'Disconnected'}`}
    >
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="hidden text-xs font-medium text-slate-300 xl:inline">
        {label}
      </span>
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? 'bg-normal-500' : 'bg-danger-500'
        }`}
      />
    </div>
  );
}

export function Header({ onMenuClick, onDemoClick }: Props) {
  const { systemStatus, demoMode } = useSystem();
  const now = useNow(1000);

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-navy-900/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* System status */}
        <StatusBadge
          tone={SYSTEM_TONE[systemStatus.system]}
          pulse={systemStatus.system === 'OPERATIONAL'}
          className="whitespace-nowrap uppercase tracking-wide"
        >
          {SYSTEM_LABEL[systemStatus.system]}
        </StatusBadge>

        {/* Connection pills */}
        <div className="hidden items-center gap-2 md:flex">
          <ConnPill icon={CircuitBoard} label="Arduino" state={systemStatus.arduino} />
          <ConnPill icon={Cpu} label="Raspberry Pi" state={systemStatus.raspberryPi} />
          <ConnPill icon={Wifi} label="Wi-Fi" state={systemStatus.wifi} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              Updated {timeAgo(systemStatus.lastUpdated, now)}
            </span>
          </div>

          <DataSourceBadge compact />

          <button
            onClick={onDemoClick}
            className={`btn px-3 py-2 text-xs ${
              demoMode
                ? 'bg-warn-500/20 text-warn-300 ring-1 ring-inset ring-warn-500/40 hover:bg-warn-500/30'
                : 'btn-ghost'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
