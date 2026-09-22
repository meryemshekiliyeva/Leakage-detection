import type { ReactNode } from 'react';
import { PHASE_META, type Phase } from '@/config/navigation';

interface Props {
  title: string;
  subtitle?: string;
  phase?: Phase;
  actions?: ReactNode;
}

/** Consistent page title block with the MONITOR/THINK/INTERACT phase tag. */
export function PageHeader({ title, subtitle, phase, actions }: Props) {
  const meta = phase ? PHASE_META[phase] : null;
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {meta && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.22em] ${meta.color}`}
            >
              {meta.label}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
