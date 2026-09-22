import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface ScorePoint {
  label: string;
  score: number;
}

interface Props {
  data: ScorePoint[];
  height?: number;
  threshold?: number;
}

/** Anomaly score (%) over time with a detection threshold marker. */
export function AnomalyScoreChart({ data, height = 240, threshold = 50 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(148,163,184,0.12)' }}
          minTickGap={28}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: 'rgba(148,163,184,0.25)' }} />
        <ReferenceLine
          y={threshold}
          stroke="#f59e0b"
          strokeDasharray="5 4"
          label={{
            value: 'Threshold',
            fill: '#f59e0b',
            fontSize: 10,
            position: 'insideTopRight',
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Anomaly Score"
          stroke="#a78bfa"
          strokeWidth={2.4}
          fill="url(#anomalyGradient)"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, fill: '#a78bfa', stroke: '#0b1120', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
