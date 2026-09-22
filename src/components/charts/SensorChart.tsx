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

export interface ChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: ChartPoint[];
  color?: string;
  height?: number;
  unit?: string;
  yDomain?: [number, number] | [string, string];
  seriesName?: string;
  gradientId?: string;
  referenceLines?: { y: number; label: string; color?: string }[];
}

/**
 * The primary time-series chart used for water level and other metrics.
 * Purely presentational — it renders whatever ChartPoint[] it is given.
 */
export function SensorChart({
  data,
  color = '#3cc6c6',
  height = 300,
  unit = '',
  yDomain = [0, 100],
  seriesName = 'Value',
  gradientId = 'sensorGradient',
  referenceLines = [],
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
          domain={yDomain}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `${v}${unit}`}
        />
        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }}
        />
        {referenceLines.map((r, i) => (
          <ReferenceLine
            key={i}
            y={r.y}
            stroke={r.color ?? 'rgba(148,163,184,0.4)'}
            strokeDasharray="4 4"
            label={{
              value: r.label,
              fill: r.color ?? '#94a3b8',
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />
        ))}
        <Area
          type="monotone"
          dataKey="value"
          name={seriesName}
          stroke={color}
          strokeWidth={2.4}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#0b1120', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
