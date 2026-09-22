import { Radar, Cpu, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SystemArchitecture } from '@/components/architecture/SystemArchitecture';

const PHASES = [
  {
    icon: Radar,
    title: 'Monitor',
    color: 'text-accent-400',
    ring: 'ring-accent-500/25',
    text: 'Ultrasonic and water-leak sensors feed the Arduino, which reads them continuously and handles basic hardware control.',
  },
  {
    icon: Cpu,
    title: 'Think',
    color: 'text-cyanx-400',
    ring: 'ring-cyanx-500/25',
    text: 'The Raspberry Pi is the central processing unit. It ingests the data, runs AI anomaly detection, and drives decisions.',
  },
  {
    icon: LayoutDashboard,
    title: 'Interact',
    color: 'text-warn-400',
    ring: 'ring-warn-500/25',
    text: 'Results reach people through the dashboard, on-device display, alerts, the control panel and the future voice assistant.',
  },
];

export function Architecture() {
  return (
    <div>
      <PageHeader
        title="System Architecture"
        subtitle="How data flows from the sensors to you — Monitor, Think, Interact."
        phase="THINK"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Diagram */}
        <div className="card p-6 lg:col-span-2">
          <SystemArchitecture />
        </div>

        {/* Explanation */}
        <div className="space-y-4">
          {PHASES.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className={`card p-5 ring-1 ring-inset ${p.ring}`}>
                <div className="mb-2 flex items-center gap-2.5">
                  <Icon className={`h-5 w-5 ${p.color}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${p.color}`}>
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{p.text}</p>
              </div>
            );
          })}
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">Data path</h3>
            <p className="font-mono text-xs leading-relaxed text-slate-400">
              Ultrasonic + Leak Sensor → Arduino → Raspberry Pi → AI / Data
              Processing → UI / Dashboard / Alerts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
