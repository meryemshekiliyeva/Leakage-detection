import {
  Radar,
  Droplets,
  CircuitBoard,
  Cpu,
  ArrowDown,
  LayoutDashboard,
  Bell,
  Mic,
  MonitorSmartphone,
  BrainCircuit,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function Node({
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 rounded-xl border border-white/5 bg-navy-850/80 p-3.5 shadow-card">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="truncate text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <ArrowDown className="h-5 w-5 text-slate-600" />
    </div>
  );
}

function PhaseTag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

/**
 * Visual system architecture, mapped to MONITOR -> THINK -> INTERACT.
 * Used both as a standalone page and as reference material.
 */
export function SystemArchitecture() {
  return (
    <div className="mx-auto max-w-md">
      {/* MONITOR */}
      <div className="rounded-2xl border border-accent-500/20 bg-accent-500/[0.04] p-4">
        <PhaseTag label="Monitor · Sense" color="bg-accent-400" />
        <div className="flex flex-col items-center gap-2">
          <Node
            icon={Radar}
            title="Ultrasonic Sensor"
            subtitle="Water level & distance"
            accent="bg-accent-500/15 text-accent-400"
          />
          <Node
            icon={Droplets}
            title="Water Leak Sensor"
            subtitle="Wet / dry detection"
            accent="bg-accent-500/15 text-accent-400"
          />
          <Connector />
          <Node
            icon={CircuitBoard}
            title="Arduino"
            subtitle="Read sensors + basic control"
            accent="bg-accent-500/15 text-accent-400"
          />
        </div>
      </div>

      <Connector />

      {/* THINK */}
      <div className="rounded-2xl border border-cyanx-500/20 bg-cyanx-500/[0.04] p-4">
        <PhaseTag label="Think · Analyze" color="bg-cyanx-400" />
        <div className="flex flex-col items-center gap-2">
          <Node
            icon={Cpu}
            title="Raspberry Pi"
            subtitle="Central processing unit"
            accent="bg-cyanx-500/15 text-cyanx-400"
          />
          <Connector />
          <Node
            icon={BrainCircuit}
            title="AI Anomaly Detection"
            subtitle="Trend · variance · patterns"
            accent="bg-cyanx-500/15 text-cyanx-400"
          />
        </div>
      </div>

      <Connector />

      {/* INTERACT */}
      <div className="rounded-2xl border border-warn-500/20 bg-warn-500/[0.04] p-4">
        <PhaseTag label="Interact · Act" color="bg-warn-400" />
        <div className="grid grid-cols-2 gap-2">
          <Node
            icon={LayoutDashboard}
            title="Dashboard"
            subtitle="Web UI"
            accent="bg-warn-500/15 text-warn-400"
          />
          <Node
            icon={MonitorSmartphone}
            title="LCD / Wi-Fi"
            subtitle="On-device display"
            accent="bg-warn-500/15 text-warn-400"
          />
          <Node
            icon={Bell}
            title="Alerts"
            subtitle="Warnings & logs"
            accent="bg-warn-500/15 text-warn-400"
          />
          <Node
            icon={Mic}
            title="Voice Assistant"
            subtitle="Future interface"
            accent="bg-warn-500/15 text-warn-400"
          />
        </div>
      </div>
    </div>
  );
}
