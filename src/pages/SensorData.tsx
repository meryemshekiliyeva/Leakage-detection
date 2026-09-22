import { Radar, Droplets, Gauge, Ruler, Timer, Activity } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { SensorTable } from '@/components/sensor/SensorTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { clockTime } from '@/lib/format';

function SensorMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-900/50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-400">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </span>
      <span className="stat-value text-sm">{value}</span>
    </div>
  );
}

export function SensorData() {
  const { currentReading, history, settings, leakEvents } = useSystem();

  return (
    <div>
      <PageHeader
        title="Sensor Data"
        subtitle="Detailed status of each sensor and the raw reading stream."
        phase="MONITOR"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ultrasonic sensor */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
                <Radar className="h-[18px] w-[18px] text-accent-400" />
              </div>
              <h2 className="text-base font-semibold text-white">
                Ultrasonic Sensor
              </h2>
            </div>
            <StatusBadge tone="normal">Active</StatusBadge>
          </div>
          <div className="space-y-2">
            <SensorMetric
              icon={Gauge}
              label="Water Level"
              value={`${Math.round(currentReading.waterLevel)}%`}
            />
            <SensorMetric
              icon={Ruler}
              label="Distance"
              value={`${currentReading.distance} cm`}
            />
            <SensorMetric
              icon={Timer}
              label="Reading Frequency"
              value={`every ${settings.samplingInterval}s`}
            />
            <SensorMetric
              icon={Activity}
              label="Sensor Status"
              value="Operational"
            />
          </div>
        </div>

        {/* Water leak sensor */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
                <Droplets className="h-[18px] w-[18px] text-accent-400" />
              </div>
              <h2 className="text-base font-semibold text-white">
                Water Leak Sensor
              </h2>
            </div>
            <StatusBadge tone={currentReading.leakDetected ? 'danger' : 'normal'}>
              {currentReading.leakDetected ? 'Wet' : 'Dry'}
            </StatusBadge>
          </div>
          <div className="space-y-2">
            <SensorMetric
              icon={Droplets}
              label="Current State"
              value={currentReading.leakDetected ? 'WATER DETECTED' : 'DRY'}
            />
            <SensorMetric
              icon={Activity}
              label="Detection History"
              value={`${leakEvents.length} event${leakEvents.length === 1 ? '' : 's'}`}
            />
            <SensorMetric
              icon={Timer}
              label="Last Update"
              value={clockTime(currentReading.timestamp)}
            />
            <SensorMetric icon={Activity} label="Sensor Status" value="Operational" />
          </div>
        </div>
      </div>

      {/* Raw readings */}
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Raw Sensor Readings</h2>
          <span className="text-xs text-slate-400">
            {history.length} readings buffered
          </span>
        </div>
        <SensorTable data={history} pageSize={10} />
      </div>
    </div>
  );
}
