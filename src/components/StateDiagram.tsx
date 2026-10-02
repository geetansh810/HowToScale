import type { ArchitectureState } from '@/content/types';
import { nodeById } from '@/content/extras';
import { KIND_COLORS } from '@/lib/labels';

const W = 920;
const H = 560;
const BOX_W = 148;
const BOX_H = 44;

function px(v: number, max: number) {
  return (v / 100) * max;
}

/**
 * Renders an ArchitectureState as an editorial SVG diagram.
 * Client box is implicit; topology comes from state.connections —
 * runtime communication lives in the state, not in the knowledge graph.
 */
export function StateDiagram({
  state,
  highlight = [],
  className = '',
}: {
  state: ArchitectureState;
  highlight?: string[];
  className?: string;
}) {
  const comp = new Map(state.components.map((c) => [c.id, c]));
  const hl = new Set(highlight);
  const dimOthers = highlight.length > 0;

  // implicit client above the topmost component
  const topMost = state.components.reduce((a, b) => (a.y < b.y ? a : b), state.components[0]);
  const client = { x: 50, y: Math.max(2, topMost.y - 17) };

  const center = (c: { x: number; y: number }) => ({ cx: px(c.x, W), cy: px(c.y, H) });

  /** clip a line to the box border so arrows stop at the edge */
  function edgePoints(a: { x: number; y: number }, b: { x: number; y: number }) {
    const A = center(a);
    const B = center(b);
    const dx = B.cx - A.cx;
    const dy = B.cy - A.cy;
    const clip = (P: { cx: number; cy: number }, sign: 1 | -1) => {
      const hw = BOX_W / 2;
      const hh = BOX_H / 2;
      const t = Math.min(
        dx !== 0 ? Math.abs(hw / dx) : Infinity,
        dy !== 0 ? Math.abs(hh / dy) : Infinity,
      );
      return { x: P.cx + sign * dx * t, y: P.cy + sign * dy * t };
    };
    return { p1: clip(A, 1), p2: clip(B, -1) };
  }

  const box = (
    id: string,
    x: number,
    y: number,
    title: string,
    subtitle: string | undefined,
    color: string,
    dashed = false,
  ) => {
    const cx = px(x, W);
    const cy = px(y, H);
    const active = hl.has(id);
    const opacity = dimOthers && !active && id !== '__client' ? 0.28 : 1;
    return (
      <g key={id} opacity={opacity} style={{ transition: 'opacity .3s' }}>
        <rect
          x={cx - BOX_W / 2}
          y={cy - BOX_H / 2}
          width={BOX_W}
          height={BOX_H}
          rx={3}
          fill={active ? color : '#fbf9f4'}
          stroke={color}
          strokeWidth={active ? 2 : 1.25}
          strokeDasharray={dashed ? '5 3' : undefined}
        />
        <text
          x={cx}
          y={cy - (subtitle ? 3 : -4)}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={600}
          fontFamily="Archivo, sans-serif"
          fill={active ? '#fff' : '#17140c'}
        >
          {title}
        </text>
        {subtitle && (
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            fontSize={9}
            fontFamily="'IBM Plex Mono', monospace"
            fill={active ? 'rgba(255,255,255,.85)' : '#857e70'}
          >
            {subtitle}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full ${className}`} role="img" aria-label={`Architecture of ${state.title}`}>
      <defs>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#857e70" />
        </marker>
        <marker id="arr-hl" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#c8401a" />
        </marker>
      </defs>

      {/* edges */}
      {[{ from: '__client', to: topMost.id }, ...state.connections].map((c, i) => {
        const from = c.from === '__client' ? client : comp.get(c.from)!;
        const to = comp.get(c.to)!;
        if (!from || !to) return null;
        const { p1, p2 } = edgePoints(from, to);
        const active = hl.has(c.from) && hl.has(c.to);
        return (
          <g key={i} opacity={dimOthers && !active ? 0.18 : 1} style={{ transition: 'opacity .3s' }}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={active ? '#c8401a' : '#b3ab96'}
              strokeWidth={active ? 1.8 : 1}
              markerEnd={`url(#${active ? 'arr-hl' : 'arr'})`}
            />
            {'label' in c && c.label && (
              <text
                x={(p1.x + p2.x) / 2 + 5}
                y={(p1.y + p2.y) / 2 - 4}
                fontSize={8.5}
                fontFamily="'IBM Plex Mono', monospace"
                fill={active ? '#c8401a' : '#857e70'}
              >
                {c.label}
              </text>
            )}
          </g>
        );
      })}

      {/* client */}
      {box('__client', client.x, client.y, 'Client', undefined, '#17140c', true)}

      {/* components */}
      {state.components.map((c) => {
        const roleNode = nodeById.get(c.role);
        const techNode = c.technology ? nodeById.get(c.technology) : undefined;
        return box(
          c.id,
          c.x,
          c.y,
          c.id.replace(/-/g, ' '),
          techNode ? techNode.title : roleNode?.title,
          KIND_COLORS[c.technology ? 'technology' : roleNode?.kind ?? 'role'] ?? '#17140c',
        );
      })}

      {/* host annotations */}
      {state.components
        .filter((c) => c.host)
        .map((c) => (
          <text
            key={`h-${c.id}`}
            x={px(c.x, W)}
            y={px(c.y, H) + BOX_H / 2 + 12}
            textAnchor="middle"
            fontSize={8.5}
            fontFamily="'IBM Plex Mono', monospace"
            fill="#857e70"
          >
            {c.host}
          </text>
        ))}
    </svg>
  );
}
