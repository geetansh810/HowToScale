import { Link } from 'react-router';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { states, decisions, nodes, journal } from '@/content/extras';

const loop = ['Conditions', 'Problem', 'Options', 'Decision', 'Architecture', 'Trade-offs', 'Failure', 'New Problem'];

export function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16">
        <div className="meta mb-6">issue nº 1 · scaling an online store · public beta</div>
        <h1 className="font-serif font-light tracking-tight leading-[1.02] text-[clamp(2.6rem,7vw,5.5rem)]">
          Don&rsquo;t memorize architectures.
          <br />
          <span className="font-semibold">
            Learn how architectures <em className="not-italic text-signal">emerge</em>.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-[15px] sm:text-base leading-relaxed text-ink-2">
          From your first HTTP request to systems serving thousands of requests per second — understand the
          decisions, trade-offs, connections and failures that shape large-scale software architecture.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/journey"
            className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-3 text-[13px] font-semibold tracking-wide rounded-sm hover:bg-signal transition-colors"
          >
            Start the journey <ArrowRight size={15} />
          </Link>
          <Link
            to="/knowledge"
            className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold tracking-wide rounded-sm border border-ink/25 hover:border-signal hover:text-signal transition-colors"
          >
            Search the knowledge base
          </Link>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-t border-line">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-12 gap-10">
          <Reveal className="md:col-span-4">
            <div className="meta mb-3">the problem</div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight leading-tight">
              You can learn any component. The missing part is the <em>causality</em> between them.
            </h2>
          </Reveal>
          <Reveal className="md:col-span-7 md:col-start-6">
            <div className="space-y-4 text-[14.5px] leading-relaxed text-ink-2">
              <p>
                Excellent material exists about Kafka, Redis, sharding and load balancing — scattered across books,
                blogs and interview guides. What is often missing: why did this component become necessary? What
                alternatives existed? What trade-off did it introduce? What happens when it fails? What problem
                appears next?
              </p>
              <p>
                This platform never shows you a component because it is &ldquo;the next chapter&rdquo;. Every box in
                every diagram was earned by a condition the previous architecture could no longer meet.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* REASONING LOOP */}
      <section className="bg-ink text-paper">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16">
          <Reveal>
            <div className="meta text-paper/40 mb-3">the core abstraction</div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight">The architectural reasoning loop</h2>
          </Reveal>
          <Reveal>
            <div className="mt-10 flex flex-wrap items-center gap-y-3">
              {loop.map((step, i) => (
                <div key={step} className="flex items-center">
                  <span
                    className={`font-mono text-[11px] sm:text-[12px] tracking-[0.1em] uppercase px-3 py-2 border ${
                      step === 'Decision'
                        ? 'border-signal text-signal'
                        : 'border-paper/25 text-paper/75'
                    } rounded-sm`}
                  >
                    {step}
                  </span>
                  {i < loop.length - 1 && <ArrowRight size={13} className="mx-1.5 text-paper/40 shrink-0" />}
                </div>
              ))}
              <div className="flex items-center">
                <ArrowDown size={13} className="mx-1.5 text-paper/40 rotate-180 sm:rotate-0 sm:hidden" />
                <span className="font-mono text-[11px] text-paper/40 ml-1">↺ loops</span>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-paper/55">
              Every journey state, every decision record, every node in the knowledge graph is an instance of this
              loop. Internalize it and you can reason about systems you have never seen before — that, not diagram
              recall, is the definition of mastery here.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FOUR EXPERIENCES */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16">
        <Reveal>
          <div className="meta mb-3">what&rsquo;s inside</div>
          <h2 className="font-serif text-3xl font-semibold tracking-tight mb-10">Four ways in</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-px bg-line border border-line rounded-sm overflow-hidden">
          {[
            {
              to: '/journey',
              n: '01',
              title: 'The Learning Journey',
              body: `One online store, ${states.length} architecture states, ${decisions.length} recorded decisions. From a single server to caches, replicas and queues — each change triggered by conditions, never by curriculum.`,
            },
            {
              to: '/knowledge',
              n: '02',
              title: 'The Knowledge Base',
              body: `${nodes.length} interconnected nodes: problems, concepts, patterns, roles, technologies, failure modes. Learn any concept independently — with its trade-offs and its failures attached.`,
            },
            {
              to: '/graph',
              n: '03',
              title: 'The Architecture Map',
              body: 'A visual projection of the knowledge model. Follow SOLVES, ALTERNATIVE_TO and HAS_FAILURE_MODE edges — every relationship carries its conditions.',
            },
            {
              to: '/walkthrough',
              n: '04',
              title: 'The Request Walkthrough',
              body: 'Trace one order placement through the final architecture of Part 1. Every component you watched being added, carrying its specific responsibility.',
            },
          ].map((c) => (
            <Reveal key={c.n}>
              <Link to={c.to} className="hoverline block bg-paper p-7 sm:p-9 h-full group">
                <div className="meta mb-4">{c.n}</div>
                <h3 className="font-serif text-2xl font-semibold tracking-tight group-hover:text-signal transition-colors">
                  {c.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{c.body}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-signal">
                  Enter <ArrowRight size={13} />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* JOURNAL TEASER */}
      <section className="border-t border-line">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16">
          <Reveal>
            <div className="flex items-baseline justify-between mb-10 flex-wrap gap-3">
              <div>
                <div className="meta mb-3">learning in public</div>
                <h2 className="font-serif text-3xl font-semibold tracking-tight">From the journal</h2>
              </div>
              <Link to="/journal" className="link-ed text-[13px] font-medium">
                All entries →
              </Link>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {journal.map((j) => (
              <Reveal key={j.id}>
                <Link to="/journal" className="hoverline block pt-4 group">
                  <div className="meta mb-2">{j.date}</div>
                  <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-signal transition-colors">
                    {j.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2 line-clamp-3">{j.body[0]}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
