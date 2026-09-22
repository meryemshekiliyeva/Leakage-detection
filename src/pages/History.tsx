import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Droplet, TrendingDown, TrendingUp, BrainCircuit, Waves, Loader2 } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { PageHeader } from '@/components/common/PageHeader';
import { SensorChart } from '@/components/charts/SensorChart';
import { AnomalyScoreChart } from '@/components/charts/AnomalyScoreChart';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Stat } from '@/components/common/Stat';
import { getLongHistory } from '@/services/sensorService';
import type { HistoryRange, SensorData } from '@/types';

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

function bucketLabel(iso: string, range: HistoryRange): string {
  const d = new Date(iso);
  if (range === 'today') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function History() {
  const { settings } = useSystem();
  const [range, setRange] = useState<HistoryRange>('today');
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLongHistory(range, settings).then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range, settings]);

  const levelSeries = useMemo(
    () =>
      data.map((r) => ({ label: bucketLabel(r.timestamp, range), value: r.waterLevel })),
    [data, range],
  );

  const scoreSeries = useMemo(
    () =>
      data.map((r) => ({
        label: bucketLabel(r.timestamp, range),
        score: Math.round(r.anomalyScore * 100),
      })),
    [data, range],
  );

  // Leak events grouped into buckets for the bar chart.
  const leakBuckets = useMemo(() => {
    const map = new Map<string, number>();
    let prevLeak = false;
    for (const r of data) {
      const key = bucketLabel(r.timestamp, range);
      if (!map.has(key)) map.set(key, 0);
      if (r.leakDetected && !prevLeak) map.set(key, (map.get(key) ?? 0) + 1);
      prevLeak = r.leakDetected;
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }, [data, range]);

  const summary = useMemo(() => {
    if (data.length === 0) {
      return { avg: 0, min: 0, max: 0, anomalies: 0, leaks: 0 };
    }
    const levels = data.map((r) => r.waterLevel);
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    let anomalies = 0;
    let prevA = false;
    let leaks = 0;
    let prevL = false;
    for (const r of data) {
      if (r.aiStatus === 'ANOMALY' && !prevA) anomalies++;
      prevA = r.aiStatus === 'ANOMALY';
      if (r.leakDetected && !prevL) leaks++;
      prevL = r.leakDetected;
    }
    return {
      avg: Math.round(avg),
      min: Math.round(Math.min(...levels)),
      max: Math.round(Math.max(...levels)),
      anomalies,
      leaks,
    };
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Historical Analysis"
        subtitle="Stored sensor history — the system does not only monitor now, it remembers and analyzes."
        phase="THINK"
        actions={
          <div className="flex rounded-lg border border-white/5 bg-navy-900/60 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r.value
                    ? 'bg-accent-500/20 text-accent-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Average Level" value={`${summary.avg}%`} valueClass="text-accent-400" />
        <Stat label="Lowest Level" value={`${summary.min}%`} />
        <Stat label="Highest Level" value={`${summary.max}%`} />
        <Stat label="Anomalies" value={String(summary.anomalies)} valueClass="text-warn-400" />
        <Stat
          label="Leak Events"
          value={String(summary.leaks)}
          valueClass={summary.leaks > 0 ? 'text-danger-400' : 'text-white'}
        />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center gap-3 py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading history…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Water level */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/12">
                <Waves className="h-[18px] w-[18px] text-accent-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Water Level</h2>
            </div>
            <SensorChart
              data={levelSeries}
              color="#3cc6c6"
              height={260}
              unit="%"
              yDomain={[0, 100]}
              seriesName="Water Level"
              gradientId="historyLevel"
            />
          </div>

          {/* Anomaly score */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyanx-500/12">
                <BrainCircuit className="h-[18px] w-[18px] text-cyanx-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Anomaly Score</h2>
            </div>
            <AnomalyScoreChart
              data={scoreSeries}
              threshold={settings.anomalySensitivity}
              height={220}
            />
          </div>

          {/* Leak events */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-500/12">
                <Droplet className="h-[18px] w-[18px] text-danger-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Leakage Events</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leakBuckets} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148,163,184,0.12)' }}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                <Bar dataKey="count" name="Leak Events" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend footer */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card flex items-center gap-3 p-5">
              <TrendingUp className="h-6 w-6 text-normal-400" />
              <div>
                <div className="text-sm font-semibold text-white">Peak fill {summary.max}%</div>
                <div className="text-xs text-slate-400">Highest recorded level this period</div>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-5">
              <TrendingDown className="h-6 w-6 text-warn-400" />
              <div>
                <div className="text-sm font-semibold text-white">Lowest fill {summary.min}%</div>
                <div className="text-xs text-slate-400">Minimum recorded level this period</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
