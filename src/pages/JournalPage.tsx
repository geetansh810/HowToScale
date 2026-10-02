import { Link } from 'react-router';
import { journal, decisionById } from '@/content/extras';

function linkHref(kind: 'node' | 'state' | 'decision', id: string): string {
  if (kind === 'node') return `/knowledge/${id}`;
  if (kind === 'state') return `/journey/${id}`;
  const d = decisionById.get(id);
  return d ? `/journey/${d.toState}` : '/journey';
}

export function JournalPage() {
  return (
    <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-14">
      <div className="meta mb-4">learn → research → model → challenge → build → explain → publish</div>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">The Public Journal</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        Reference content is neutral and sourced; the journal is first-person, dated and reflective. This is where
        the platform documents its own reasoning being corrected — the same loop it teaches.
      </p>

      <div className="mt-14 space-y-16">
        {journal.map((j) => (
          <article key={j.id}>
            <div className="meta mb-3">{j.date}</div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">{j.title}</h2>
            <div className="mt-5 space-y-4">
              {j.body.map((p, i) => (
                <p key={i} className="font-serif text-[16.5px] leading-[1.8] text-ink">
                  {p}
                </p>
              ))}
            </div>
            {j.links && (
              <div className="mt-5 flex flex-wrap gap-2">
                {j.links.map((l) => (
                  <Link key={l.id} to={linkHref(l.kind, l.id)} className="chip text-ink-2 hover:text-signal">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
