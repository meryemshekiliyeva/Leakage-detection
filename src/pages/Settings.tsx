import type { ReactNode } from 'react';
import {
  Ruler,
  Timer,
  BrainCircuit,
  Wifi,
  CircuitBoard,
  Cpu,
  Bell,
  Info,
} from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ArduinoConnectButton } from '@/components/common/ArduinoConnectButton';

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Ruler;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
          <Icon className="h-[18px] w-[18px] text-accent-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-accent-500' : 'bg-navy-700'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="stat-value text-sm">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-navy-700 accent-accent-500"
      />
    </div>
  );
}

function ConnRow({
  icon: Icon,
  label,
  connected,
}: {
  icon: typeof Wifi;
  label: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-900/50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-300">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </span>
      <StatusBadge tone={connected ? 'normal' : 'danger'}>
        {connected ? 'Connected' : 'Disconnected'}
      </StatusBadge>
    </div>
  );
}

export function Settings() {
  const { settings, updateSettings, systemStatus } = useSystem();

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Configure sensors, the AI model, connectivity and notifications."
        phase="INTERACT"
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-cyanx-500/20 bg-cyanx-500/[0.06] p-3 text-xs text-cyanx-200/90">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyanx-400" />
        Changes update the interface immediately. When the Raspberry Pi backend
        is connected, these will be persisted to the device.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section
          icon={Ruler}
          title="Sensor Configuration"
          description="Ultrasonic and leak-sensor parameters"
        >
          <SliderField
            label="Tank Height"
            value={settings.tankHeight}
            min={5}
            max={300}
            step={1}
            unit=" cm"
            onChange={(tankHeight) => updateSettings({ tankHeight })}
          />
          <SliderField
            label="Tank Cross-section"
            value={settings.tankCrossSection}
            min={1}
            max={200}
            step={0.1}
            unit=" cm²"
            onChange={(v) =>
              updateSettings({ tankCrossSection: Math.round(v * 10) / 10 })
            }
          />
          <SliderField
            label="Sampling Interval"
            value={settings.samplingInterval}
            min={1}
            max={30}
            unit=" s"
            onChange={(samplingInterval) => updateSettings({ samplingInterval })}
          />
          <SliderField
            label="Ultrasonic Calibration Offset"
            value={settings.ultrasonicOffset}
            min={-10}
            max={10}
            unit=" cm"
            onChange={(ultrasonicOffset) => updateSettings({ ultrasonicOffset })}
          />
          <SliderField
            label="Leak Sensor Calibration"
            value={settings.leakSensorThreshold}
            min={0}
            max={100}
            unit="%"
            onChange={(leakSensorThreshold) =>
              updateSettings({ leakSensorThreshold })
            }
          />
        </Section>

        <Section
          icon={BrainCircuit}
          title="AI Configuration"
          description="Anomaly-detection model behaviour"
        >
          <SliderField
            label="Anomaly Detection Sensitivity"
            value={settings.anomalySensitivity}
            min={10}
            max={90}
            unit="%"
            onChange={(anomalySensitivity) =>
              updateSettings({ anomalySensitivity })
            }
          />
          <SliderField
            label="Analysis Interval"
            value={settings.analysisInterval}
            min={1}
            max={30}
            unit=" s"
            onChange={(analysisInterval) => updateSettings({ analysisInterval })}
          />
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-900/50 px-3 py-2.5">
            <span className="text-sm text-slate-300">Model Status</span>
            <div className="flex items-center gap-3">
              <StatusBadge tone={settings.modelEnabled ? 'normal' : 'neutral'}>
                {settings.modelEnabled ? 'Active' : 'Disabled'}
              </StatusBadge>
              <Toggle
                label=""
                checked={settings.modelEnabled}
                onChange={(modelEnabled) => updateSettings({ modelEnabled })}
              />
            </div>
          </div>
        </Section>

        <Section
          icon={Wifi}
          title="Communication"
          description="Connect the Arduino and view link status"
        >
          <ArduinoConnectButton variant="full" />
          <div className="my-1 border-t border-white/5" />
          <ConnRow
            icon={Wifi}
            label="Wi-Fi"
            connected={systemStatus.wifi === 'CONNECTED'}
          />
          <ConnRow
            icon={CircuitBoard}
            label="Arduino"
            connected={systemStatus.arduino === 'CONNECTED'}
          />
          <ConnRow
            icon={Cpu}
            label="Raspberry Pi"
            connected={systemStatus.raspberryPi === 'CONNECTED'}
          />
        </Section>

        <Section
          icon={Bell}
          title="Notifications"
          description="Choose which events raise alerts"
        >
          <Toggle
            label="Leak alerts"
            checked={settings.notifyLeak}
            onChange={(notifyLeak) => updateSettings({ notifyLeak })}
          />
          <Toggle
            label="AI anomaly alerts"
            checked={settings.notifyAnomaly}
            onChange={(notifyAnomaly) => updateSettings({ notifyAnomaly })}
          />
          <Toggle
            label="System offline alerts"
            checked={settings.notifyOffline}
            onChange={(notifyOffline) => updateSettings({ notifyOffline })}
          />
          <div className="flex items-center gap-2 pt-1">
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">
              Alerts appear in the Alert Center in real time.
            </span>
          </div>
        </Section>
      </div>
    </div>
  );
}
