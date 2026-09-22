import { Radio, FlaskConical } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { SCENARIOS } from '@/data/mockData';

/**
 * Honest data-source indicator. This prototype has no hardware attached, so the
 * stream is always SIMULATED. When Demo Mode is on we surface the active
 * scenario; otherwise we show a LIVE (simulated) stream. This is how the UI
 * keeps simulated data clearly distinct from real hardware measurements.
 */
export function DataSourceBadge({ compact = false }: { compact?: boolean }) {
  const { demoMode, scenario } = useSystem();

  if (demoMode) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border border-warn-500/30 bg-warn-500/10 px-3 py-1.5"
        title="Demo Mode: values are driven by a chosen scenario for presentation."
      >
        <FlaskConical className="h-3.5 w-3.5 text-warn-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-warn-400">
          Demo Mode
        </span>
        {!compact && (
          <span className="text-xs font-medium text-warn-400/80">
            · {SCENARIOS[scenario].label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-normal-500/30 bg-normal-500/10 px-3 py-1.5"
      title="Live simulated stream. No physical hardware is connected in this prototype."
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-normal-500 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-normal-500" />
      </span>
      <Radio className="h-3.5 w-3.5 text-normal-400" />
      <span className="text-xs font-bold uppercase tracking-wider text-normal-400">
        Live
      </span>
      {!compact && (
        <span className="text-[11px] font-medium text-normal-400/70">
          · simulated
        </span>
      )}
    </div>
  );
}
