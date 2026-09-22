import type { TooltipProps } from 'recharts';

/** Shared dark tooltip so all charts read as one system. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = '',
}: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-navy-800/95 px-3 py-2 shadow-card backdrop-blur">
      {label != null && (
        <div className="mb-1 text-[11px] font-medium text-slate-400">{label}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}</span>
          <span className="stat-value ml-auto">
            {typeof entry.value === 'number'
              ? entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1)
              : entry.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
