import { useEffect, useState } from 'react';

/**
 * Returns a `Date.now()` value that refreshes on an interval, so relative-time
 * labels ("2 seconds ago") stay current without every component owning a timer.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
