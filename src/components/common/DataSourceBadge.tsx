import { Radio, FlaskConical, Usb } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { SCENARIOS } from '@/data/mockData';

/**
 * Honest data-source indicator, so simulated data is never mistaken for real
 * hardware measurements:
 *   - DEMO MODE  : scenario-driven data for a presentation
 *   - LIVE Arduino : real readings from the Arduino over USB (Web Serial)
 *   - LIVE simulated : the built-in mock stream (no hardware connected)
 */
export function DataSourceBadge({ compact = false }: { compact?: boolean }) {
  const { demoMode, scenario, dataSource } = useSystem();

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

  const hardware = dataSource === 'HARDWARE';

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-normal-500/30 bg-normal-500/10 px-3 py-1.5"
      title={
        hardware
          ? 'Live readings from the Arduino over USB.'
          : 'Live simulated stream. No hardware connected — plug in the Arduino and click Connect.'
      }
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-normal-500 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-normal-500" />
      </span>
      {hardware ? (
        <Usb className="h-3.5 w-3.5 text-normal-400" />
      ) : (
        <Radio className="h-3.5 w-3.5 text-normal-400" />
      )}
      <span className="text-xs font-bold uppercase tracking-wider text-normal-400">
        Live
      </span>
      {!compact && (
        <span className="text-[11px] font-medium text-normal-400/70">
          · {hardware ? 'Arduino' : 'simulated'}
        </span>
      )}
    </div>
  );
}
