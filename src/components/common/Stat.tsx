interface Props {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}

/** Compact labelled statistic used under charts (Current / Min / Max / Avg). */
export function Stat({ label, value, hint, valueClass = 'text-white' }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-900/60 px-3 py-2.5">
      <div className="section-title">{label}</div>
      <div className={`stat-value mt-1 text-lg ${valueClass}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}
