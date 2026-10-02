import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { states, decisionToState, nodeById } from '@/content/extras';
import { ERA_LABELS } from '@/lib/labels';
import { Reveal } from '@/components/Reveal';

export function Journey() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14">
      <div className="meta mb-4">journey · part 1</div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">Scaling an Online Store</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        From one server to thousands of requests per second. Every state below is a genuine architecture; every
        arrow between them is a decision with options considered, trade-offs accepted and failure modes imported.
      </p>

      <div className="mt-14 relative">
        {/* vertical spine */}
        <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px bg-line" />

        <div className="space-y-14">
          {states.map((s) => {
            const decision = decisionToState.get(s.id);
            return (
              <div key={s.id}>
                {/* decision arrow between states */}
                {decision && (
                  <Reveal>
                    <div className="relative pl-12 sm:pl-16 mb-6 -mt-6">
                      <div className="border-l-2 border-dashed border-signal/50 pl-5 py-2">
                        <div className="meta text-signal mb-1">decision {decision.id}</div>
                        <p className="font-serif text-lg font-semibold">{decision.title}</p>
                        <p className="text-[12.5px] text-ink-3 mt-1 font-mono">
                          trigger: {decision.trigger[0]}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                )}

                <Reveal>
                  <Link to={`/journey/${s.id}`} className="relative pl-12 sm:pl-16 block group">
                    {/* node marker */}
                    <div className="absolute left-0 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-paper border-[1.5px] border-ink flex items-center justify-center font-mono text-[11px] sm:text-[12px] font-semibold group-hover:bg-signal group-hover:border-signal group-hover:text-paper transition-colors">
                      {s.id.toUpperCase()}
                    </div>

                    <div className="hoverline border border-line rounded-sm bg-paper p-5 sm:p-7 pt-6">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="meta">{ERA_LABELS[s.era]}</span>
                        <span className="meta">·</span>
                        <span className="font-mono text-[11.5px] text-ink-3">
                          {s.conditions.traffic.rps.toLocaleString()} rps · p95{' '}
                          {s.conditions.latency.p95_ms ?? '—'} ms ·{' '}
                          {s.conditions.availability.target ?? 'no availability target'}
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight group-hover:text-signal transition-colors">
                        {s.title}
                      </h2>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink-2 max-w-2xl">{s.headline}</p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {[...new Set(s.components.map((c) => c.role))].map((r) => (
                          <span key={r} className="chip text-ink-2">
                            {nodeById.get(r)?.title ?? r}
                          </span>
                        ))}
                        {s.patterns.map((p) => (
                          <span key={p} className="chip text-kind-pattern">
                            {nodeById.get(p)?.title ?? p}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-signal">
                        Open state <ArrowRight size={13} />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              </div>
            );
          })}

          {/* what's next */}
          <Reveal>
            <div className="relative pl-12 sm:pl-16">
              <div className="absolute left-0 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-dashed border-ink-3 flex items-center justify-center font-mono text-[11px] text-ink-3">
                S7+
              </div>
              <div className="border border-dashed border-ink-3/50 rounded-sm p-5 sm:p-7">
                <div className="meta mb-2">deferred until earned</div>
                <p className="text-[13.5px] leading-relaxed text-ink-2 max-w-2xl">
                  Part 2 — event-driven systems (Kafka enters when replay and multi-consumer requirements arrive) ·
                  Part 3 — partitioning &amp; sharding · Part 4 — multi-region · Part 5 — reliability &amp;
                  observability. Nothing appears because it is popular.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
