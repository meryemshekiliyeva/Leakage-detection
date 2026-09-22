import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  accent?: 'accent' | 'cyan' | 'normal' | 'warn';
}

const ACCENTS = {
  accent: { on: 'ring-accent-500/60 bg-accent-500/10', icon: 'text-accent-400', glow: 'shadow-glow' },
  cyan: { on: 'ring-cyanx-500/60 bg-cyanx-500/10', icon: 'text-cyanx-400', glow: 'shadow-glow' },
  normal: { on: 'ring-normal-500/60 bg-normal-500/10', icon: 'text-normal-400', glow: '' },
  warn: { on: 'ring-warn-500/60 bg-warn-500/10', icon: 'text-warn-400', glow: '' },
};

/** A large, tactile "physical panel" button for the Control Panel page. */
export function ControlButton({
  icon: Icon,
  label,
  description,
  active,
  onClick,
  accent = 'accent',
}: Props) {
  const a = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-navy-850/80 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 ${
        active ? `ring-2 ring-inset ${a.on} ${a.glow}` : 'hover:bg-white/5'
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          active ? a.on : 'bg-white/5'
        }`}
      >
        <Icon className={`h-8 w-8 ${a.icon}`} />
      </div>
      <div>
        <div className="text-base font-bold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-slate-400">{description}</div>
      </div>
    </button>
  );
}
