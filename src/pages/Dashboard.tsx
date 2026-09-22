import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { WaterLevelCard } from '@/components/cards/WaterLevelCard';
import { LeakStatusCard } from '@/components/cards/LeakStatusCard';
import { AIStatusCard } from '@/components/cards/AIStatusCard';
import { SystemStatusCard } from '@/components/cards/SystemStatusCard';
import { RealTimeWaterChart } from '@/components/charts/RealTimeWaterChart';
import { distanceToVolumeLiters } from '@/data/mockData';

export function Dashboard() {
  const { currentReading, aiAnalysis, systemStatus, settings } = useSystem();

  const volumeLiters = distanceToVolumeLiters(
    currentReading.distance,
    settings.tankHeight,
    settings.tankCrossSection,
  );

  return (
    <div>
      <PageHeader
        title="System Dashboard"
        subtitle="Live overview of water level, leakage, AI analysis and system health."
        phase="MONITOR"
      />

      {/* Four primary status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterLevelCard reading={currentReading} volumeLiters={volumeLiters} />
        <LeakStatusCard reading={currentReading} />
        <AIStatusCard analysis={aiAnalysis} />
        <SystemStatusCard status={systemStatus} />
      </div>

      {/* Real-time chart */}
      <div className="mt-4">
        <RealTimeWaterChart />
      </div>

      {/* Monitor -> Think -> Interact story */}
      <div className="mt-4 card p-5">
        <h2 className="text-base font-semibold text-white">How it works</h2>
        <p className="mt-1 text-xs text-slate-400">
          The system follows a simple, continuous loop.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              text: 'The AI analyzes the readings and detects unusual patterns.',
            },
            {
              phase: 'Interact',
              color: 'text-warn-400',
              dot: 'bg-warn-400',
              text: 'The dashboard and control panel keep you informed and in control.',
            },
          ].map((s) => (
            <div
              key={s.phase}
              className="rounded-xl border border-white/5 bg-navy-900/50 p-4"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                >
                  {s.phase}
                </span>
              </div>
              <p className="text-sm text-slate-300">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
