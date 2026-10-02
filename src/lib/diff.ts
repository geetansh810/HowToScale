import type { ArchitectureState, Conditions } from '@/content/types';
import { nodeById } from '@/content/extras';

export interface StateDiff {
  addedComponents: { id: string; label: string }[];
  removedComponents: { id: string; label: string }[];
  changedComponents: { id: string; from: string; to: string }[];
  addedPatterns: string[];
  removedPatterns: string[];
  configChanges: { key: string; from: string | null; to: string | null }[];
  conditionChanges: { path: string; from: string; to: string }[];
}

function compLabel(c: { role: string; technology?: string }): string {
  const role = nodeById.get(c.role)?.title ?? c.role;
  const tech = c.technology ? nodeById.get(c.technology)?.title ?? c.technology : undefined;
  return tech ? `${role} (${tech})` : role;
}

function flattenConditions(c: Conditions, prefix = 'conditions'): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) {
    if (v !== null && typeof v === 'object') {
      out[`${prefix}.${k}`] = JSON.stringify(v);
    }
  }
  return out;
}

export function diffStates(prev: ArchitectureState, next: ArchitectureState): StateDiff {
  const prevComps = new Map(prev.components.map((c) => [c.id, c]));
  const nextComps = new Map(next.components.map((c) => [c.id, c]));

  const addedComponents = next.components
    .filter((c) => !prevComps.has(c.id))
    .map((c) => ({ id: c.id, label: compLabel(c) }));
  const removedComponents = prev.components
    .filter((c) => !nextComps.has(c.id))
    .map((c) => ({ id: c.id, label: compLabel(c) }));
  const changedComponents = next.components
    .filter((c) => {
      const p = prevComps.get(c.id);
      return p && (p.role !== c.role || p.technology !== c.technology);
    })
    .map((c) => ({ id: c.id, from: compLabel(prevComps.get(c.id)!), to: compLabel(c) }));

  const addedPatterns = next.patterns.filter((p) => !prev.patterns.includes(p));
  const removedPatterns = prev.patterns.filter((p) => !next.patterns.includes(p));

  const prevCfg = new Map(prev.configuration.map((c) => [c.key, c.value]));
  const nextCfg = new Map(next.configuration.map((c) => [c.key, c.value]));
  const configChanges: StateDiff['configChanges'] = [];
  for (const [key, value] of nextCfg) {
    const from = prevCfg.get(key) ?? null;
    if (from !== value) configChanges.push({ key, from, to: value });
  }
  for (const key of prevCfg.keys()) {
    if (!nextCfg.has(key)) configChanges.push({ key, from: prevCfg.get(key)!, to: null });
  }

  const flatA = flattenConditions(prev.conditions);
  const flatB = flattenConditions(next.conditions);
  const conditionChanges: StateDiff['conditionChanges'] = [];
  for (const path of new Set([...Object.keys(flatA), ...Object.keys(flatB)])) {
    if (flatA[path] !== flatB[path]) {
      conditionChanges.push({ path, from: flatA[path] ?? '—', to: flatB[path] ?? '—' });
    }
  }

  return { addedComponents, removedComponents, changedComponents, addedPatterns, removedPatterns, configChanges, conditionChanges };
}
