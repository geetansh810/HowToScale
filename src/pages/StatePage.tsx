import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { stateById, states, decisionToState, nodeById } from '@/content/extras';
import { StateDiagram } from '@/components/StateDiagram';
import { ConditionsTable } from '@/components/ConditionsTable';
import { DiffView } from '@/components/DiffView';
import { DecisionCard } from '@/components/DecisionCard';
import { ERA_LABELS } from '@/lib/labels';

export function StatePage() {
  const { stateId } = useParams();
  const state = stateById.get(stateId ?? '');
  if (!state) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 py-20">
        <p className="font-serif text-2xl">Unknown state.</p>
        <Link to="/journey" className="link-ed text-[13px]">Back to journey</Link>
      </div>
    );
  }

  const idx = states.findIndex((s) => s.id === state.id);
  const prev = idx > 0 ? states[idx - 1] : null;
  const next = idx < states.length - 1 ? states[idx + 1] : null;
  const decision = decisionToState.get(state.id);
  const nextDecision = next ? decisionToState.get(next.id) : undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        {prev ? (
          <Link to={`/journey/${prev.id}`} className="link-ed inline-flex items-center gap-1.5 text-[12.5px] font-medium">
            <ArrowLeft size={14} /> {prev.id.toUpperCase()} — {prev.title}
          </Link>
        ) : (
          <Link to="/journey" className="link-ed inline-flex items-center gap-1.5 text-[12.5px] font-medium">
            <ArrowLeft size={14} /> Journey
          </Link>
        )}
        {next && (
          <Link to={`/journey/${next.id}`} className="link-ed inline-flex items-center gap-1.5 text-[12.5px] font-medium">
            {next.id.toUpperCase()} — {next.title} <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="meta mb-3">
        {ERA_LABELS[state.era]} · state {state.id.toUpperCase()}
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">{state.title}</h1>
      <p className="mt-3 font-serif text-xl text-ink-2 italic">{state.headline}</p>

      {/* the decision that led here */}
      {decision && (
        <div className="mt-10">
          <div className="meta mb-3">how we got here</div>
          <DecisionCard decision={decision} />
        </div>
      )}

      {/* diagram + conditions */}
      <div className="mt-12 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="meta mb-3">architecture</div>
          <div className="border border-line rounded-sm bg-[#fbf9f4] p-2 sm:p-4">
            <StateDiagram state={state} />
          </div>
          <p className="mt-3 text-[12px] font-mono text-ink-3">
            runtime topology is contextual — it lives in this state, not in the knowledge graph.
          </p>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div>
            <div className="meta mb-3">conditions</div>
            <ConditionsTable conditions={state.conditions} />
          </div>
          {state.configuration.length > 0 && (
            <div className="border border-line rounded-sm overflow-hidden">
              <div className="meta px-3 py-2 bg-paper-2 border-b border-line">configuration</div>
              <div className="p-3 space-y-1.5">
                {state.configuration.map((c) => (
                  <div key={c.key} className="text-[12px] font-mono">
                    <span className="text-ink-3">{c.key}</span>
                    <br />
                    <span className="text-ink">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* narrative */}
      <div className="mt-12 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="meta mb-3">the story of this state</div>
          <p className="font-serif text-[17px] leading-[1.75] text-ink">{state.narrative}</p>

          {state.teachingNotes && (
            <div className="mt-8 space-y-3">
              <div className="meta">what this state teaches</div>
              {state.teachingNotes.map((t, i) => (
                <div key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                  <span className="font-mono text-signal shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {prev && (
            <div>
              <div className="meta mb-3">what changed</div>
              <DiffView prev={prev} next={state} />
            </div>
          )}
          {state.failureScenarios && state.failureScenarios.length > 0 && (
            <div className="mt-8">
              <div className="meta mb-3 flex items-center gap-1.5">
                <AlertTriangle size={11} /> failure scenarios in this state
              </div>
              <div className="space-y-3">
                {state.failureScenarios.map((fs) => (
                  <div key={fs.title} className="border border-kind-failure/30 bg-kind-failure/5 rounded-sm p-4">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-[14px]">{fs.title}</h4>
                      <Link to={`/knowledge/${fs.failureMode}`} className="chip text-kind-failure">
                        {nodeById.get(fs.failureMode)?.title ?? fs.failureMode}
                      </Link>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{fs.narrative}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* what breaks next */}
      {nextDecision && (
        <div className="mt-14 border-t-[1.5px] border-ink pt-8">
          <div className="meta mb-3">what breaks next?</div>
          <p className="font-serif text-xl sm:text-2xl font-semibold max-w-3xl leading-snug">
            {nextDecision.trigger[0]}
          </p>
          <p className="mt-3 text-[14px] text-ink-2 max-w-2xl">
            Before opening the next state: what options would you consider? Which would you choose — and what would
            it cost?
          </p>
          <Link
            to={`/journey/${next!.id}`}
            className="mt-6 inline-flex items-center gap-2 bg-ink text-paper px-5 py-2.5 text-[13px] font-semibold rounded-sm hover:bg-signal transition-colors"
          >
            See the decision <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
