import { Droplets, ShieldCheck, ShieldAlert, Clock, Hash, Activity } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { useNow } from '@/hooks/useNow';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { timeAgo, shortDateTime, clockTime } from '@/lib/format';

export function Leakage() {
  const { currentReading, leakEvents } = useSystem();
  const now = useNow(2000);
  const leak = currentReading.leakDetected;

  const lastEvent = leakEvents[0];
  const details = [
    {
      icon: Droplets,
      label: 'Sensor State',
      value: leak ? 'WET' : 'DRY',
      tone: leak ? 'text-danger-400' : 'text-normal-400',
    },
    {
      icon: Clock,
      label: 'Last Detection',
      value: lastEvent ? shortDateTime(lastEvent.start) : 'None',
      tone: 'text-white',
    },
    {
      icon: Hash,
      label: 'Detection Count',
      value: String(leakEvents.length),
      tone: 'text-white',
    },
    {
      icon: Activity,
      label: 'Last Update',
      value: clockTime(currentReading.timestamp),
      tone: 'text-white',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leakage Monitoring"
        subtitle="Dedicated water-leak sensor status and detection history."
        phase="MONITOR"
        actions={
          <StatusBadge tone={leak ? 'danger' : 'normal'} pulse={leak}>
            {leak ? 'LEAK ACTIVE' : 'SAFE'}
          </StatusBadge>
        }
      />

      {/* Big status hero */}
      <div
        className={`card relative overflow-hidden p-8 ${
          leak ? 'ring-1 ring-inset ring-danger-500/40 shadow-glow-danger' : ''
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full ${
              leak ? 'bg-danger-500/15' : 'bg-normal-500/15'
            }`}
          >
            {leak ? (
              <ShieldAlert className="h-12 w-12 text-danger-400" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-normal-400" />
            )}
          </div>
          <div>
            <div
              className={`stat-value text-4xl ${
                leak ? 'text-danger-400' : 'text-normal-400'
              }`}
            >
              {leak ? 'WATER LEAK DETECTED' : 'DRY'}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {leak
                ? `Immediate attention required — detected at ${clockTime(
                    currentReading.timestamp,
                  )}.`
                : 'The water-leak sensor is dry. No leak detected.'}
            </p>
          </div>
        </div>
      </div>

      {/* Detail metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {details.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.label} className="card p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-[18px] w-[18px] text-slate-400" />
                </div>
                <span className="section-title">{d.label}</span>
              </div>
              <div className={`stat-value mt-3 text-xl ${d.tone}`}>{d.value}</div>
            </div>
          );
        })}
      </div>

      {/* Detection timeline */}
      <div className="mt-4 card p-5">
        <h2 className="mb-4 text-base font-semibold text-white">
          Leak Detection History
        </h2>
        {leakEvents.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-sm text-slate-400">
            <ShieldCheck className="h-5 w-5 text-normal-400" />
            No leak events recorded.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-white/10 pl-6">
            {leakEvents.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                    e.resolved ? 'bg-warn-500' : 'bg-danger-500'
                  }`}
                >
                  {!e.resolved && (
                    <span className="absolute h-full w-full animate-pulseRing rounded-full bg-danger-500 opacity-60" />
                  )}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-white">
                    {e.resolved ? 'Leak resolved' : 'Leak detected'}
                  </span>
                  <StatusBadge tone={e.resolved ? 'warn' : 'danger'} dot={false}>
                    {e.resolved ? `${e.durationMinutes} min` : 'Ongoing'}
                  </StatusBadge>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Started {shortDateTime(e.start)} · {timeAgo(e.start, now)}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
