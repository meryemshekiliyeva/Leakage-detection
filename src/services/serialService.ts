// ---------------------------------------------------------------------------
// serialService — connect the dashboard directly to the Arduino over USB
// using the browser's Web Serial API (Chrome / Edge / Opera on desktop).
//
// No Raspberry Pi and no backend are required: the browser reads the Arduino's
// serial output ("waterLevel,distance,leakDetected") straight from the USB port.
// The AI anomaly detection then runs in the frontend (see computeAnomaly).
//
// Web Serial requires a secure context (https:// or http://localhost) and must
// be started from a user gesture (a button click) — hence connectArduino() is
// only ever called from the "Connect Arduino" button.
// ---------------------------------------------------------------------------

export interface ParsedSerialReading {
  waterLevel: number;
  distance: number;
  leakDetected: boolean;
}

export interface SerialHandle {
  disconnect: () => Promise<void>;
}

interface ConnectOptions {
  baudRate?: number;
  onLine: (line: string) => void;
  onClose: (error?: string) => void;
}

/** Whether this browser supports the Web Serial API. */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/** Parse "waterLevel,distance,leakDetected" (leak as 1/0) into a reading. */
export function parseSerialLine(line: string): ParsedSerialReading | null {
  const parts = line.split(',');
  if (parts.length !== 3) return null;
  const waterLevel = parseFloat(parts[0]);
  const distance = parseFloat(parts[1]);
  if (Number.isNaN(waterLevel) || Number.isNaN(distance)) return null;
  const leakToken = parts[2].trim().toLowerCase();
  return {
    waterLevel: Math.min(100, Math.max(0, waterLevel)),
    distance: Math.max(0, distance),
    leakDetected: leakToken === '1' || leakToken === 'true',
  };
}

/**
 * Prompt the user to pick the Arduino's serial port, open it, and stream
 * decoded lines to `onLine`. Returns a handle with `disconnect()`.
 *
 * Throws if the user cancels the port picker or the port can't be opened —
 * the caller distinguishes a user cancel (AbortError/NotFoundError) from a
 * real failure.
 */
export async function connectArduino(opts: ConnectOptions): Promise<SerialHandle> {
  // Web Serial types aren't in the default TS DOM lib, so access via `any`.
  const nav = navigator as unknown as { serial: any };
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: opts.baudRate ?? 9600 });

  const decoder = new TextDecoderStream();
  const readableClosed: Promise<void> = port.readable
    .pipeTo(decoder.writable)
    .catch(() => {
      /* stream torn down on disconnect */
    });
  const reader = decoder.readable.getReader();

  let stopped = false;
  let buffer = '';

  const pump = async () => {
    try {
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += value;
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r$/, '').trim();
          buffer = buffer.slice(idx + 1);
          if (line) opts.onLine(line);
        }
      }
    } catch (err) {
      if (!stopped) {
        opts.onClose(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    if (!stopped) opts.onClose();
  };
  void pump();

  const disconnect = async () => {
    stopped = true;
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    try {
      await readableClosed;
    } catch {
      /* ignore */
    }
    try {
      await port.close();
    } catch {
      /* ignore */
    }
  };

  return { disconnect };
}

/** True when the thrown error means the user simply dismissed the port picker. */
export function isUserCancel(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'NotFoundError' || err.name === 'AbortError')
  );
}
