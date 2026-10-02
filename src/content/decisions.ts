import type { Decision } from './types';

export const decisions: Decision[] = [
  {
    id: 'd-01-separate-db',
    title: 'Move the database to its own machine',
    fromState: 's0',
    toState: 's1',
    trigger: [
      'Traffic grew 3× after launch; app and database now compete for CPU, memory and disk I/O on one host',
      'Heavy queries measurably inflate request latency during peaks',
    ],
    problem: ['resource-contention'],
    bindingConstraints: ['traffic.rps', 'latency.p95_ms'],
    options: [
      {
        option: 'vertical-scaling',
        label: 'Bigger machine',
        verdict: 'rejected',
        reason:
          'Postpones the problem for weeks, keeps both workloads coupled, and the single machine remains a single point of failure. No architectural improvement, just a larger bill.',
      },
      {
        option: 'separate-database-server',
        label: 'Separate database server',
        verdict: 'chosen',
        implementedWith: ['postgresql'],
        reason:
          'Separates two responsibilities that need to scale and be tuned independently. Cheapest change that removes the contention; preserves the simple topology.',
      },
    ],
    tradeoffs: ['network hop between app and data', 'two machines to operate instead of one'],
    newProblems: [],
    newFailureModes: [],
  },
  {
    id: 'd-02-horizontal-app',
    title: 'Scale the application tier horizontally',
    fromState: 's1',
    toState: 's2',
    trigger: [
      'One application server saturates at ~800 RPS; request queueing inflates p95 past target',
      'The store adopts a 99.9% availability target — one instance can never meet it',
    ],
    problem: ['app-tier-capacity', 'single-point-of-failure'],
    bindingConstraints: ['traffic.rps', 'latency.p95_ms', 'availability.target'],
    options: [
      {
        option: 'vertical-scaling',
        label: 'Bigger app server',
        verdict: 'rejected',
        reason:
          'Solves capacity briefly and solves availability never. The target is 99.9% — redundancy is mandatory, not optional.',
      },
      {
        option: 'horizontal-scaling',
        label: 'N stateless app servers behind a load balancer',
        verdict: 'chosen',
        implementedWith: ['nginx', 'spring-boot'],
        reason:
          'Adds capacity and removes the app-tier SPOF in one move. Feasible because the app is made stateless: signed tokens replace server-side sessions — no shared session store required.',
      },
      {
        option: 'sticky-sessions',
        label: 'Horizontal scaling with sticky sessions',
        verdict: 'rejected',
        reason:
          'Keeps session state in each server, coupling requests to instances: uneven load, painful deploys, and data loss on instance failure. Stateless tokens are strictly cleaner at this scale.',
      },
    ],
    tradeoffs: ['load balancer is a new component (and a new SPOF to manage)', 'statelessness constraint on all future features'],
    newProblems: ['slow-queries'],
    newFailureModes: [],
  },
  {
    id: 'd-03-db-optimization',
    title: 'Optimize before you scale: indexes, pooling, timeouts',
    fromState: 's2',
    toState: 's3',
    trigger: [
      'Database latency now dominates request latency; p95 misses the 400 ms target',
      'EXPLAIN shows sequential scans on hot queries; connection churn consumes DB memory',
    ],
    problem: ['slow-queries'],
    bindingConstraints: ['latency.p95_ms', 'workload.read_write_ratio'],
    options: [
      {
        option: 'database-indexing',
        verdict: 'chosen',
        implementedWith: ['postgresql'],
        reason:
          'The hot queries filter and sort on indexable columns; the 80/20 read/write ratio makes write amplification cheap. Fixes the root cause with zero new infrastructure.',
      },
      {
        option: 'connection-pooling',
        verdict: 'chosen',
        implementedWith: ['postgresql'],
        reason: 'Per-request connection setup is pure overhead at 1500 RPS; a bounded pool also protects the database from connection storms.',
      },
      {
        option: 'cache-aside',
        verdict: 'deferred',
        reason:
          'Caching would help, but adding infrastructure before fixing the queries would bake bad queries into the architecture. Optimize first; cache when optimized reads are still too expensive.',
      },
      {
        option: 'vertical-scaling',
        label: 'Bigger database server',
        verdict: 'rejected',
        reason: 'Masks fixable inefficiency with hardware; the sequential scans stay sequential.',
      },
    ],
    tradeoffs: ['indexes slow down writes', 'pool exhaustion now queues requests (visible backpressure)'],
    newProblems: ['db-read-bottleneck'],
    newFailureModes: [],
  },
  {
    id: 'd-04-cache',
    title: 'Introduce cache-aside for hot catalog reads',
    fromState: 's3',
    toState: 's4',
    trigger: [
      'Read latency exceeds the 300 ms target as traffic reaches 3000 RPS',
      'The same product queries repeat thousands of times per minute against an already-optimized database',
    ],
    problem: ['db-read-bottleneck'],
    bindingConstraints: ['latency.p95_ms', 'workload.read_write_ratio', 'consistency.product_catalog'],
    options: [
      {
        option: 'read-replication',
        verdict: 'deferred',
        reason:
          'Spreads database load but does not directly solve the latency caused by repeated hot reads — a replica answers in disk time, not memory time. May become right once misses and non-cacheable reads dominate.',
      },
      {
        option: 'materialized-views',
        label: 'Materialized views',
        verdict: 'rejected',
        reason:
          'The workload is dominated by simple key lookups, not expensive aggregation queries. Wrong tool for this shape of read.',
      },
      {
        option: 'cache-aside',
        verdict: 'chosen',
        implementedWith: ['redis'],
        reason:
          'Reads are repetitive, the workload is read-heavy, and the product catalog tolerates a minute of staleness. Memory-time reads for hot keys; the database stays the source of truth. Orders and inventory — strong consistency domains — bypass the cache entirely.',
      },
    ],
    tradeoffs: ['stale-data', 'invalidation-complexity', 'extra-infrastructure'],
    newProblems: ['stale-data'],
    newFailureModes: ['cache-stampede', 'cache-unavailable', 'hot-key'],
  },
  {
    id: 'd-05-read-replicas',
    title: 'Split reads and writes with read replicas',
    fromState: 's4',
    toState: 's5',
    trigger: [
      'Cache misses and non-cacheable reads (search, order history) keep growing with traffic',
      'The single primary now contends between all writes and all uncached reads; the 99.95% target raises the stakes',
    ],
    problem: ['db-primary-overload'],
    bindingConstraints: ['traffic.rps', 'availability.target', 'consistency.orders'],
    options: [
      {
        option: 'vertical-scaling',
        label: 'Bigger primary',
        verdict: 'rejected',
        reason: 'A larger single writer does not improve availability and only delays the read/write split that is clearly coming.',
      },
      {
        option: 'partitioning',
        label: 'Shard the database',
        verdict: 'rejected',
        reason:
          'Premature: 120 GB fits comfortably on one node, and sharding rewrites the application\'s data access model. Earn complexity — this problem is read volume, not data size.',
      },
      {
        option: 'read-replication',
        verdict: 'chosen',
        implementedWith: ['postgresql'],
        reason:
          'Replicas serve the entire residual read surface — misses, search, history — while writes stay on the primary. Order reads route to the primary for 5 s after the customer\'s own write, preserving read-your-writes where it matters.',
      },
    ],
    tradeoffs: ['replication-lag on the read path', 'read/write routing complexity', 'three database nodes to operate'],
    newProblems: [],
    newFailureModes: ['replication-lag'],
  },
  {
    id: 'd-06-work-queue',
    title: 'Move side effects off the request path with a work queue',
    fromState: 's5',
    toState: 's6',
    trigger: [
      'Checkout p95 is dominated by email, invoice and notification work the user never sees',
      'Checkout availability is coupled to the mail provider — an outage there fails orders',
    ],
    problem: ['synchronous-side-effects'],
    bindingConstraints: ['latency.p95_ms', 'availability.target'],
    options: [
      {
        option: 'optimize-synchronous',
        label: 'Keep synchronous, just make side effects faster',
        verdict: 'rejected',
        reason: 'Even fast side effects keep checkout coupled to third-party availability. The coupling, not the speed, is the problem.',
      },
      {
        option: 'event-streaming',
        label: 'Kafka event streaming',
        verdict: 'deferred',
        reason:
          'The system needs reliable background task delivery. It does not yet require event replay, multiple independent consumers, or durable event-stream semantics. Kafka earns its place when those requirements arrive (Part 2).',
      },
      {
        option: 'work-queue',
        verdict: 'chosen',
        implementedWith: ['rabbitmq'],
        reason:
          'Side effects are deferrable — the user needs "order confirmed", not "email sent". Publishing a job takes milliseconds; workers absorb the slow, flaky work off the critical path.',
      },
    ],
    tradeoffs: ['side effects become eventual', 'a broker to operate', 'ordering guarantees weaken'],
    newProblems: ['duplicate-processing'],
    newFailureModes: ['consumer-failure'],
  },
];
