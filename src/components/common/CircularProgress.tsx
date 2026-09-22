interface Props {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Tailwind text color class for the arc, e.g. "text-accent-400". */
  colorClass?: string;
  label?: string;
  sublabel?: string;
}

/**
 * Clean SVG circular progress indicator. Used for the water-level card.
 */
export function CircularProgress({
  value,
  size = 132,
  strokeWidth = 10,
  colorClass = 'text-accent-400',
  label,
  sublabel,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-white/8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-[stroke-dashoffset] duration-700 ease-out`}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="stat-value text-3xl leading-none">{label}</span>
        )}
        {sublabel && (
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
