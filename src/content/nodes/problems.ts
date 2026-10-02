import type { KnowledgeNode } from '../types';

export const problems: KnowledgeNode[] = [
  {
    id: 'resource-contention',
    kind: 'problem',
    title: 'Resource Contention on a Single Machine',
    status: 'reviewed',
    summary:
      'The application and the database compete for the same CPU, memory, disk and network. Under load, each workload degrades the other, and neither can be scaled or tuned independently.',
    problem:
      'On one server, a traffic spike in the web tier starves the database of memory and disk I/O; a heavy query does the same to request handling. The blast radius of any workload is the entire system.',
    intuition:
      'Two tenants sharing one small apartment: fine at low occupancy, miserable once both have guests.',
    symptoms: [
      'CPU and disk wait spike together during traffic peaks',
      'Slow requests correlate with heavy query load',
      'Adding capacity means upgrading the whole machine',
    ],
    detectionSignals: [
      'sustained CPU > 80% with mixed workload profile',
      'disk I/O wait rising during request peaks',
      'memory pressure from both app heap and DB buffers',
    ],
    improves: [],
    costs: [],
    edges: [
      {
        to: 'app-tier-capacity',
        type: 'INTRODUCES',
        note: 'Contention masks and accelerates capacity exhaustion.',
      },
    ],
    sources: [
      {
        title: 'PostgreSQL Docs — Server Configuration (Resource Consumption)',
        url: 'https://www.postgresql.org/docs/current/runtime-config-resource.html',
        type: 'primary',
      },
    ],
  },
  {
    id: 'app-tier-capacity',
    kind: 'problem',
    title: 'Application Tier Capacity Exhaustion',
    status: 'reviewed',
    summary:
      'A single application server runs out of CPU, connections or memory as request volume grows — and because it is the only instance, it is also a single point of failure.',
    problem:
      'Requests per second grow past what one process/host can serve. Even before hard limits, queuing delays inflate tail latency. And if the one server dies, the store is down.',
    intuition:
      'One cashier at a growing market: the queue lengthens long before the cashier physically cannot work.',
    symptoms: [
      'p95/p99 latency rising with RPS while DB is healthy',
      'connection accept queues growing',
      'deploys or crashes cause full outages',
    ],
    detectionSignals: [
      'app CPU saturation with idle database',
      'request queueing metrics',
      'zero redundancy: one host in the request path',
    ],
    edges: [
      {
        to: 'single-point-of-failure',
        type: 'INTRODUCES',
        note: 'One instance = one failure away from downtime.',
      },
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
    id: 'slow-queries',
    kind: 'problem',
    title: 'Slow Database Operations',
    status: 'reviewed',
    summary:
      'Individual database operations become the latency floor of the whole system: missing indexes, unbounded scans, and lock contention make each request expensive regardless of how much app capacity you add.',
    problem:
      'After the app tier scales out, the same queries now arrive N times more often. Sequential scans and per-request connection setup turn the database into the bottleneck.',
    intuition:
      'Hiring more waiters does not help if the kitchen takes 20 minutes per dish.',
    symptoms: [
      'query latency dominates request latency',
      'EXPLAIN shows sequential scans on hot tables',
      'time spent in "connection acquisition" grows',
    ],
    detectionSignals: [
      'pg_stat_statements top entries by total time',
      'high connection churn (connects/sec ≈ requests/sec)',
      'buffer hit ratio dropping',
    ],
    edges: [
      {
        to: 'db-read-bottleneck',
        type: 'INTRODUCES',
        conditions: ['read-heavy workload', 'queries already reasonably tuned'],
        note: 'Once queries are optimized, the *volume* of reads becomes the problem.',
      },
    ],
    sources: [
      {
        title: 'PostgreSQL Docs — Using EXPLAIN',
        url: 'https://www.postgresql.org/docs/current/using-explain.html',
        type: 'primary',
      },
      {
        title: 'Use The Index, Luke',
        url: 'https://use-the-index-luke.com/',
        type: 'secondary',
      },
    ],
  },
  {
    id: 'db-read-bottleneck',
    kind: 'problem',
    title: 'Database Read Bottleneck',
    status: 'reviewed',
    summary:
      'The database spends most of its capacity serving the same reads repeatedly. Latency targets are missed not because queries are slow, but because the same expensive work is done thousands of times.',
    problem:
      'Product pages are read orders of magnitude more often than they change. Every read hits the primary, so read volume — not query cost — saturates the database.',
    intuition:
      'The librarian re-fetches the same popular book from the basement archive for every visitor.',
    symptoms: [
      'read QPS ≫ write QPS, reads dominated by repeated hot keys',
      'p95 read latency exceeds target under peak traffic',
      'CPU spent on identical query shapes',
    ],
    detectionSignals: [
      'top-N queries are repeated point lookups',
      'cache-hit ratio of DB buffers plateaus',
      'read latency scales linearly with traffic',
    ],
    edges: [],
    sources: [
      {
        title: 'AWS — Caching Overview (database read patterns)',
        url: 'https://aws.amazon.com/caching/',
        type: 'secondary',
      },
    ],
  },
  {
    id: 'db-primary-overload',
    kind: 'problem',
    title: 'Primary Database Overload',
    status: 'reviewed',
    summary:
      'Even with a cache, cache misses and non-cacheable reads (filtered search, order history, aggregates) still hammer the single primary alongside all writes.',
    problem:
      'Caching absorbs repetitive hot reads, but the long tail of misses and inherently dynamic queries keeps growing with traffic. One node serves every write plus every uncached read.',
    intuition:
      'The archive is quieter now, but every unusual request and every new arrival still goes to the same single desk.',
    symptoms: [
      'primary CPU/IO high while cache hit ratio is already good',
      'write latency degrading under read load',
      'miss traffic scales with total traffic',
    ],
    detectionSignals: [
      'read share on primary stays high after caching',
      'replication slots absent — no read offload exists',
      'connection count on primary near pool limits',
    ],
    edges: [],
    sources: [
      {
        title: 'PostgreSQL Docs — Hot Standby / Read Replicas',
        url: 'https://www.postgresql.org/docs/current/hot-standby.html',
        type: 'primary',
      },
    ],
  },
  {
    id: 'synchronous-side-effects',
    kind: 'problem',
    title: 'Synchronous Side Effects Inflate Request Latency',
    status: 'reviewed',
    summary:
      'Checkout does more than write an order: it sends email, generates an invoice, notifies analytics. Doing all of this inside the request makes checkout slow and couples user-facing availability to non-critical systems.',
    problem:
      'The user only needs "order confirmed". Everything else — email, invoice PDF, warehouse notification — is slow, failure-prone, and irrelevant to the immediate response, yet it runs on the critical path.',
    intuition:
      'The cashier refuses to hand you the receipt until the thank-you letter is written, stamped and mailed.',
    symptoms: [
      'checkout p95 dominated by email/invoice time',
      'checkout fails when the mail provider is down',
      'latency variance unrelated to database load',
    ],
    detectionSignals: [
      'trace spans show non-DB work inside the request',
      'external service timeouts appear in checkout errors',
    ],
    edges: [],
    sources: [
      {
        title: 'RabbitMQ Tutorials — Work Queues',
        url: 'https://www.rabbitmq.com/tutorials/tutorial-two-python.html',
        type: 'primary',
      },
    ],
  },
  {
    id: 'stale-data',
    kind: 'problem',
    title: 'Stale Data',
    status: 'reviewed',
    summary:
      'A cached or replicated copy no longer matches the source of truth. Users see outdated prices, stock or orders until the copy is refreshed or invalidated.',
    problem:
      'Every copy of data — cache entries, replicas — introduces a window where reads disagree with writes. The question is not "how do we avoid staleness" but "how much staleness can each domain tolerate".',
    intuition:
      'A printed menu: cheap to hand out, wrong the moment the kitchen changes a price.',
    symptoms: [
      'user updates a value but still sees the old one',
      'different users see different values for the same entity',
    ],
    detectionSignals: [
      'complaints clustering around recently-modified entities',
      'cache TTLs longer than acceptable freshness windows',
    ],
    edges: [
      {
        to: 'consistency-models',
        type: 'PART_OF',
        note: 'Staleness is a consistency question; the answer is domain-specific.',
      },
    ],
    sources: [
      {
        title: 'AWS Prescriptive Guidance — Caching patterns and challenges',
        url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/caching-database-performance/welcome.html',
        type: 'secondary',
      },
    ],
  },
  {
    id: 'single-point-of-failure',
    kind: 'problem',
    title: 'Single Point of Failure',
    status: 'reviewed',
    summary:
      'One component whose failure takes down the whole system. At S0–S1 almost everything is a SPOF; the journey progressively removes them — and occasionally adds new ones (the load balancer, the broker).',
    problem:
      'Any single host crash is a full outage; deploys cause downtime. Whether a SPOF is acceptable depends on the availability target — S0 has none, S2 introduces one.',
    symptoms: ['any single host crash = full outage', 'deploys cause downtime'],
    detectionSignals: ['architecture diagram: any node with no redundant peer in the request path'],
    edges: [
      { to: 'availability', type: 'PART_OF' },
      { to: 'database-primary-failure', type: 'INTRODUCES', note: 'A lone primary is the SPOF that survives longest in this journey.' },
    ],
  },
  {
    id: 'duplicate-processing',
    kind: 'problem',
    title: 'Duplicate Processing',
    status: 'reviewed',
    summary:
      'At-least-once delivery means a message can be delivered twice: a worker crashes after sending the email but before acknowledging, so the email is sent again. Without idempotency, duplicates become double charges, double emails, double orders.',
    problem:
      'The queue guarantees delivery, not exactly-once processing. Any failure between "do the work" and "acknowledge the message" causes redelivery.',
    intuition:
      'A courier who must get a signature: if the signature is lost, the parcel is delivered again.',
    symptoms: [
      'customers receive the same email twice',
      'duplicate side effects after worker restarts',
    ],
    detectionSignals: [
      'redelivery counts > 0',
      'duplicate rows/effects correlating with consumer restarts or timeouts',
    ],
    edges: [
      {
        to: 'at-least-once-delivery',
        type: 'PART_OF',
        note: 'Duplicates are the price of not losing messages.',
      },
    ],
    sources: [
      {
        title: 'RabbitMQ Docs — Consumer Acknowledgements',
        url: 'https://www.rabbitmq.com/docs/confirms',
        type: 'primary',
      },
    ],
  },
];
