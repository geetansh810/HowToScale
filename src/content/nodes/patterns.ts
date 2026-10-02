import type { KnowledgeNode } from '../types';

export const patterns: KnowledgeNode[] = [
  {
    id: 'database-indexing',
    kind: 'pattern',
    title: 'Database Indexing',
    status: 'reviewed',
    summary:
      'Auxiliary data structures (usually B-trees) that let the database find rows without scanning the whole table. The first thing to reach for when reads are slow — before any new infrastructure.',
    problem: 'Slow-queries: sequential scans on hot tables make every request pay for the database\'s full size.',
    intuition:
      'A book index: look up "Redis" in two page-flips instead of reading the entire book.',
    howItWorks:
      'An index stores sorted key → row-location mappings. Lookups drop from O(n) scans to O(log n) seeks. Writes pay for maintaining every index, and the planner only uses indexes whose selectivity justifies it.',
    fitsWhere: 'S3 — the state where the topology does not change at all, but the system gets faster.',
    improves: ['point-lookup and range-query latency', 'database CPU per request'],
    costs: ['slower writes (each index must be maintained)', 'storage overhead', 'wrong indexes mislead the planner'],
    edges: [
      {
        to: 'slow-queries',
        type: 'SOLVES',
        conditions: ['queries filter/sort on indexable columns', 'working set fits memory reasonably'],
        tradeoffs: ['write amplification', 'index maintenance'],
      },
      { to: 'cache-aside', type: 'ALTERNATIVE_TO', note: 'Index first; cache when even indexed reads are too expensive or too frequent.' },
      { to: 'database', type: 'USES' },
    ],
    sources: [
      { title: 'Use The Index, Luke', url: 'https://use-the-index-luke.com/', type: 'secondary' },
      { title: 'PostgreSQL Docs — Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html', type: 'primary' },
    ],
  },
  {
    id: 'connection-pooling',
    kind: 'pattern',
    title: 'Connection Pooling',
    status: 'reviewed',
    summary:
      'Reuse a bounded set of database connections instead of opening one per request. Kills connection-setup latency and protects the database from connection storms.',
    problem: 'Slow-queries: per-request connect/teardown adds milliseconds and, under load, thousands of concurrent connections exhaust database memory.',
    intuition:
      'A taxi rank: riders do not buy a car per trip; a fixed fleet cycles continuously.',
    howItWorks:
      'A pooler (in-app or external like PgBouncer) keeps N warm connections and hands them out per query/transaction. Excess demand queues instead of overwhelming the database — a first taste of backpressure.',
    fitsWhere: 'S3, alongside indexing — another "no new boxes" optimization.',
    improves: ['request latency (no handshake per query)', 'database memory stability'],
    costs: ['queued requests wait when the pool is exhausted', 'transaction-scoped pooling breaks session features'],
    edges: [
      {
        to: 'slow-queries',
        type: 'SOLVES',
        conditions: ['connection churn is a meaningful share of latency', 'connection count threatens database memory'],
      },
      { to: 'database', type: 'USES' },
    ],
    sources: [
      { title: 'PgBouncer — lightweight connection pooler', url: 'https://www.pgbouncer.org/', type: 'primary' },
    ],
  },
  {
    id: 'cache-aside',
    kind: 'pattern',
    title: 'Cache-Aside',
    status: 'verified',
    lastVerified: '2026-09-20',
    summary:
      'Read path: check the cache; on a miss, read the database and write the result into the cache. Write path: update the database, then invalidate the cache entry. The most common application-level caching pattern.',
    problem:
      'Db-read-bottleneck: reads remain too expensive for the latency target because the same hot data is fetched from the database over and over.',
    intuition:
      'Keep the popular books on a cart by the door. If the book is not on the cart, fetch it from the archive — and put a copy on the cart for the next visitor.',
    howItWorks:
      'On read: GET key → hit? return. miss? query DB → SET key with TTL → return. On write: update DB, then DEL the key so the next read repopulates. The database stays the source of truth; the cache is a disposable accelerator.',
    fitsWhere: 'S4 — added for the product catalog, whose data tolerates seconds of staleness.',
    improves: ['read latency for hot keys (memory vs disk)', 'database read QPS'],
    costs: ['stale data window between write and invalidation', 'invalidation logic in the application', 'new infrastructure to run'],
    atScale:
      'Hot keys concentrate load on single cache nodes; stampedes after expiry need request coalescing or jittered TTLs; very hot data may need local in-process caches in front of Redis.',
    edges: [
      {
        to: 'db-read-bottleneck',
        type: 'SOLVES',
        conditions: ['read-heavy workload', 'repeated access to the same keys', 'freshness requirements can be relaxed'],
        tradeoffs: ['stale-data', 'invalidation-complexity'],
      },
      { to: 'read-replication', type: 'ALTERNATIVE_TO', note: 'Replicas spread *all* reads but keep DB-latency; cache serves hot keys from memory but only helps repeated reads.' },
      { to: 'cache', type: 'USES' },
      { to: 'stale-data', type: 'INTRODUCES' },
      { to: 'cache-stampede', type: 'HAS_FAILURE_MODE' },
      { to: 'cache-unavailable', type: 'HAS_FAILURE_MODE' },
      { to: 'hot-key', type: 'HAS_FAILURE_MODE' },
    ],
    sources: [
      { title: 'AWS Prescriptive Guidance — Caching patterns (cache-aside / lazy loading)', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/caching-database-performance/welcome.html', type: 'secondary' },
      { title: 'Redis Docs — Client-side caching & common patterns', url: 'https://redis.io/docs/latest/develop/reference/patterns/', type: 'primary' },
    ],
  },
  {
    id: 'read-replication',
    kind: 'pattern',
    title: 'Read Replicas',
    status: 'reviewed',
    summary:
      'Route reads to replica databases and keep writes on the primary. Scales read capacity for the *entire* query surface — including the cache misses and dynamic queries a cache cannot help.',
    problem: 'Db-primary-overload: cache misses and non-cacheable reads (search, order history, aggregates) still saturate the single primary alongside all writes.',
    intuition:
      'Open reading rooms in every branch: copies of the archive serve readers, while all corrections still go to the head office.',
    howItWorks:
      'The primary streams its write-ahead log to replicas; the application (or a proxy) routes SELECTs to replicas and writes to the primary. Replication is asynchronous, so replicas lag behind by milliseconds to seconds.',
    fitsWhere: 'S5 — after caching, when the residual read load is too diverse for a cache.',
    improves: ['read throughput across the whole query surface', 'primary headroom for writes'],
    costs: ['replication lag → stale reads on the read path', 'read/write routing complexity', 'more nodes to operate and fail over'],
    atScale:
      'Lag spikes under write bursts; read-your-writes routing (primary for your own recent writes) becomes necessary; replicas double as failover candidates.',
    edges: [
      {
        to: 'db-primary-overload',
        type: 'SOLVES',
        conditions: ['reads can be routed separately from writes', 'most read domains tolerate lag'],
        tradeoffs: ['replication-lag', 'routing-complexity'],
      },
      { to: 'cache-aside', type: 'ALTERNATIVE_TO' },
      { to: 'database', type: 'USES' },
      { to: 'replication', type: 'USES' },
      { to: 'replication-lag', type: 'HAS_FAILURE_MODE' },
      { to: 'stale-data', type: 'INTRODUCES', note: 'Replica lag is a new staleness source — and a stale replica can poison the cache.' },
    ],
    sources: [
      { title: 'PostgreSQL Docs — Hot Standby', url: 'https://www.postgresql.org/docs/current/hot-standby.html', type: 'primary' },
      { title: 'Designing Data-Intensive Applications, Ch. 5', type: 'secondary' },
    ],
  },
  {
    id: 'work-queue',
    kind: 'pattern',
    title: 'Work Queue',
    status: 'reviewed',
    summary:
      'Push slow, deferrable side effects onto a queue; workers process them asynchronously. The user-facing request returns as soon as the essential work is done.',
    problem:
      'Synchronous-side-effects: checkout latency is dominated by email/invoice generation, and checkout availability is coupled to systems the user does not care about.',
    intuition:
      'The cashier hands you the receipt immediately and drops the thank-you letter into the outbox for the back office.',
    howItWorks:
      'The app publishes a job (order-confirmation-email) and returns. Workers pull jobs, execute, and acknowledge. The broker redelivers unacknowledged jobs — at-least-once delivery — so consumers must be idempotent.',
    fitsWhere: 'S6 — the store\'s first asynchronous boundary.',
    improves: ['user-facing latency (side effects off the critical path)', 'resilience (worker crashes do not fail checkout)', 'natural load leveling under spikes'],
    costs: ['eventual side effects (email arrives seconds later)', 'duplicate-processing from at-least-once delivery', 'a broker to operate', 'ordering guarantees weaken'],
    atScale:
      'Multiple queues by priority; dead-letter queues for poison messages; when events need replay or many independent consumers, the work queue evolves toward event streaming (Kafka territory).',
    edges: [
      {
        to: 'synchronous-side-effects',
        type: 'SOLVES',
        conditions: ['side effects are deferrable', 'user does not need the side effect in the response'],
        tradeoffs: ['duplicate-processing', 'operational complexity'],
      },
      { to: 'cache-aside', type: 'ALTERNATIVE_TO', note: 'Not true alternatives — different problems. Listed so learners compare "speed up work" vs "defer work".' },
      { to: 'message-broker', type: 'USES' },
      { to: 'worker', type: 'USES' },
      { to: 'duplicate-processing', type: 'INTRODUCES' },
      { to: 'consumer-failure', type: 'HAS_FAILURE_MODE' },
    ],
    sources: [
      { title: 'RabbitMQ Tutorials — Work Queues', url: 'https://www.rabbitmq.com/tutorials/tutorial-two-python.html', type: 'primary' },
      { title: 'AWS — SQS visibility timeout & standard queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html', type: 'primary' },
    ],
  },
  {
    id: 'idempotency-key',
    kind: 'pattern',
    title: 'Idempotency Key',
    status: 'reviewed',
    summary:
      'The producer attaches a unique key to each logical operation; the consumer records processed keys and treats re-deliveries as no-ops. Turns at-least-once delivery into effectively-once *effects*.',
    problem: 'Duplicate-processing: redelivered messages cause double emails, double invoices, double charges.',
    intuition:
      'Every parcel gets a tracking number; the recipient checks "have I already signed for this one?" before accepting.',
    howItWorks:
      'Store (key → result) durably — a DB unique constraint is the classic mechanism. On receipt: try to insert the key; if it exists, skip the work and acknowledge. Payment APIs (Stripe) use the same idea at the HTTP boundary.',
    fitsWhere: 'Reliability segment — applied to checkout and to every queue consumer.',
    improves: ['safe retries everywhere', 'duplicate side effects eliminated'],
    costs: ['a durable dedup store', 'key lifecycle/TTL decisions', 'must design what "same operation" means'],
    edges: [
      { to: 'duplicate-processing', type: 'SOLVES', conditions: ['the operation can be given a stable identity', 'a durable dedup store exists'], tradeoffs: ['dedup storage', 'key design complexity'] },
      { to: 'at-least-once-delivery', type: 'USES', note: 'Only needed *because* delivery is at-least-once.' },
    ],
    sources: [
      { title: 'Stripe Docs — Idempotent Requests', url: 'https://docs.stripe.com/api/idempotent_requests', type: 'primary' },
    ],
  },
];
