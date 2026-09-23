import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DemoModePanel } from '@/components/common/DemoModePanel';
import { SerialStatusBanner } from '@/components/common/SerialStatusBanner';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onDemoClick={() => setDemoOpen(true)}
        />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <SerialStatusBanner />
          <Outlet />
        </main>
      </div>

      {/* Demo Mode slide-over drawer */}
      {demoOpen && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm"
          onClick={() => setDemoOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm transform border-l border-white/5 bg-navy-900 shadow-2xl transition-transform duration-300 ${
          demoOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Demo Mode controls"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Demo & Simulation</h2>
            <p className="text-xs text-slate-400">Drive the system for a demo</p>
          </div>
          <button
            onClick={() => setDemoOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close demo panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          <DemoModePanel />
        </div>
      </div>
    </div>
  );
}
