import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { walkthrough, stateById } from '@/content/extras';
import { StateDiagram } from '@/components/StateDiagram';

export function WalkthroughPage() {
  const state = stateById.get(walkthrough.stateId)!;
  const [step, setStep] = useState(0);
  const current = walkthrough.steps[step];

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14">
      <div className="meta mb-3">
        request walkthrough · architecture state {walkthrough.stateId.toUpperCase()}
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">{walkthrough.title}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">{walkthrough.intro}</p>

      <div className="mt-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* diagram */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div className="border border-line rounded-sm bg-[#fbf9f4] p-2 sm:p-4">
            <StateDiagram state={state} highlight={current.path} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold disabled:opacity-30 hover:text-signal transition-colors"
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <span className="meta">
              step {step + 1} / {walkthrough.steps.length}
            </span>
            <button
              onClick={() => setStep((s) => Math.min(walkthrough.steps.length - 1, s + 1))}
              disabled={step === walkthrough.steps.length - 1}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold disabled:opacity-30 hover:text-signal transition-colors"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* steps */}
        <div className="lg:col-span-5 space-y-2">
          {walkthrough.steps.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`w-full text-left border rounded-sm p-4 transition-colors ${
                i === step
                  ? 'border-signal bg-signal/5'
                  : i < step
                    ? 'border-line bg-paper opacity-70'
                    : 'border-line bg-paper hover:border-ink-3'
              }`}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={`font-mono text-[11px] font-semibold ${i === step ? 'text-signal' : 'text-ink-3'}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="font-semibold text-[14px]">{s.title}</div>
                  {i === step && (
                    <>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{s.detail}</p>
                      {s.links && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {s.links.map((l) => (
                            <Link
                              key={l.node}
                              to={`/knowledge/${l.node}`}
                              className="chip text-ink-2 hover:text-signal"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}

          <div className="mt-6 border-t-[1.5px] border-ink pt-5">
            <p className="text-[13px] leading-relaxed text-ink-2">
              Every walkthrough identifies the ArchitectureState it represents. This one runs on{' '}
              <Link to={`/journey/${state.id}`} className="link-ed font-medium">
                {state.id.toUpperCase()} — {state.title}
              </Link>
              . Later walkthroughs: payments, inventory, Kafka events, retries, failures, recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
