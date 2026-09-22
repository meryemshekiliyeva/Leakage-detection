import { Ruler, Gauge, Waves, Timer, Container, Box } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { RealTimeWaterChart } from '@/components/charts/RealTimeWaterChart';
import { TankVisual } from '@/components/common/TankVisual';
import { StatusBadge } from '@/components/common/StatusBadge';
import { waterLevelStatus } from '@/components/cards/WaterLevelCard';
import { distanceToVolumeLiters } from '@/data/mockData';

export function WaterLevel() {
  const { currentReading, settings } = useSystem();
  const status = waterLevelStatus(currentReading.waterLevel);
  const volumeLiters = distanceToVolumeLiters(
    currentReading.distance,
    settings.tankHeight,
    settings.tankCrossSection,
  );

  const metrics = [
    {
      icon: Gauge,
      label: 'Water Level',
      value: `${Math.round(currentReading.waterLevel)}%`,
    },
    {
      icon: Ruler,
      label: 'Distance to Surface',
      value: `${currentReading.distance} cm`,
    },
    {
      icon: Container,
      label: 'Water Volume',
      value: `${volumeLiters.toFixed(2)} L`,
    },
    {
      icon: Waves,
      label: 'Tank Height',
      value: `${settings.tankHeight} cm`,
    },
    {
      icon: Box,
      label: 'Cross-section',
      value: `${settings.tankCrossSection} cm²`,
    },
    {
      icon: Timer,
      label: 'Sampling Interval',
      value: `${settings.samplingInterval}s`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Water Level Monitoring"
        subtitle="Ultrasonic distance readings converted to tank fill level in real time."
        phase="MONITOR"
        actions={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Tank visual */}
        <div className="card flex flex-col items-center justify-center p-6">
          <TankVisual
            level={currentReading.waterLevel}
            distance={currentReading.distance}
            tone={status.tone}
          />
          <div className="mt-4 text-center">
            <div className="section-title">Current Fill</div>
            <div className="stat-value mt-1 text-3xl text-accent-400">
              {Math.round(currentReading.waterLevel)}%
            </div>
            <div className="mt-1 text-xs text-slate-400">
              ≈ {volumeLiters.toFixed(2)} L
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card card-hover flex flex-col justify-between p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
                    <Icon className="h-[18px] w-[18px] text-accent-400" />
                  </div>
                  <span className="section-title">{m.label}</span>
                </div>
                <div className="stat-value mt-4 text-3xl">{m.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <RealTimeWaterChart title="Water Level Over Time" height={340} />
      </div>
    </div>
  );
}
