import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { nodes } from '@/content/extras';
import { KIND_COLORS, kindLabel } from '@/lib/labels';
import type { NodeKind } from '@/content/types';

const KIND_ORDER: NodeKind[] = ['problem', 'concept', 'pattern', 'role', 'technology', 'failure'];

const KIND_DESC: Record<NodeKind, string> = {
  problem: 'Architectural limitations and pressures — the reason anything changes.',
  concept: 'Foundational ideas that travel across systems.',
  pattern: 'Reusable architectural approaches with conditions and trade-offs.',
  role: 'Architectural responsibilities, independent of any vendor.',
  technology: 'Concrete implementations of component roles.',
  failure: 'Reusable ways systems break — every pattern imports some.',
};

export function KnowledgeIndex() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return nodes;
    return nodes.filter((n) =>
      [n.title, n.summary, n.id, ...(n.symptoms ?? []), ...(n.detectionSignals ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [q]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14">
      <div className="meta mb-4">knowledge layer · what is generally true</div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">The Knowledge Base</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        {nodes.length} interconnected nodes. Search by name — or by symptom: &ldquo;DB is slow&rdquo;,
        &ldquo;duplicate events&rdquo;, &ldquo;cache died&rdquo;. Solutions should be findable before you know their
        names.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Filter… try "slow", "duplicate", "stale", "spof"'
        className="mt-8 w-full max-w-lg bg-transparent border border-line rounded-sm px-4 py-3 font-mono text-[13px] outline-none focus:border-signal transition-colors placeholder:text-ink-3"
      />

      <div className="mt-12 space-y-14">
        {KIND_ORDER.map((kind) => {
          const list = filtered.filter((n) => n.kind === kind);
          if (!list.length) return null;
          return (
            <section key={kind}>
              <div className="flex items-baseline gap-4 flex-wrap border-t-[1.5px] border-ink pt-4">
                <h2 className="font-serif text-2xl font-semibold tracking-tight" style={{ color: KIND_COLORS[kind] }}>
                  {kindLabel(kind)}s
                </h2>
                <span className="meta">{KIND_DESC[kind]}</span>
                <span className="meta ml-auto">{list.length}</span>
              </div>
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-sm overflow-hidden">
                {list.map((n) => (
                  <Link
                    key={n.id}
                    to={`/knowledge/${n.id}`}
                    className="hoverline block bg-paper p-5 group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="chip" style={{ color: KIND_COLORS[n.kind] }}>
                        {kindLabel(n.kind)}
                      </span>
                      <span className="meta">{n.status}</span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-signal transition-colors">
                      {n.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2 line-clamp-3">{n.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
