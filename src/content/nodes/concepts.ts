import type { KnowledgeNode } from '../types';

export const concepts: KnowledgeNode[] = [
  {
    id: 'latency',
    kind: 'concept',
    title: 'Latency & Tail Latency',
    status: 'reviewed',
    summary:
      'Latency is how long one operation takes; throughput is how many you do per second. Systems usually fail latency targets at the tail (p95/p99) first, because rare slow paths dominate the worst requests.',
    intuition:
      'Average checkout time can be fine while one customer in twenty waits forever. Users remember the wait, not the average.',
    howItWorks:
      'Every component adds latency: network hops, queuing, disk, locks. Percentiles (p95, p99) expose the tail that averages hide. A request that fans out to N services has a tail set by the slowest of N.',
    fitsWhere:
      'The binding constraint of nearly every state in the journey: each era is triggered by a latency or capacity target being violated.',
    improves: [],
    costs: [],
    edges: [{ to: 'availability', type: 'ALTERNATIVE_TO', note: 'Distinct requirement class: speed vs. uptime. Often conflated; they fail differently.' }],
    sources: [
      {
        title: 'The Tail at Scale — Dean & Barroso, CACM 2013',
        url: 'https://research.google/pubs/the-tail-at-scale/',
        type: 'primary',
      },
    ],
  },
  {
    id: 'availability',
    kind: 'concept',
    title: 'Availability',
    status: 'reviewed',
    summary:
      'Availability is the fraction of time a system correctly responds. Each additional "nine" (99.9% → 99.95%) costs disproportionately more redundancy, automation and operational discipline.',
    intuition:
      '99.9% allows ~43 minutes of downtime a month; 99.99% allows ~4. The difference is not effort — it is architecture.',
    howItWorks:
      'Availability of serial dependencies multiplies: two 99.9% components in the request path give ~99.8%. Redundancy removes single points of failure; failover speed determines how much an incident costs.',
    fitsWhere:
      'Introduced at S2 — the moment the store decides downtime has a business cost — and renegotiated at every later state.',
    edges: [
      { to: 'horizontal-scaling', type: 'USES', note: 'Redundant instances behind a load balancer are the first availability mechanism in the journey.' },
      { to: 'database-primary-failure', type: 'HAS_FAILURE_MODE' },
    ],
    sources: [
      {
        title: 'Google SRE Book — Service Level Objectives',
        url: 'https://sre.google/sre-book/service-level-objectives/',
        type: 'primary',
      },
    ],
  },
  {
    id: 'horizontal-scaling',
    kind: 'concept',
    title: 'Horizontal Scaling',
    status: 'reviewed',
    summary:
      'Add more machines instead of a bigger machine. It buys near-linear capacity and redundancy, but only works for components that are stateless or can externalize their state.',
    intuition:
      'A wider bridge, not a faster car: many ordinary lanes beat one heroic lane — if traffic can be distributed.',
    howItWorks:
      'A load balancer spreads requests across N interchangeable instances. The hard part is state: sessions, files and in-memory caches must move out of the instance (database, shared store) or be made irrelevant (stateless tokens).',
    fitsWhere:
      'S2 scales the application tier horizontally; later, the same idea reappears for read replicas and workers.',
    costs: [
      'requires statelessness or externalized state',
      'adds a load balancer to operate and reason about',
      'capacity planning becomes fleet planning',
    ],
    edges: [
      { to: 'load-balancer', type: 'USES' },
      { to: 'replication', type: 'ALTERNATIVE_TO', note: 'Replication scales data reads; horizontal scaling scales compute. Different bottlenecks.' },
    ],
    sources: [
      {
        title: 'NGINX Docs — Load Balancing',
        url: 'https://nginx.org/en/docs/http/load_balancing.html',
        type: 'primary',
      },
    ],
  },
  {
    id: 'replication',
    kind: 'concept',
    title: 'Replication',
    status: 'reviewed',
    summary:
      'Keeping copies of the same data on multiple nodes. Replicas add read capacity and survivability — at the price of lag: copies trail the primary, so reads can be stale.',
    intuition:
      'Photocopies of the ledger distributed to branches: everyone can read locally, but a new entry takes time to arrive.',
    howItWorks:
      'The primary applies writes and streams changes (e.g. the WAL in PostgreSQL) to replicas. Replicas serve reads. Streaming is asynchronous by default, which creates replication lag; synchronous replication reduces lag at write-latency cost.',
    fitsWhere: 'S5 introduces read replicas once cache misses and non-cacheable reads overload the primary.',
    costs: ['replication lag / stale reads', 'more infrastructure to operate', 'failover complexity when the primary dies'],
    edges: [
      { to: 'partitioning', type: 'PREREQUISITE', note: 'Learn replication before sharding: shards are usually also replicated.' },
      { to: 'replication-lag', type: 'HAS_FAILURE_MODE' },
      { to: 'consistency-models', type: 'PART_OF' },
    ],
    sources: [
      {
        title: 'PostgreSQL Docs — Streaming Replication',
        url: 'https://www.postgresql.org/docs/current/warm-standby.html',
        type: 'primary',
      },
      {
        title: 'Designing Data-Intensive Applications, Ch. 5 (Replication)',
        type: 'secondary',
      },
    ],
  },
  {
    id: 'consistency-models',
    kind: 'concept',
    title: 'Consistency Models & Read-Your-Writes',
    status: 'reviewed',
    summary:
      'Consistency defines what a read is allowed to see after a write. It is a per-domain choice: the product catalog tolerates minutes of staleness; an order must never appear missing to the customer who just placed it.',
    intuition:
      'Different promises for different data: a catalog can be "eventually right"; your bank balance must be right when you look at it.',
    howItWorks:
      'Strong consistency serializes reads and writes so every read sees the latest committed write. Eventual consistency accepts a convergence window. Read-your-writes is a middle path: the *writer* always sees their own writes (e.g. route their reads to the primary for a window), while others may lag.',
    fitsWhere:
      'Made explicit at S5, when the replica lag makes a freshly-placed order disappear from "My Orders".',
    costs: ['stronger guarantees cost latency, availability, or both (CAP-shaped trade-offs)'],
    edges: [
      { to: 'replication', type: 'PART_OF' },
      { to: 'stale-data', type: 'SOLVES', conditions: ['freshness requirements are explicit per domain'], note: 'A consistency model is how you *decide* how much staleness is acceptable.' },
    ],
    sources: [
      {
        title: 'Designing Data-Intensive Applications, Ch. 5 (Read-your-writes)',
        type: 'secondary',
      },
      {
        title: 'Jepsen — Consistency Models',
        url: 'https://jepsen.io/consistency',
        type: 'primary',
      },
    ],
  },
  {
    id: 'partitioning',
    kind: 'concept',
    title: 'Partitioning',
    status: 'draft',
    summary:
      'Splitting one logical dataset into disjoint subsets (partitions) so no single node must hold or serve everything. The prerequisite idea behind sharding.',
    intuition:
      'One phone book per city instead of one book per country: each book is manageable, but finding someone now requires knowing their city.',
    howItWorks:
      'A partition key maps each record to a subset. Good keys spread load evenly; bad keys create hot partitions. Querying across partitions (scatter-gather) is the fundamental new cost.',
    fitsWhere:
      'Deferred in the MVP journey (data is still small), it becomes the doorway to the Distributed Data segment in Part 3.',
    costs: ['cross-partition queries and transactions get hard', 'rebalancing is an operational project'],
    edges: [{ to: 'replication', type: 'ALTERNATIVE_TO', note: 'Replication copies the whole dataset; partitioning splits it. Large systems need both.' }],
    sources: [
      { title: 'Designing Data-Intensive Applications, Ch. 6 (Partitioning)', type: 'secondary' },
    ],
  },
  {
    id: 'at-least-once-delivery',
    kind: 'concept',
    title: 'At-Least-Once Delivery',
    status: 'reviewed',
    summary:
      'A messaging guarantee: messages are never lost, but may be delivered more than once. It is the default stance of work queues because the alternative — at-most-once — silently loses work.',
    intuition:
      'Certified mail: the courier retries until you sign. If the receipt is lost after signing, they deliver again.',
    howItWorks:
      'The broker removes a message only after the consumer acknowledges it. Any crash between processing and ack causes redelivery. Exactly-once *delivery* does not exist across failure boundaries — exactly-once *effect* is achieved with idempotent consumers.',
    fitsWhere: 'Appears the moment S6 introduces the work queue, and immediately creates the duplicate-processing problem.',
    costs: ['consumers must be idempotent', 'monitoring must distinguish redelivery from new work'],
    edges: [
      { to: 'duplicate-processing', type: 'INTRODUCES' },
      { to: 'idempotency-key', type: 'MITIGATED_BY', note: 'Idempotency turns at-least-once delivery into effectively-once effects.' },
    ],
    sources: [
      {
        title: 'RabbitMQ Docs — Reliability / Acknowledgements',
        url: 'https://www.rabbitmq.com/docs/reliability',
        type: 'primary',
      },
    ],
  },
];
