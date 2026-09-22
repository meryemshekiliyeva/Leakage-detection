import {
  LayoutDashboard,
  Waves,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

/** The MONITOR -> THINK -> INTERACT phase a page belongs to. */
export type Phase = 'MONITOR' | 'THINK' | 'INTERACT';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  phase: Phase;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, phase: 'MONITOR' },
  { to: '/water-level', label: 'Water Level', icon: Waves, phase: 'MONITOR' },
  {
    to: '/control-panel',
    label: 'Control Panel',
    icon: SlidersHorizontal,
    phase: 'INTERACT',
  },
];

export const PHASE_META: Record<
  Phase,
  { label: string; color: string; dot: string }
> = {
  MONITOR: { label: 'Monitor', color: 'text-accent-400', dot: 'bg-accent-400' },
  THINK: { label: 'Think', color: 'text-cyanx-400', dot: 'bg-cyanx-400' },
  INTERACT: { label: 'Interact', color: 'text-warn-400', dot: 'bg-warn-400' },
};
