import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  values: number[];
  color?: string;
  height?: number;
  unit?: string;
}

/** Compact sparkline-style chart for the normal vs abnormal comparison. */
export function MiniLineChart({
  values,
  color = '#3cc6c6',
  height = 140,
  unit = '%',
}: Props) {
  const data = values.map((v, i) => ({ label: `t${i + 1}`, value: v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
        <YAxis hide domain={[0, 100]} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={false} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
