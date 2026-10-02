import type { NodeKind } from '@/content/types';

export const KIND_COLORS: Record<NodeKind, string> = {
  problem: '#b3402f',
  concept: '#3e5c9a',
  pattern: '#1e7a55',
  role: '#8a6d1d',
  technology: '#6d4a9e',
  failure: '#c26417',
};

export function kindLabel(kind: NodeKind): string {
  switch (kind) {
    case 'role':
      return 'Component Role';
    case 'failure':
      return 'Failure Mode';
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}

export const ERA_LABELS: Record<string, string> = {
  'one-machine': 'One Machine',
  'scale-compute': 'Scale Compute',
  'scale-reads': 'Scale Reads',
  'scale-work': 'Scale Work',
  'scale-data': 'Scale Data',
  reliability: 'Reliability',
  operations: 'Operations',
};
