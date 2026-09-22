import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Tone } from '@/components/common/StatusBadge';

const ACCENT: Record<Tone, { icon: string; iconBg: string; glow: string }> = {
  normal: { icon: 'text-normal-400', iconBg: 'bg-normal-500/12', glow: '' },
  warn: { icon: 'text-warn-400', iconBg: 'bg-warn-500/12', glow: 'shadow-[0_0_28px_-8px_rgba(245,158,11,0.5)]' },
  danger: {
    icon: 'text-danger-400',
    iconBg: 'bg-danger-500/12',
    glow: 'shadow-glow-danger',
  },
  info: { icon: 'text-cyanx-400', iconBg: 'bg-cyanx-500/12', glow: '' },
  neutral: { icon: 'text-accent-400', iconBg: 'bg-accent-500/12', glow: '' },
};

interface Props {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  alarm?: boolean;
}

/**
 * Generic dashboard status-card shell. Specialized cards (water level, leak,
 * AI, system) compose this so they stay visually consistent.
 */
export function StatusCard({
  icon: Icon,
  label,
  tone,
  badge,
  children,
  footer,
  alarm = false,
}: Props) {
  const a = ACCENT[tone];
  return (
    <div
      className={`card card-hover flex flex-col p-5 ${alarm ? a.glow : ''} ${
        alarm ? 'animate-floatIn ring-1 ring-inset ring-danger-500/40' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.iconBg}`}>
            <Icon className={`h-[18px] w-[18px] ${a.icon}`} />
          </div>
          <span className="section-title">{label}</span>
        </div>
        {badge}
      </div>
      <div className="flex-1">{children}</div>
      {footer && (
        <div className="mt-4 border-t border-white/5 pt-3">{footer}</div>
      )}
    </div>
  );
}
