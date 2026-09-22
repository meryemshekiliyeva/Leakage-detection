import { CheckCircle2, Droplets, Activity, Waves, Pause, Play, Power } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { SCENARIOS } from '@/data/mockData';
import type { Scenario } from '@/types';

const SCENARIO_ICON: Record<Scenario, typeof Waves> = {
  NORMAL: Waves,
  LEAK: Droplets,
  ANOMALY: Activity,
};

const SCENARIO_ACCENT: Record<
  Scenario,
  { ring: string; icon: string; bg: string }
> = {
  NORMAL: { ring: 'ring-normal-500/50', icon: 'text-normal-400', bg: 'bg-normal-500/10' },
  LEAK: { ring: 'ring-danger-500/50', icon: 'text-danger-400', bg: 'bg-danger-500/10' },
  ANOMALY: { ring: 'ring-warn-500/50', icon: 'text-warn-400', bg: 'bg-warn-500/10' },
};

/**
 * The presentation control surface. Lets the presenter switch between the
 * Normal / Water Leak / Sensor Anomaly scenarios so the whole UI reacts live.
 */
export function DemoModePanel() {
  const { demoMode, scenario, paused, setDemoMode, setScenario, setPaused } =
    useSystem();

  return (
    <div className="space-y-5">
      {/* Master toggle */}
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-navy-900/60 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              demoMode ? 'bg-warn-500/20 text-warn-400' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Power className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Demo Mode</div>
            <div className="text-xs text-slate-400">
              {demoMode
                ? 'Scenario-driven data for presentation'
                : 'Live simulated stream'}
            </div>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={demoMode}
          onClick={() => setDemoMode(!demoMode)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            demoMode ? 'bg-warn-500' : 'bg-navy-700'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              demoMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Scenarios */}
      <div>
        <div className="section-title mb-2">Scenarios</div>
        <div className="space-y-2">
          {(Object.keys(SCENARIOS) as Scenario[]).map((key) => {
            const Icon = SCENARIO_ICON[key];
            const accent = SCENARIO_ACCENT[key];
            const active = demoMode && scenario === key;
            return (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  active
                    ? `border-transparent ${accent.bg} ring-2 ${accent.ring}`
                    : 'border-white/5 bg-navy-900/40 hover:bg-white/5'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.bg} ${accent.icon}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {SCENARIOS[key].label}
                    </span>
                    {active && (
                      <CheckCircle2 className={`h-4 w-4 ${accent.icon}`} />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {SCENARIOS[key].description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pause / resume the stream */}
      <button
        onClick={() => setPaused(!paused)}
        className="btn-ghost w-full"
      >
        {paused ? (
          <>
            <Play className="h-4 w-4" /> Resume Data Stream
          </>
        ) : (
          <>
            <Pause className="h-4 w-4" /> Pause Data Stream
          </>
        )}
      </button>

      <p className="rounded-lg border border-white/5 bg-navy-900/40 p-3 text-[11px] leading-relaxed text-slate-500">
        All values in this prototype are simulated. No physical Arduino or
        Raspberry Pi is connected. Demo Mode lets you show how the interface
        reacts to real-world conditions during a presentation.
      </p>
    </div>
  );
}
