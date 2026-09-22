import type { ReactNode } from 'react';

export type Tone = 'normal' | 'warn' | 'danger' | 'info' | 'neutral';

const TONE_STYLES: Record<Tone, string> = {
  normal: 'bg-normal-500/15 text-normal-400 ring-1 ring-inset ring-normal-500/30',
  warn: 'bg-warn-500/15 text-warn-400 ring-1 ring-inset ring-warn-500/30',
  danger: 'bg-danger-500/15 text-danger-400 ring-1 ring-inset ring-danger-500/30',
  info: 'bg-cyanx-500/15 text-cyanx-400 ring-1 ring-inset ring-cyanx-500/30',
  neutral: 'bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10',
};

const DOT_STYLES: Record<Tone, string> = {
  normal: 'bg-normal-500',
  warn: 'bg-warn-500',
  danger: 'bg-danger-500',
  info: 'bg-cyanx-500',
  neutral: 'bg-slate-400',
};

interface Props {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  tone,
  children,
  dot = true,
  pulse = false,
  className = '',
}: Props) {
  return (
    <span className={`pill ${TONE_STYLES[tone]} ${className}`}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${DOT_STYLES[tone]} animate-pulseRing`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${DOT_STYLES[tone]}`}
          />
        </span>
      )}
      {children}
    </span>
  );
}
