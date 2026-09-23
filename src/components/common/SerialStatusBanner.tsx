import { AlertCircle, Loader2 } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';

/**
 * Surfaces the Web Serial connection state so problems are visible:
 *  - a red banner with the error (e.g. no data / port busy / unsupported)
 *  - an info banner while connected but waiting for the first reading
 */
export function SerialStatusBanner() {
  const { serialError, serialConnected, hasData } = useSystem();

  if (serialError) {
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/10 p-3.5 text-sm text-danger-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-400" />
        <span>{serialError}</span>
      </div>
    );
  }

  if (serialConnected && !hasData) {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-cyanx-500/25 bg-cyanx-500/[0.08] p-3.5 text-sm text-cyanx-100">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyanx-400" />
        <span>Connected — waiting for the first reading from the Arduino…</span>
      </div>
    );
  }

  return null;
}
