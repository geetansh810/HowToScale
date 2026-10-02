/**
 * Knowledge model for the System Design Knowledge Base.
 *
 * Two layers:
 *  - Knowledge Layer  ("What is generally true?")  → KnowledgeNode
 *  - Evolution Layer  ("Why did this system make this decision?") → ArchitectureState + Decision
 */

// ---------------------------------------------------------------------------
// Knowledge Layer
// ---------------------------------------------------------------------------

export type NodeKind =
  | 'problem'
  | 'concept'
  | 'pattern'
  | 'role' // component role
  | 'technology'
  | 'failure'; // failure mode

/** The strictly-defined relationship vocabulary. */
export type RelType =
  | 'PREREQUISITE' // learning order
  | 'USES' // pattern/concept → component role
  | 'SOLVES' // technique → problem (conditional!)
  | 'INTRODUCES' // technique → new problem / failure mode
  | 'ALTERNATIVE_TO' // peer options
  | 'IMPLEMENTS' // technology → component role
  | 'HAS_FAILURE_MODE'
  | 'MITIGATED_BY'
  | 'PART_OF';

export interface Edge {
  to: string;
  type: RelType;
  /** When is this relationship valid? Edges are conditional, never absolute. */
  conditions?: string[];
  /** What the relationship costs. */
  tradeoffs?: string[];
  note?: string;
}

export interface Source {
  title: string;
  url?: string;
  type: 'primary' | 'secondary' | 'experimental';
}

export type NodeStatus = 'draft' | 'reviewed' | 'verified';

export interface KnowledgeNode {
  id: string;
  kind: NodeKind;
  title: string;
  status: NodeStatus;
  lastVerified?: string;

  /** 30-second depth: what is this and why should I care? */
  summary: string;

  /** 5-minute depth */
  problem?: string; // the pressure this responds to (or, for problems, the context)
  intuition?: string;
  howItWorks?: string;
  fitsWhere?: string;
  improves?: string[];
  costs?: string[];
  atScale?: string;

  /** Symptom-first discovery: "DB is slow", "duplicate events"... */
  symptoms?: string[];
  detectionSignals?: string[];

  edges: Edge[];
  sources?: Source[];
}

// ---------------------------------------------------------------------------
// Evolution Layer
// ---------------------------------------------------------------------------

export interface Conditions {
  traffic: { rps: number };
  latency: { p95_ms: number | null };
  availability: { target: string | null };
  workload: { read_write_ratio: string };
  data: { size_gb: number };
  /** Domain-specific consistency — never one global model. */
  consistency: Record<string, 'strong' | 'eventual'>;
}

export interface StateComponent {
  id: string;
  /** References a component-role node. */
  role: string;
  /** References a technology node (optional). */
  technology?: string;
  host?: string;
  count?: number;
  /** Diagram layout, 0–100 coordinate space. */
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureState {
  id: string;
  era:
    | 'one-machine'
    | 'scale-compute'
    | 'scale-reads'
    | 'scale-work'
    | 'scale-data'
    | 'reliability'
    | 'operations';
  title: string;
  headline: string;
  conditions: Conditions;
  components: StateComponent[];
  connections: Connection[];
  /** Pattern node ids active in this state (may be behavior, not boxes). */
  patterns: string[];
  /** Configuration-level changes: indexes, pools, timeouts... */
  configuration: { key: string; value: string }[];
  narrative: string;
  teachingNotes?: string[];
  /** Failure scenarios contextual to this state. */
  failureScenarios?: { title: string; failureMode: string; narrative: string }[];
}

export type Verdict = 'chosen' | 'deferred' | 'rejected';

export interface DecisionOption {
  /** Pattern/concept node id, or free label for one-off options. */
  option: string;
  label?: string;
  verdict: Verdict;
  implementedWith?: string[]; // technology node ids
  reason: string;
}

export interface Decision {
  id: string;
  title: string;
  fromState: string;
  toState: string;
  trigger: string[];
  /** Problem node ids. */
  problem: string[];
  bindingConstraints: string[];
  options: DecisionOption[];
  tradeoffs: string[];
  /** Problem node ids — separate from failure modes. */
  newProblems: string[];
  /** Failure-mode node ids. */
  newFailureModes: string[];
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  states: string[]; // ordered state ids
}

// ---------------------------------------------------------------------------
// Walkthrough
// ---------------------------------------------------------------------------

export interface WalkthroughStep {
  title: string;
  detail: string;
  /** Component ids in the state diagram touched by this step. */
  path: string[];
  links?: { node: string; label: string }[];
}

export interface Walkthrough {
  id: string;
  title: string;
  /** Every walkthrough identifies the ArchitectureState it represents. */
  stateId: string;
  intro: string;
  steps: WalkthroughStep[];
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string[];
  links?: { kind: 'node' | 'state' | 'decision'; id: string; label: string }[];
}
