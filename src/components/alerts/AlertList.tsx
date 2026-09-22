import { BellOff } from 'lucide-react';
import { AlertCard } from './AlertCard';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  onResolve?: (id: string) => void;
  emptyLabel?: string;
}

export function AlertList({ alerts, onResolve, emptyLabel = 'No alerts to show' }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 py-12 text-center">
        <BellOff className="h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <AlertCard key={a.id} alert={a} onResolve={onResolve} />
      ))}
    </div>
  );
}
