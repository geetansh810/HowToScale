import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import { nodes, states, decisions } from '@/content/extras';
import { kindLabel } from '@/lib/labels';

/**
 * Symptom-first discovery: "DB is slow", "duplicate events", "cache died" —
 * matches titles, summaries, symptoms and detection signals, not just names.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      ...nodes.map((n) => ({
        id: `n:${n.id}`,
        label: n.title,
        group: kindLabel(n.kind),
        href: `/knowledge/${n.id}`,
        keywords: [n.summary, ...(n.symptoms ?? []), ...(n.detectionSignals ?? [])].join(' '),
      })),
      ...states.map((s) => ({
        id: `s:${s.id}`,
        label: `${s.id.toUpperCase()} — ${s.title}`,
        group: 'Architecture State',
        href: `/journey/${s.id}`,
        keywords: s.narrative,
      })),
      ...decisions.map((d) => ({
        id: `d:${d.id}`,
        label: d.title,
        group: 'Decision',
        href: `/journey/${d.toState}`,
        keywords: d.trigger.join(' '),
      })),
    ],
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="max-w-xl mx-auto mt-[12vh] bg-paper border border-line shadow-2xl rounded-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Search" filter={(value, search) => {
          const v = value.toLowerCase();
          const s = search.toLowerCase();
          return v.includes(s) ? 1 : 0;
        }}>
          <div className="border-b border-line px-4">
            <Command.Input
              autoFocus
              placeholder='Try "DB is slow", "duplicate events", "redis"…'
              className="w-full py-4 bg-transparent outline-none font-mono text-[13px] placeholder:text-ink-3"
            />
          </div>
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-[13px] text-ink-3">
              Nothing found. Try a symptom — that&rsquo;s the point.
            </Command.Empty>
            {items.map((it) => (
              <Command.Item
                key={it.id}
                value={`${it.label} ${it.keywords}`}
                onSelect={() => {
                  navigate(it.href);
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer data-[selected=true]:bg-paper-2"
              >
                <span className="text-[13px] font-medium flex-1 truncate">{it.label}</span>
                <span className="meta shrink-0">{it.group}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
