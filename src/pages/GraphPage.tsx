import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node as RFNode,
  type Edge as RFEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodes, nodeById, states } from '@/content/extras';
import { KIND_COLORS, kindLabel } from '@/lib/labels';
import type { Edge as KEdge, NodeKind } from '@/content/types';

const COLUMN: NodeKind[] = ['concept', 'problem', 'pattern', 'failure', 'role', 'technology'];
const COL_X = 235;
const ROW_H = 88;

const EDGE_COLORS: Record<KEdge['type'], string> = {
  SOLVES: '#1e7a55',
  INTRODUCES: '#c26417',
  HAS_FAILURE_MODE: '#c26417',
  ALTERNATIVE_TO: '#857e70',
  USES: '#3e5c9a',
  IMPLEMENTS: '#6d4a9e',
  PREREQUISITE: '#17140c',
  MITIGATED_BY: '#1e7a55',
  PART_OF: '#b3ab96',
};

interface SelectedEdge {
  from: string;
  to: string;
  type: KEdge['type'];
  conditions?: string[];
  tradeoffs?: string[];
  note?: string;
}

export function GraphPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedEdge | null>(null);
  const [journeyOnly, setJourneyOnly] = useState(false);

  const inJourney = useMemo(() => {
    const set = new Set<string>();
    for (const s of states) {
      s.components.forEach((c) => {
        set.add(c.role);
        if (c.technology) set.add(c.technology);
      });
      s.patterns.forEach((p) => set.add(p));
      (s.failureScenarios ?? []).forEach((f) => set.add(f.failureMode));
    }
    return set;
  }, []);

  const { rfNodes, rfEdges } = useMemo(() => {
    const byCol = new Map<NodeKind, number>();
    const rfNodes: RFNode[] = nodes.map((n) => {
      const col = COLUMN.indexOf(n.kind);
      const row = byCol.get(n.kind) ?? 0;
      byCol.set(n.kind, row + 1);
      const faded = journeyOnly && !inJourney.has(n.id);
      return {
        id: n.id,
        position: { x: col * COL_X, y: row * ROW_H + (col % 2) * 30 },
        data: { label: n.title },
        draggable: true,
        style: {
          background: '#fbf9f4',
          border: `1.5px solid ${KIND_COLORS[n.kind]}`,
          borderLeft: `5px solid ${KIND_COLORS[n.kind]}`,
          borderRadius: 3,
          fontFamily: 'Archivo, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          width: 190,
          padding: '6px 10px',
          color: '#17140c',
          opacity: faded ? 0.2 : 1,
        },
      };
    });

    const rfEdges: RFEdge[] = nodes.flatMap((n) =>
      n.edges
        .filter((e) => nodeById.has(e.to))
        .map((e) => ({
          id: `${n.id}-${e.type}-${e.to}`,
          source: n.id,
          target: e.to,
          label: e.type.replace(/_/g, ' '),
          labelStyle: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, fill: EDGE_COLORS[e.type] },
          labelBgStyle: { fill: '#f6f4ee', fillOpacity: 0.9 },
          style: { stroke: EDGE_COLORS[e.type], strokeWidth: 1.2, opacity: 0.75 },
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[e.type], width: 14, height: 14 },
          data: { from: n.id, to: e.to, type: e.type, conditions: e.conditions, tradeoffs: e.tradeoffs, note: e.note },
        })),
    );
    return { rfNodes, rfEdges };
  }, [journeyOnly, inJourney]);

  const onEdgeClick = useCallback((_: unknown, edge: RFEdge) => {
    setSelected(edge.data as unknown as SelectedEdge);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
      <div className="meta mb-3">visual projection of the knowledge model</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">The Architecture Map</h1>
        <label className="flex items-center gap-2 text-[12px] font-mono cursor-pointer select-none">
          <input
            type="checkbox"
            checked={journeyOnly}
            onChange={(e) => setJourneyOnly(e.target.checked)}
            className="accent-[#c8401a]"
          />
          highlight what the journey uses
        </label>
      </div>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-2">
        The graph is not the product — it is a projection of the content repository. Click a node to open it; click
        an edge to read <em>when the relationship holds and what it costs</em>. Edges are conditional, never
        absolute.
      </p>

      <div className="mt-6 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 border border-line rounded-sm overflow-hidden bg-[#fbf9f4]" style={{ height: 560 }}>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onEdgeClick={onEdgeClick}
            onNodeClick={(_, n) => navigate(`/knowledge/${n.id}`)}
            fitView
            minZoom={0.3}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#ddd7c8" gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <aside className="lg:col-span-3">
          <div className="meta mb-3">legend</div>
          <div className="space-y-1.5 mb-6">
            {COLUMN.map((k) => (
              <div key={k} className="flex items-center gap-2 text-[12px]">
                <span className="w-3 h-3 rounded-[2px]" style={{ background: KIND_COLORS[k] }} />
                {kindLabel(k)}
              </div>
            ))}
          </div>
          <div className="meta mb-3">relationship</div>
          {selected ? (
            <div className="border border-line rounded-sm p-4 bg-paper">
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: EDGE_COLORS[selected.type] }}>
                {selected.type.replace(/_/g, ' ')}
              </div>
              <div className="text-[13px] font-medium">
                {nodeById.get(selected.from)?.title} → {nodeById.get(selected.to)?.title}
              </div>
              {selected.conditions && (
                <div className="mt-3">
                  <div className="meta">valid when</div>
                  <ul className="mt-1 space-y-0.5">
                    {selected.conditions.map((c) => (
                      <li key={c} className="text-[12px] font-mono text-ink-2">◦ {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.tradeoffs && (
                <div className="mt-3">
                  <div className="meta">at the cost of</div>
                  <ul className="mt-1 space-y-0.5">
                    {selected.tradeoffs.map((t) => (
                      <li key={t} className="text-[12px] font-mono text-ink-2">◦ {t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.note && <p className="mt-3 text-[12.5px] italic text-ink-3">{selected.note}</p>}
            </div>
          ) : (
            <p className="text-[12.5px] text-ink-3 border border-dashed border-line rounded-sm p-4">
              Click any edge to see its conditions and trade-offs.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
