import { diffStates } from '@/lib/diff';
import { nodeById } from '@/content/extras';
import type { ArchitectureState } from '@/content/types';
import { Link } from 'react-router';
import { Plus, Minus, ArrowRight } from 'lucide-react';

export function DiffView({ prev, next }: { prev: ArchitectureState; next: ArchitectureState }) {
  const d = diffStates(prev, next);
  const empty =
    !d.addedComponents.length &&
    !d.removedComponents.length &&
    !d.changedComponents.length &&
    !d.addedPatterns.length &&
    !d.removedPatterns.length &&
    !d.configChanges.length &&
    !d.conditionChanges.length;

  if (empty) return <p className="text-[13px] text-ink-3">No structural changes in this transition.</p>;

  return (
    <div className="font-mono text-[12.5px] border border-line rounded-sm overflow-hidden">
      <div className="meta px-3 py-2 bg-paper-2 border-b border-line flex justify-between">
        <span>state diff</span>
        <span>
          {prev.id.toUpperCase()} → {next.id.toUpperCase()}
        </span>
      </div>
      <div className="p-3 space-y-1 bg-[#fbf9f4]">
        {d.addedComponents.map((c) => (
          <div key={c.id} className="flex gap-2 text-kind-pattern">
            <Plus size={13} className="mt-0.5 shrink-0" />
            <span>component: {c.label}</span>
          </div>
        ))}
        {d.removedComponents.map((c) => (
          <div key={c.id} className="flex gap-2 text-kind-problem">
            <Minus size={13} className="mt-0.5 shrink-0" />
            <span>component: {c.label}</span>
          </div>
        ))}
        {d.changedComponents.map((c) => (
          <div key={c.id} className="flex gap-2 text-kind-role">
            <ArrowRight size={13} className="mt-0.5 shrink-0" />
            <span>
              {c.id}: {c.from} → {c.to}
            </span>
          </div>
        ))}
        {d.addedPatterns.map((p) => {
          const n = nodeById.get(p);
          return (
            <div key={p} className="flex gap-2 text-kind-pattern">
              <Plus size={13} className="mt-0.5 shrink-0" />
              <span>
                pattern:{' '}
                <Link to={`/knowledge/${p}`} className="underline decoration-line underline-offset-2 hover:text-signal">
                  {n?.title ?? p}
                </Link>
              </span>
            </div>
          );
        })}
        {d.removedPatterns.map((p) => (
          <div key={p} className="flex gap-2 text-kind-problem">
            <Minus size={13} className="mt-0.5 shrink-0" />
            <span>pattern: {nodeById.get(p)?.title ?? p}</span>
          </div>
        ))}
        {d.configChanges.map((c) => (
          <div key={c.key} className="flex gap-2 text-ink-2">
            {c.from === null ? (
              <Plus size={13} className="mt-0.5 shrink-0 text-kind-pattern" />
            ) : (
              <ArrowRight size={13} className="mt-0.5 shrink-0" />
            )}
            <span className="break-all">
              config {c.key}
              {c.from !== null && <span className="text-ink-3"> = {c.from}</span>}
              <span> → {c.to ?? 'removed'}</span>
            </span>
          </div>
        ))}
        {d.conditionChanges.map((c) => (
          <div key={c.path} className="flex gap-2 text-kind-concept">
            <ArrowRight size={13} className="mt-0.5 shrink-0" />
            <span>
              {c.path}: {c.from} → {c.to}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
