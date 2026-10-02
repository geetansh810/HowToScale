import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { nodeById, nodes, states, decisions } from '@/content/extras';
import { KIND_COLORS, kindLabel, ERA_LABELS } from '@/lib/labels';
import type { Edge } from '@/content/types';

const REL_LABEL: Record<Edge['type'], string> = {
  PREREQUISITE: 'learn first',
  USES: 'uses',
  SOLVES: 'solves',
  INTRODUCES: 'introduces',
  ALTERNATIVE_TO: 'alternative to',
  IMPLEMENTS: 'implements',
  HAS_FAILURE_MODE: 'can fail as',
  MITIGATED_BY: 'mitigated by',
  PART_OF: 'part of',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="meta mb-2 border-t border-line pt-4">{title}</div>
      {children}
    </section>
  );
}

export function NodePage() {
  const { nodeId } = useParams();
  const node = nodeById.get(nodeId ?? '');
  if (!node) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 py-20">
        <p className="font-serif text-2xl">Unknown node.</p>
        <Link to="/knowledge" className="link-ed text-[13px]">Back to knowledge base</Link>
      </div>
    );
  }

  const inbound = nodes.flatMap((n) =>
    n.edges.filter((e) => e.to === node.id).map((e) => ({ from: n, edge: e })),
  );
  const appearsInStates = states.filter(
    (s) =>
      s.components.some((c) => c.role === node.id || c.technology === node.id) ||
      s.patterns.includes(node.id) ||
      (s.failureScenarios ?? []).some((f) => f.failureMode === node.id),
  );
  const appearsInDecisions = decisions.filter(
    (d) =>
      d.problem.includes(node.id) ||
      d.newProblems.includes(node.id) ||
      d.newFailureModes.includes(node.id) ||
      d.options.some((o) => o.option === node.id || o.implementedWith?.includes(node.id)),
  );

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14">
      <Link to="/knowledge" className="link-ed inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-8">
        <ArrowLeft size={14} /> Knowledge base
      </Link>

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="chip" style={{ color: KIND_COLORS[node.kind] }}>
          {kindLabel(node.kind)}
        </span>
        <span className="meta">
          status: {node.status}
          {node.lastVerified ? ` · verified ${node.lastVerified}` : ''}
        </span>
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">{node.title}</h1>

      {/* 30-second depth */}
      <div className="mt-8 border-l-[3px] pl-5" style={{ borderColor: KIND_COLORS[node.kind] }}>
        <div className="meta mb-2">in 30 seconds</div>
        <p className="font-serif text-xl leading-relaxed">{node.summary}</p>
      </div>

      <div className="mt-10 grid lg:grid-cols-12 gap-10">
        {/* 5-minute depth */}
        <div className="lg:col-span-7 space-y-7">
          {node.problem && (
            <Section title="the pressure it answers">
              <p className="text-[14.5px] leading-relaxed text-ink-2">{node.problem}</p>
            </Section>
          )}
          {node.intuition && (
            <Section title="intuition">
              <p className="font-serif text-[16.5px] italic leading-relaxed text-ink">{node.intuition}</p>
            </Section>
          )}
          {node.howItWorks && (
            <Section title="how it works">
              <p className="text-[14.5px] leading-relaxed text-ink-2">{node.howItWorks}</p>
            </Section>
          )}
          {node.fitsWhere && (
            <Section title="where it fits in the journey">
              <p className="text-[14.5px] leading-relaxed text-ink-2">{node.fitsWhere}</p>
            </Section>
          )}
          {(node.improves?.length || node.costs?.length) && (
            <Section title="what it improves · what it costs">
              <div className="grid sm:grid-cols-2 gap-6">
                <ul className="space-y-1.5">
                  {node.improves?.map((i) => (
                    <li key={i} className="text-[13.5px] text-ink-2 flex gap-2">
                      <span className="text-kind-pattern">+</span>
                      {i}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1.5">
                  {node.costs?.map((c) => (
                    <li key={c} className="text-[13.5px] text-ink-2 flex gap-2">
                      <span className="text-kind-problem">−</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}
          {node.atScale && (
            <Section title="what changes at larger scale">
              <p className="text-[14.5px] leading-relaxed text-ink-2">{node.atScale}</p>
            </Section>
          )}
          {node.symptoms && (
            <Section title="how it shows up (symptoms)">
              <ul className="space-y-1.5">
                {node.symptoms.map((s) => (
                  <li key={s} className="text-[13.5px] font-mono text-ink-2">· {s}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.detectionSignals && (
            <Section title="detection signals">
              <ul className="space-y-1.5">
                {node.detectionSignals.map((s) => (
                  <li key={s} className="text-[13.5px] font-mono text-ink-2">· {s}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* connections sidebar */}
        <aside className="lg:col-span-5 space-y-8">
          <div>
            <div className="meta mb-3">relationships</div>
            <div className="border border-line rounded-sm divide-y divide-line">
              {node.edges.map((e) => {
                const target = nodeById.get(e.to);
                return (
                  <div key={e.to + e.type} className="p-3.5">
                    <div className="flex items-center gap-2 flex-wrap text-[13px]">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                        {REL_LABEL[e.type]}
                      </span>
                      <span className="text-ink-3">→</span>
                      {target ? (
                        <Link to={`/knowledge/${e.to}`} className="link-ed font-medium">
                          {target.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{e.to}</span>
                      )}
                    </div>
                    {e.conditions && (
                      <div className="mt-2">
                        <span className="meta">valid when</span>
                        <ul className="mt-1 space-y-0.5">
                          {e.conditions.map((c) => (
                            <li key={c} className="text-[12px] font-mono text-ink-2">◦ {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {e.tradeoffs && (
                      <div className="mt-1.5">
                        <span className="meta">at the cost of</span>
                        <ul className="mt-1 space-y-0.5">
                          {e.tradeoffs.map((t) => (
                            <li key={t} className="text-[12px] font-mono text-ink-2">◦ {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {e.note && <p className="mt-1.5 text-[12.5px] text-ink-3 italic">{e.note}</p>}
                  </div>
                );
              })}
              {inbound.map(({ from, edge }) => (
                <div key={from.id + edge.type} className="p-3.5 bg-paper-2/40">
                  <div className="flex items-center gap-2 flex-wrap text-[13px]">
                    <Link to={`/knowledge/${from.id}`} className="link-ed font-medium">
                      {from.title}
                    </Link>
                    <span className="text-ink-3">→</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                      {REL_LABEL[edge.type]}
                    </span>
                    <span className="text-ink-3">→ this</span>
                  </div>
                  {edge.note && <p className="mt-1.5 text-[12.5px] text-ink-3 italic">{edge.note}</p>}
                </div>
              ))}
              {node.edges.length === 0 && inbound.length === 0 && (
                <p className="p-3.5 text-[12.5px] text-ink-3">No relationships recorded yet.</p>
              )}
            </div>
          </div>

          {appearsInStates.length > 0 && (
            <div>
              <div className="meta mb-3">appears in the evolution layer</div>
              <div className="space-y-2">
                {appearsInStates.map((s) => (
                  <Link
                    key={s.id}
                    to={`/journey/${s.id}`}
                    className="flex items-center justify-between border border-line rounded-sm px-3.5 py-2.5 hover:border-signal transition-colors group"
                  >
                    <span className="text-[13px] font-medium group-hover:text-signal transition-colors">
                      {s.id.toUpperCase()} — {s.title}
                    </span>
                    <span className="meta">{ERA_LABELS[s.era]}</span>
                  </Link>
                ))}
                {appearsInDecisions.map((d) => (
                  <Link
                    key={d.id}
                    to={`/journey/${d.toState}`}
                    className="flex items-center justify-between border border-dashed border-line rounded-sm px-3.5 py-2.5 hover:border-signal transition-colors group"
                  >
                    <span className="text-[13px] font-medium group-hover:text-signal transition-colors">{d.title}</span>
                    <span className="meta">decision</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {node.sources && node.sources.length > 0 && (
            <div>
              <div className="meta mb-3">sources</div>
              <ul className="space-y-2">
                {node.sources.map((s) => (
                  <li key={s.title} className="text-[12.5px]">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="link-ed">
                        {s.title}
                      </a>
                    ) : (
                      <span>{s.title}</span>
                    )}
                    <span className="meta ml-2">{s.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
