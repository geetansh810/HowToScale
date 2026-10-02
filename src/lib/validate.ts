import type { KnowledgeNode } from '@/content/types';
import { decisions, nodes, states } from '@/content/extras';

/**
 * Content validation — the knowledge base is treated like software.
 * Returns a list of violations; an empty list means the graph is sound.
 */
export function validateContent(): string[] {
  const errors: string[] = [];
  const byId = new Map<string, KnowledgeNode>();

  // Duplicate IDs
  for (const n of nodes) {
    if (byId.has(n.id)) errors.push(`duplicate id: ${n.id}`);
    byId.set(n.id, n);
  }

  const exists = (id: string) => byId.has(id);
  const kindOf = (id: string) => byId.get(id)?.kind;

  // Unknown references + relationship sanity
  for (const n of nodes) {
    for (const e of n.edges) {
      if (!exists(e.to)) {
        errors.push(`${n.id}: unknown reference '${e.to}'`);
        continue;
      }
      if (e.type === 'IMPLEMENTS' && kindOf(e.to) !== 'role')
        errors.push(`${n.id}: IMPLEMENTS must target a component role (got ${e.to}:${kindOf(e.to)})`);
      if (e.type === 'SOLVES' && kindOf(e.to) !== 'problem')
        errors.push(`${n.id}: SOLVES must target a problem (got ${e.to}:${kindOf(e.to)})`);
      if (e.type === 'HAS_FAILURE_MODE' && kindOf(e.to) !== 'failure')
        errors.push(`${n.id}: HAS_FAILURE_MODE must target a failure mode (got ${e.to}:${kindOf(e.to)})`);
      if (e.type === 'INTRODUCES' && !['problem', 'failure'].includes(kindOf(e.to)!))
        errors.push(`${n.id}: INTRODUCES must target a problem or failure mode (got ${e.to}:${kindOf(e.to)})`);
      if (e.type === 'PREREQUISITE' && kindOf(e.to) !== 'concept')
        errors.push(`${n.id}: PREREQUISITE should target a concept (got ${e.to}:${kindOf(e.to)})`);
    }
  }

  // Circular PREREQUISITE
  const prereq = new Map<string, string[]>();
  for (const n of nodes) prereq.set(n.id, n.edges.filter((e) => e.type === 'PREREQUISITE').map((e) => e.to));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (visiting.has(id)) {
      errors.push(`circular prerequisite: ${[...path, id].join(' → ')}`);
      return;
    }
    if (done.has(id)) return;
    visiting.add(id);
    for (const t of prereq.get(id) ?? []) visit(t, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  nodes.forEach((n) => visit(n.id, []));

  // State references
  const stateIds = new Set(states.map((s) => s.id));
  for (const s of states) {
    for (const c of s.components) {
      if (!exists(c.role)) errors.push(`${s.id}: unknown role '${c.role}'`);
      else if (kindOf(c.role) !== 'role') errors.push(`${s.id}: '${c.role}' is not a component role`);
      if (c.technology && !exists(c.technology)) errors.push(`${s.id}: unknown technology '${c.technology}'`);
      else if (c.technology && kindOf(c.technology) !== 'technology')
        errors.push(`${s.id}: '${c.technology}' is not a technology`);
    }
    for (const conn of s.connections) {
      if (!s.components.some((c) => c.id === conn.from)) errors.push(`${s.id}: connection from unknown component '${conn.from}'`);
      if (!s.components.some((c) => c.id === conn.to)) errors.push(`${s.id}: connection to unknown component '${conn.to}'`);
    }
    for (const p of s.patterns) {
      if (!exists(p)) errors.push(`${s.id}: unknown pattern '${p}'`);
      else if (kindOf(p) !== 'pattern') errors.push(`${s.id}: '${p}' is not a pattern`);
    }
    for (const fs of s.failureScenarios ?? []) {
      if (!exists(fs.failureMode)) errors.push(`${s.id}: scenario references unknown failure mode '${fs.failureMode}'`);
      else if (!['failure', 'problem'].includes(kindOf(fs.failureMode)!))
        errors.push(`${s.id}: scenario '${fs.title}' references '${fs.failureMode}' which is neither failure mode nor problem`);
    }
  }

  // Decision integrity
  for (const d of decisions) {
    if (!stateIds.has(d.fromState)) errors.push(`${d.id}: unknown from_state '${d.fromState}'`);
    if (!stateIds.has(d.toState)) errors.push(`${d.id}: unknown to_state '${d.toState}'`);
    if (!d.options.some((o) => o.verdict === 'chosen')) errors.push(`${d.id}: decision without chosen option`);
    for (const p of d.problem) {
      if (!exists(p)) errors.push(`${d.id}: unknown problem '${p}'`);
      else if (kindOf(p) !== 'problem') errors.push(`${d.id}: problem field contains '${p}' (${kindOf(p)}) — problems only`);
    }
    for (const p of d.newProblems) {
      if (!exists(p)) errors.push(`${d.id}: unknown new_problem '${p}'`);
      else if (kindOf(p) !== 'problem') errors.push(`${d.id}: new_problems contains '${p}' (${kindOf(p)}) — problems only`);
    }
    for (const f of d.newFailureModes) {
      if (!exists(f)) errors.push(`${d.id}: unknown new_failure_mode '${f}'`);
      else if (kindOf(f) !== 'failure') errors.push(`${d.id}: new_failure_modes contains '${f}' (${kindOf(f)}) — failure modes only`);
    }
  }

  return errors;
}
