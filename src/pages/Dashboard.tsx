import { Link } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { WaterLevelCard } from '@/components/cards/WaterLevelCard';
import { LeakStatusCard } from '@/components/cards/LeakStatusCard';
import { AIStatusCard } from '@/components/cards/AIStatusCard';
import { SystemStatusCard } from '@/components/cards/SystemStatusCard';
import { RealTimeWaterChart } from '@/components/charts/RealTimeWaterChart';
import { AlertCard } from '@/components/alerts/AlertCard';

export function Dashboard() {
  const { currentReading, aiAnalysis, systemStatus, alerts, resolveAlert } =
    useSystem();

  const recentAlerts = alerts.slice(0, 3);

  return (
    <div>
      <PageHeader
        title="System Dashboard"
        subtitle="Live overview of water level, leakage, AI analysis and system health."
        phase="MONITOR"
      />

      {/* Four primary status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterLevelCard reading={currentReading} />
        <LeakStatusCard reading={currentReading} />
        <AIStatusCard analysis={aiAnalysis} />
        <SystemStatusCard status={systemStatus} />
      </div>

      {/* Real-time chart */}
      <div className="mt-4">
        <RealTimeWaterChart />
      </div>

      {/* Recent activity + AI pipeline teaser */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300"
            >
              View all alerts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((a) => (
                <AlertCard key={a.id} alert={a} onResolve={resolveAlert} />
              ))
            ) : (
              <div className="card flex items-center gap-3 p-5 text-sm text-slate-400">
                <Activity className="h-5 w-5 text-normal-400" />
                All systems nominal. No recent alerts.
              </div>
            )}
          </div>
        </div>

        {/* Monitor -> Think -> Interact story card */}
        <div className="card flex flex-col p-5">
          <h2 className="text-base font-semibold text-white">How it works</h2>
          <p className="mt-1 text-xs text-slate-400">
            The system follows a simple, continuous loop.
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                phase: 'Monitor',
                color: 'text-accent-400',
                dot: 'bg-accent-400',
                text: 'Arduino reads the ultrasonic and water-leak sensors in real time.',
              },
              {
                phase: 'Think',
                color: 'text-cyanx-400',
                dot: 'bg-cyanx-400',
                text: 'Raspberry Pi processes the data and runs AI anomaly detection.',
              },
              {
                phase: 'Interact',
                color: 'text-warn-400',
                dot: 'bg-warn-400',
                text: 'The dashboard, alerts and control panel keep you informed and in control.',
              },
            ].map((s, i) => (
              <div key={s.phase} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {i < 2 && <span className="my-1 h-full w-px bg-white/10" />}
                </div>
                <div className="pb-1">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                  >
                    {s.phase}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-300">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/architecture"
            className="btn-ghost mt-4 w-full text-xs"
          >
            View system architecture <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
