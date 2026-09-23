import { FlaskConical, Usb, WifiOff } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { SCENARIOS } from '@/data/mockData';

/**
 * Honest data-source indicator, so simulated data is never mistaken for real
 * hardware measurements:
 *   - DEMO MODE     : scenario-driven data for a presentation
 *   - LIVE · Arduino : real readings from the Arduino over USB (Web Serial)
 *   - NO SIGNAL     : nothing connected — the app is waiting for the Arduino
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

  // Real hardware connected.
  if (dataSource === 'HARDWARE') {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border border-normal-500/30 bg-normal-500/10 px-3 py-1.5"
        title="Live readings from the Arduino over USB."
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-normal-500 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-normal-500" />
        </span>
        <Usb className="h-3.5 w-3.5 text-normal-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-normal-400">
          Live
        </span>
        {!compact && (
          <span className="text-[11px] font-medium text-normal-400/70">· Arduino</span>
        )}
      </div>
    );
  }

  // Nothing connected — waiting for the Arduino.
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
      title="No hardware connected. Plug in the Arduino and click Connect, or turn on Demo Mode."
    >
      <WifiOff className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        No Signal
      </span>
    </div>
  );
}
