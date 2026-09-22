import { NavLink } from 'react-router-dom';
import { X, Droplet } from 'lucide-react';
import { NAV_ITEMS, PHASE_META } from '@/config/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-navy-900/95 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-cyanx-500 shadow-glow">
              <Droplet className="h-6 w-6 text-navy-950" fill="currentColor" />
            </div>
            <div>
              <div className="text-[15px] font-extrabold leading-tight tracking-tight text-white">
                SMART WATER AI
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-accent-400">
                Intelligent Monitoring System
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const meta = PHASE_META[item.phase];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-500/15 text-white shadow-[inset_0_0_0_1px_rgba(60,198,198,0.25)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-400" />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        isActive ? 'text-accent-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                      }`}
                      title={meta.label}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* MONITOR -> THINK -> INTERACT legend */}
        <div className="border-t border-white/5 px-5 py-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-accent-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Monitor
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1.5 text-cyanx-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyanx-400" /> Think
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1.5 text-warn-400">
              <span className="h-1.5 w-1.5 rounded-full bg-warn-400" /> Interact
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
