import { Usb } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { ArduinoConnectButton } from './ArduinoConnectButton';

/**
 * Banner shown when no data is flowing (no Arduino, no Demo Mode). Makes it
 * obvious that the app is waiting for a real connection rather than showing
 * made-up numbers.
 */
export function ConnectPrompt() {
  const { awaitingData, serialSupported } = useSystem();
  if (!awaitingData) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-accent-500/25 bg-accent-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15">
          <Usb className="h-[18px] w-[18px] text-accent-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">
            Waiting for Arduino
          </div>
          <p className="text-xs text-slate-400">
            No live data yet. Plug in the Arduino over USB and connect to see real
            readings
            {serialSupported ? '' : ' (open this page in Chrome or Edge)'}, or turn
            on Demo Mode to preview.
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <ArduinoConnectButton variant="compact" />
      </div>
    </div>
  );
}
