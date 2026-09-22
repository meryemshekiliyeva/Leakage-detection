import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clockTime } from '@/lib/format';
import type { SensorData } from '@/types';

interface Props {
  data: SensorData[];
  pageSize?: number;
}

/** Paginated raw-readings table. Newest rows first. */
export function SensorTable({ data, pageSize = 10 }: Props) {
  const [page, setPage] = useState(0);
  const rows = [...data].reverse();
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 text-right font-semibold">Water Level</th>
              <th className="px-4 py-3 text-right font-semibold">Distance</th>
              <th className="px-4 py-3 font-semibold">Leak</th>
              <th className="px-4 py-3 font-semibold">AI Status</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={`${r.timestamp}-${i}`}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-2.5 font-mono text-slate-300">
                  {clockTime(r.timestamp)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-white">
                  {Math.round(r.waterLevel)}%
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-300">
                  {r.distance} cm
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      r.leakDetected ? 'text-danger-400' : 'text-normal-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.leakDetected ? 'bg-danger-500' : 'bg-normal-500'
                      }`}
                    />
                    {r.leakDetected ? 'WET' : 'DRY'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      r.aiStatus === 'ANOMALY' ? 'text-warn-400' : 'text-normal-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.aiStatus === 'ANOMALY' ? 'bg-warn-500' : 'bg-normal-500'
                      }`}
                    />
                    {r.aiStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-slate-400">
        <span>
          Showing {slice.length} of {rows.length} readings
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="btn-ghost px-2 py-1 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono">
            {safePage + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="btn-ghost px-2 py-1 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
