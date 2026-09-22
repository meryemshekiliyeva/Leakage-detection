import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Database,
  Filter,
  LineChart,
  ScanSearch,
  BellRing,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { useNow } from '@/hooks/useNow';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MiniLineChart } from '@/components/charts/MiniLineChart';
import { AnomalyScoreChart } from '@/components/charts/AnomalyScoreChart';
import { AI_PIPELINE } from '@/services/aiService';
import {
  NORMAL_PATTERN_SERIES,
  ABNORMAL_PATTERN_SERIES,
  ANOMALY_POSSIBLE_CAUSES,
} from '@/data/mockData';
import { timeAgo, clockTime } from '@/lib/format';

const STAGE_ICONS: Record<string, LucideIcon> = {
  collect: Database,
  preprocess: Filter,
  features: LineChart,
  detect: ScanSearch,
  alert: BellRing,
};

export function AIAnalysis() {
  const { aiAnalysis, history, settings } = useSystem();
  const now = useNow(1000);
  const anomaly = aiAnalysis.status === 'ANOMALY';

  const scoreData = history.slice(-40).map((r) => ({
    label: clockTime(r.timestamp),
    score: Math.round(r.anomalyScore * 100),
  }));

  const keyStats = [
    { label: 'Anomaly Score', value: `${Math.round(aiAnalysis.anomalyScore * 100)}%` },
    { label: 'Confidence', value: `${Math.round(aiAnalysis.confidence * 100)}%` },
    { label: 'Current Pattern', value: aiAnalysis.pattern },
    { label: 'Last Analysis', value: timeAgo(aiAnalysis.lastAnalysis, now) },
  ];

  return (
    <div>
      <PageHeader
        title="AI Analysis"
        subtitle="Anomaly detection on the sensor stream — the THINK stage of the system."
        phase="THINK"
      />

      {/* Current status hero */}
      <div
        className={`card p-6 ${anomaly ? 'ring-1 ring-inset ring-warn-500/40' : ''}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                anomaly ? 'bg-warn-500/15' : 'bg-normal-500/15'
              }`}
            >
              {anomaly ? (
                <AlertTriangle className="h-8 w-8 text-warn-400" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-normal-400" />
              )}
            </div>
            <div>
              <div className="section-title">Current AI Status</div>
              <div
                className={`stat-value text-2xl ${
                  anomaly ? 'text-warn-400' : 'text-normal-400'
                }`}
              >
                {anomaly ? 'ANOMALY DETECTED' : 'NORMAL'}
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
            {keyStats.map((s) => (
              <div key={s.label}>
                <div className="section-title">{s.label}</div>
                <div className="stat-value mt-1 truncate text-sm sm:text-base" title={s.value}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live anomaly score */}
      <div className="mt-4 card p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyanx-500/12">
            <BrainCircuit className="h-[18px] w-[18px] text-cyanx-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Live Anomaly Score
            </h2>
            <p className="text-xs text-slate-400">
              Model output over the recent window · threshold at{' '}
              {settings.anomalySensitivity}%
            </p>
          </div>
        </div>
        <AnomalyScoreChart data={scoreData} threshold={settings.anomalySensitivity} />
      </div>

      {/* Normal vs Abnormal comparison */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Normal Pattern</h3>
            <StatusBadge tone="normal">Stable</StatusBadge>
          </div>
          <MiniLineChart values={NORMAL_PATTERN_SERIES} color="#22c55e" />
          <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs text-slate-400">
            {NORMAL_PATTERN_SERIES.map((v, i) => (
              <span key={i} className="rounded bg-white/5 px-1.5 py-0.5">
                {v}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Stable sensor behavior. Readings stay within a narrow band with only
            small natural variation.
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Abnormal Pattern</h3>
            <StatusBadge tone="warn">Anomalous</StatusBadge>
          </div>
          <MiniLineChart values={ABNORMAL_PATTERN_SERIES} color="#f59e0b" />
          <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs text-slate-400">
            {ABNORMAL_PATTERN_SERIES.map((v, i) => (
              <span key={i} className="rounded bg-white/5 px-1.5 py-0.5">
                {v}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Rapid decrease in water-level measurements. A sudden, sustained drop
            is flagged as anomalous.
          </p>
        </div>
      </div>

      {/* Possible causes */}
      <div className="mt-4 card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyanx-400" />
          <h3 className="text-sm font-semibold text-white">
            Possible causes of an abnormal pattern
          </h3>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          These are possibilities to investigate — not confirmed diagnoses. The
          system flags unusual behavior; a person confirms the cause.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ANOMALY_POSSIBLE_CAUSES.map((cause) => (
            <div
              key={cause}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-navy-900/50 p-3 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn-400" />
              {cause}
            </div>
          ))}
        </div>
      </div>

      {/* AI processing workflow */}
      <div className="mt-4 card p-5">
        <h2 className="mb-1 text-base font-semibold text-white">
          AI Processing Workflow
        </h2>
        <p className="mb-5 text-xs text-slate-400">
          How raw sensor readings become actionable alerts.
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {AI_PIPELINE.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.key] ?? Database;
            const isDetect = stage.key === 'detect';
            const highlight = isDetect && anomaly;
            return (
              <div key={stage.key} className="flex flex-1 items-stretch gap-3">
                <div
                  className={`flex flex-1 flex-col rounded-xl border p-4 transition-colors ${
                    highlight
                      ? 'border-warn-500/40 bg-warn-500/10'
                      : 'border-white/5 bg-navy-900/50'
                  }`}
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                      highlight
                        ? 'bg-warn-500/20 text-warn-400'
                        : 'bg-cyanx-500/12 text-cyanx-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {stage.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {stage.description}
                  </p>
                </div>
                {i < AI_PIPELINE.length - 1 && (
                  <div className="hidden items-center lg:flex">
                    <ArrowRight className="h-5 w-5 text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
