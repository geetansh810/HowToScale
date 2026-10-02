import type { Conditions } from '@/content/types';

export function ConditionsTable({ conditions }: { conditions: Conditions }) {
  const rows: [string, string][] = [
    ['traffic.rps', `${conditions.traffic.rps.toLocaleString()} req/s`],
    ['latency.p95_ms', conditions.latency.p95_ms ? `${conditions.latency.p95_ms} ms` : '—'],
    ['availability.target', conditions.availability.target ?? 'none'],
    ['workload.read_write_ratio', conditions.workload.read_write_ratio],
    ['data.size_gb', `${conditions.data.size_gb} GB`],
    ...Object.entries(conditions.consistency).map(
      ([k, v]) => [`consistency.${k}`, v] as [string, string],
    ),
  ];
  return (
    <div className="border border-line rounded-sm overflow-hidden">
      <div className="meta px-3 py-2 bg-paper-2 border-b border-line">operating conditions</div>
      <dl>
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className={`flex justify-between gap-4 px-3 py-1.5 text-[12.5px] ${i % 2 ? 'bg-paper-2/50' : ''}`}
          >
            <dt className="font-mono text-ink-2">{k}</dt>
            <dd className="font-mono font-medium text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
