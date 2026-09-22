import { AlertOctagon, AlertTriangle, Info, Check } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { timeAgo, shortDateTime } from '@/lib/format';
import type { Alert, AlertSeverity } from '@/types';

const SEVERITY_META: Record<
  AlertSeverity,
  { icon: typeof Info; ring: string; bg: string; text: string; label: string }
> = {
  critical: {
    icon: AlertOctagon,
    ring: 'ring-danger-500/30',
    bg: 'bg-danger-500/10',
    text: 'text-danger-400',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'ring-warn-500/30',
    bg: 'bg-warn-500/10',
    text: 'text-warn-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    ring: 'ring-cyanx-500/30',
    bg: 'bg-cyanx-500/10',
    text: 'text-cyanx-400',
    label: 'Information',
  },
};

interface Props {
  alert: Alert;
  onResolve?: (id: string) => void;
}

export function AlertCard({ alert, onResolve }: Props) {
  const now = useNow(5000);
  const meta = SEVERITY_META[alert.severity];
  const Icon = meta.icon;
  const resolved = alert.status === 'resolved';

  return (
    <div
      className={`card p-4 ring-1 ring-inset ${resolved ? 'opacity-60 ring-white/5' : meta.ring}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
        >
          <Icon className={`h-5 w-5 ${meta.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold text-white`}>
              {alert.title}
            </span>
            <span
              className={`pill ${meta.bg} ${meta.text} ring-1 ring-inset ${meta.ring}`}
            >
              {meta.label}
            </span>
            {resolved ? (
              <span className="pill bg-white/5 text-slate-400 ring-1 ring-inset ring-white/10">
                Resolved
              </span>
            ) : (
              <span className="pill bg-normal-500/10 text-normal-400 ring-1 ring-inset ring-normal-500/30">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-300">{alert.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span title={shortDateTime(alert.timestamp)}>
              {timeAgo(alert.timestamp, now)}
            </span>
            <span>Sensor: {alert.sensor}</span>
            <span>Type: {alert.type}</span>
          </div>
        </div>
        {!resolved && onResolve && (
          <button
            onClick={() => onResolve(alert.id)}
            className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" /> Resolve
          </button>
        )}
      </div>
    </div>
  );
}
