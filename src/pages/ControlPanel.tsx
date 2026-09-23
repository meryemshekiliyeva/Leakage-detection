import { useState } from 'react';
import { Droplet, Search, ShieldCheck, Settings2, Terminal } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { ControlButton } from '@/components/control/ControlButton';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { waterLevelStatus } from '@/components/cards/WaterLevelCard';
import { clockTime } from '@/lib/format';

type Action = 'water' | 'sensor' | 'security' | 'system';

export function ControlPanel() {
  const { currentReading, aiAnalysis, systemStatus, hasData } = useSystem();
  const [action, setAction] = useState<Action | null>(null);

  function readout(): string[] {
    if (!action) return [];
    if (!hasData) {
      return [
        'Arduino not connected.',
        '',
        'Connect it from the top bar to read',
        'live values — or turn on Demo Mode.',
      ];
    }
    const level = Math.round(currentReading.waterLevel);
    const status = waterLevelStatus(currentReading.waterLevel).label;
    switch (action) {
      case 'water':
        return [
          `Water Level : ${level}%`,
          `Status      : ${status}`,
          `Distance    : ${currentReading.distance} cm`,
          `Leak Sensor : ${currentReading.leakDetected ? 'WATER DETECTED' : 'DRY'}`,
        ];
      case 'sensor':
        return [
          `Ultrasonic  : ${level}% (${currentReading.distance} cm)`,
          `Leak Sensor : ${currentReading.leakDetected ? 'WET' : 'DRY'}`,
          `AI Status   : ${aiAnalysis.status}`,
          `Anomaly     : ${Math.round(aiAnalysis.anomalyScore * 100)}%`,
          `Sampled At  : ${clockTime(currentReading.timestamp)}`,
        ];
      case 'security':
        return currentReading.leakDetected
          ? [
              `SECURITY    : ALERT`,
              `Leak Sensor : WATER DETECTED`,
              `Action      : Immediate attention required`,
            ]
          : [
              `SECURITY    : OK`,
              `Leak Sensor : DRY`,
              `AI Status   : ${aiAnalysis.status}`,
              `Message     : No threats detected`,
            ];
      case 'system':
        return [
          `System      : ${systemStatus.system}`,
          `Arduino     : ${systemStatus.arduino}`,
          `Raspberry Pi: ${systemStatus.raspberryPi}`,
          `Wi-Fi       : ${systemStatus.wifi}`,
          `Updated     : ${clockTime(systemStatus.lastUpdated)}`,
        ];
      default:
        return [];
    }
  }

  const lines = readout();

  return (
    <div>
      <PageHeader
        title="Intelligent Control Panel"
        subtitle="Query the system the way you would from the physical Arduino/LCD panel."
        phase="INTERACT"
        actions={<DataSourceBadge compact />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Buttons */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlButton
              icon={Droplet}
              label="Check Water"
              description="Level, status & leak"
              active={action === 'water'}
              onClick={() => setAction('water')}
              accent="accent"
            />
            <ControlButton
              icon={Search}
              label="Sensor Data"
              description="All sensor readings"
              active={action === 'sensor'}
              onClick={() => setAction('sensor')}
              accent="cyan"
            />
            <ControlButton
              icon={ShieldCheck}
              label="Check Security"
              description="Leak & threat status"
              active={action === 'security'}
              onClick={() => setAction('security')}
              accent="normal"
            />
            <ControlButton
              icon={Settings2}
              label="System Status"
              description="Links & health"
              active={action === 'system'}
              onClick={() => setAction('system')}
              accent="warn"
            />
          </div>
        </div>

        {/* LCD-style display */}
        <div className="lg:col-span-2">
          <div className="card h-full overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/5 bg-navy-900/60 px-4 py-2.5">
              <Terminal className="h-4 w-4 text-accent-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                System Readout
              </span>
              <span
                className={`ml-auto flex items-center gap-1.5 text-[11px] ${
                  hasData ? 'text-normal-400' : 'text-slate-500'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasData ? 'bg-normal-500 animate-blink' : 'bg-slate-500'
                  }`}
                />
                {hasData ? 'online' : 'offline'}
              </span>
            </div>
            <div className="min-h-[220px] bg-navy-950/60 p-4 font-mono text-sm">
              {lines.length === 0 ? (
                <div className="flex h-full min-h-[188px] items-center justify-center text-center text-slate-500">
                  <p>
                    Select a control on the left to query
                    <br />
                    the system.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-accent-300">
                  <div className="text-slate-500">$ query {action}</div>
                  {lines.map((l, i) => (
                    <div key={i} className="whitespace-pre text-slate-200">
                      {l}
                    </div>
                  ))}
                  <div className="pt-1 text-slate-600">
                    _<span className="animate-blink">▋</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
