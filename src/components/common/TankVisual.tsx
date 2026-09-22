import type { Tone } from './StatusBadge';

const FILL: Record<Tone, string> = {
  normal: 'from-accent-500/80 to-accent-400/40',
  warn: 'from-warn-500/80 to-warn-400/40',
  danger: 'from-danger-500/80 to-danger-400/40',
  info: 'from-cyanx-500/80 to-cyanx-400/40',
  neutral: 'from-accent-500/80 to-accent-400/40',
};

interface Props {
  level: number;
  distance: number;
  tone?: Tone;
  height?: number;
}

/** A stylized water tank showing the fill level and ultrasonic distance. */
export function TankVisual({ level, distance, tone = 'normal', height = 260 }: Props) {
  const clamped = Math.min(100, Math.max(0, level));
  return (
    <div className="flex items-center justify-center gap-5">
      <div
        className="relative w-32 overflow-hidden rounded-b-2xl rounded-t-lg border-2 border-white/10 bg-navy-950/60"
        style={{ height }}
      >
        {/* Distance (air gap) label */}
        <div
          className="absolute inset-x-0 top-0 flex items-start justify-center pt-2 text-[10px] font-medium text-slate-500"
          style={{ height: `${100 - clamped}%` }}
        >
          <span className="rounded bg-navy-900/70 px-1.5 py-0.5">
            {distance} cm
          </span>
        </div>
        {/* Water */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${FILL[tone]} transition-[height] duration-700 ease-out`}
          style={{ height: `${clamped}%` }}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-white/20" />
        </div>
        {/* Level ticks */}
        {[25, 50, 75].map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 border-t border-dashed border-white/10"
            style={{ bottom: `${t}%` }}
          />
        ))}
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="stat-value text-2xl drop-shadow">{Math.round(clamped)}%</span>
        </div>
      </div>
    </div>
  );
}
