import { Link } from 'react-router';
import type { Decision } from '@/content/types';
import { nodeById } from '@/content/extras';
import { Check, Pause, X, AlertTriangle, Flame } from 'lucide-react';

function NodeRef({ id, label }: { id: string; label?: string }) {
  const n = nodeById.get(id);
  const text = label ?? n?.title ?? id;
  if (!n) return <span className="font-medium">{text}</span>;
  return (
    <Link to={`/knowledge/${id}`} className="link-ed font-medium">
      {text}
    </Link>
  );
}

const verdictStyle = {
  chosen: { icon: Check, cls: 'text-kind-pattern border-kind-pattern/40 bg-kind-pattern/5' },
  deferred: { icon: Pause, cls: 'text-kind-role border-kind-role/40 bg-kind-role/5' },
  rejected: { icon: X, cls: 'text-kind-problem border-kind-problem/30 bg-kind-problem/5' },
} as const;

export function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <article className="border border-line rounded-sm bg-paper">
      <header className="px-5 sm:px-7 pt-5 pb-4 border-b border-line">
        <div className="meta mb-2">
          decision {decision.id} · {decision.fromState.toUpperCase()} → {decision.toState.toUpperCase()}
        </div>
        <h3 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight">{decision.title}</h3>
      </header>

      <div className="px-5 sm:px-7 py-5 space-y-6">
        <section>
          <div className="meta mb-2">trigger</div>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-2">
            {decision.trigger.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-signal mt-0.5">→</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="meta mb-2">problem</div>
          <div className="flex flex-wrap gap-2">
            {decision.problem.map((p) => (
              <span key={p} className="chip text-kind-problem">
                <NodeRef id={p} />
              </span>
            ))}
          </div>
          <div className="meta mt-3 mb-1.5">binding constraints</div>
          <div className="flex flex-wrap gap-2">
            {decision.bindingConstraints.map((c) => (
              <code key={c} className="font-mono text-[11px] bg-paper-2 border border-line px-1.5 py-0.5 rounded-sm">
                {c}
              </code>
            ))}
          </div>
        </section>

        <section>
          <div className="meta mb-2">options considered</div>
          <div className="space-y-3">
            {decision.options.map((o) => {
              const V = verdictStyle[o.verdict];
              return (
                <div key={o.option + o.verdict} className={`border rounded-sm p-4 ${V.cls.split(' ')[1]} ${V.cls.split(' ')[2]} border`}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <V.icon size={14} className={V.cls.split(' ')[0]} />
                    <span className="font-medium text-[14px]">
                      <NodeRef id={o.option} label={o.label} />
                    </span>
                    <span className={`chip ${V.cls.split(' ')[0]} ml-auto`}>{o.verdict}</span>
                    {o.implementedWith?.map((t) => (
                      <span key={t} className="chip text-kind-technology">
                        <NodeRef id={t} />
                      </span>
                    ))}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{o.reason}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid sm:grid-cols-3 gap-4">
          <section>
            <div className="meta mb-2">trade-offs accepted</div>
            <ul className="space-y-1 text-[13px] text-ink-2">
              {decision.tradeoffs.map((t) => (
                <li key={t} className="font-mono text-[12px]">· {t}</li>
              ))}
            </ul>
          </section>
          <section>
            <div className="meta mb-2 flex items-center gap-1"><AlertTriangle size={11} /> new problems</div>
            <ul className="space-y-1 text-[13px]">
              {decision.newProblems.length === 0 && <li className="text-ink-3 text-[12.5px]">none</li>}
              {decision.newProblems.map((p) => (
                <li key={p}><NodeRef id={p} /></li>
              ))}
            </ul>
          </section>
          <section>
            <div className="meta mb-2 flex items-center gap-1"><Flame size={11} /> new failure modes</div>
            <ul className="space-y-1 text-[13px]">
              {decision.newFailureModes.length === 0 && <li className="text-ink-3 text-[12.5px]">none</li>}
              {decision.newFailureModes.map((f) => (
                <li key={f}><NodeRef id={f} /></li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
