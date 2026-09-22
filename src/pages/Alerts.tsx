import { useMemo, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { AlertList } from '@/components/alerts/AlertList';
import type { AlertSeverity, AlertStatus } from '@/types';

type SeverityFilter = 'all' | AlertSeverity;
type StatusFilter = 'all' | AlertStatus;
type DateFilter = 'all' | 'today' | '7d';

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap rounded-lg border border-white/5 bg-navy-900/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
              ? 'bg-accent-500/20 text-accent-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Alerts() {
  const { alerts, resolveAlert, resolveAllAlerts } = useSystem();
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateFilter>('all');
  const [type, setType] = useState<string>('all');

  const types = useMemo(
    () => ['all', ...Array.from(new Set(alerts.map((a) => a.type)))],
    [alerts],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return alerts.filter((a) => {
      if (severity !== 'all' && a.severity !== severity) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (type !== 'all' && a.type !== type) return false;
      if (dateRange !== 'all') {
        const age = now - new Date(a.timestamp).getTime();
        const limit = dateRange === 'today' ? 864e5 : 7 * 864e5;
        if (age > limit) return false;
      }
      return true;
    });
  }, [alerts, severity, status, type, dateRange]);

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div>
      <PageHeader
        title="Alert Center"
        subtitle="Active and historical alerts from sensors and the AI model."
        phase="INTERACT"
        actions={
          activeCount > 0 ? (
            <button onClick={resolveAllAlerts} className="btn-ghost text-xs">
              <CheckCheck className="h-4 w-4" /> Resolve all
            </button>
          ) : undefined
        }
      />

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active', value: activeCount, cls: 'text-danger-400' },
          {
            label: 'Critical',
            value: alerts.filter((a) => a.severity === 'critical').length,
            cls: 'text-danger-400',
          },
          {
            label: 'Warnings',
            value: alerts.filter((a) => a.severity === 'warning').length,
            cls: 'text-warn-400',
          },
          { label: 'Total', value: alerts.length, cls: 'text-white' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="section-title">{s.label}</div>
            <div className={`stat-value mt-1 text-2xl ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-navy-850/60 p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex flex-col gap-1">
          <span className="section-title">Severity</span>
          <Segmented
            value={severity}
            onChange={setSeverity}
            options={[
              { value: 'all', label: 'All' },
              { value: 'critical', label: 'Critical' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="section-title">Status</span>
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="section-title">Date</span>
          <Segmented
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: 'all', label: 'All time' },
              { value: 'today', label: 'Today' },
              { value: '7d', label: '7 days' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="section-title">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-white/10 bg-navy-900/60 px-3 py-1.5 text-xs text-slate-200 focus:border-accent-500/50 focus:outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t} className="bg-navy-850">
                {t === 'all' ? 'All types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AlertList
        alerts={filtered}
        onResolve={resolveAlert}
        emptyLabel="No alerts match the current filters."
      />
    </div>
  );
}
