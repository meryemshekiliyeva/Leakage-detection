import { Usb, Unplug, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useSystem } from '@/store/SystemContext';

/**
 * "Connect Arduino" control. Uses the Web Serial API (via the context) to read
 * the Arduino directly over USB — no backend required. Web Serial needs a user
 * gesture, so the actual connection is always triggered by this button.
 *
 * variant="compact" -> a single header button.
 * variant="full"    -> a settings row with status, note and error.
 */
export function ArduinoConnectButton({
  variant = 'compact',
}: {
  variant?: 'compact' | 'full';
}) {
  const {
    serialSupported,
    serialConnected,
    serialError,
    connectArduino,
    disconnectArduino,
  } = useSystem();
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectArduino();
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectArduino();
    } finally {
      setBusy(false);
    }
  };

  // -- Compact (header) ----------------------------------------------------
  if (variant === 'compact') {
    if (!serialSupported) return null; // hide in unsupported browsers
    if (serialConnected) {
      return (
        <button
          onClick={handleDisconnect}
          disabled={busy}
          className="btn px-3 py-2 text-xs bg-normal-500/20 text-normal-300 ring-1 ring-inset ring-normal-500/40 hover:bg-normal-500/30"
          title="Arduino connected over USB — click to disconnect"
        >
          <Usb className="h-4 w-4" />
          <span className="hidden sm:inline">Arduino Live</span>
        </button>
      );
    }
    return (
      <button
        onClick={handleConnect}
        disabled={busy}
        className="btn-ghost px-3 py-2 text-xs"
        title="Connect the Arduino over USB (Chrome/Edge)"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Usb className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Connect Arduino</span>
      </button>
    );
  }

  // -- Full (settings) -----------------------------------------------------
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-navy-900/50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              serialConnected ? 'bg-normal-500/15 text-normal-400' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Usb className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Arduino (USB / Web Serial)
            </div>
            <div className="text-xs text-slate-400">
              {serialConnected
                ? 'Connected — reading live sensor data'
                : 'Read the Arduino directly in your browser'}
            </div>
          </div>
        </div>
        {serialConnected ? (
          <button onClick={handleDisconnect} disabled={busy} className="btn-ghost px-3 py-2 text-xs">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={busy || !serialSupported}
            className="btn-primary px-3 py-2 text-xs"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Usb className="h-4 w-4" />}
            Connect
          </button>
        )}
      </div>

      {!serialSupported && (
        <div className="flex items-start gap-2 rounded-lg border border-warn-500/20 bg-warn-500/[0.06] p-3 text-xs text-warn-200/90">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn-400" />
          This browser doesn't support Web Serial. Use <strong>Chrome</strong> or{' '}
          <strong>Edge</strong> on desktop, over <code>localhost</code> or HTTPS.
        </div>
      )}

      {serialError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-500/[0.06] p-3 text-xs text-danger-200/90">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-400" />
          {serialError}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Plug the Arduino into this computer via USB, click Connect, and pick the
        port (usually shows as “Arduino” or a USB serial device). The dashboard
        reads <code>waterLevel,distance,leak</code> at 9600 baud and runs anomaly
        detection in the browser.
      </p>
    </div>
  );
}
