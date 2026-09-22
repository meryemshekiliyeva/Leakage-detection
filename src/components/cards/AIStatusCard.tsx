import { BrainCircuit, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { AIAnalysis } from '@/types';

export function AIStatusCard({ analysis }: { analysis: AIAnalysis }) {
  const anomaly = analysis.status === 'ANOMALY';
  const scorePct = Math.round(analysis.anomalyScore * 100);
  const confPct = Math.round(analysis.confidence * 100);

  return (
    <StatusCard
      icon={BrainCircuit}
      label="AI Analysis"
      tone={anomaly ? 'warn' : 'normal'}
      alarm={anomaly}
      badge={
        <StatusBadge tone={anomaly ? 'warn' : 'normal'} pulse={anomaly}>
          {anomaly ? 'ANOMALY' : 'NORMAL'}
        </StatusBadge>
      }
      footer={
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Anomaly Score</div>
            <div
              className={`stat-value ${anomaly ? 'text-warn-400' : 'text-white'}`}
            >
              {scorePct}%
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Confidence</div>
            <div className="stat-value">{confPct}%</div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-3 text-center">
        {anomaly ? (
          <AlertTriangle className="mb-2 h-12 w-12 text-warn-400" />
        ) : (
          <CheckCircle2 className="mb-2 h-12 w-12 text-normal-400" />
        )}
        <div
          className={`stat-value text-2xl ${
            anomaly ? 'text-warn-400' : 'text-normal-400'
          }`}
        >
          {anomaly ? 'ANOMALY DETECTED' : 'NORMAL'}
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-slate-400">
          {analysis.pattern}
        </div>
      </div>
    </StatusCard>
  );
}
