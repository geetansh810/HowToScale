import type { KnowledgeNode } from '../types';

export const failures: KnowledgeNode[] = [
  {
    id: 'cache-unavailable',
    kind: 'failure',
    title: 'Cache Unavailable',
    status: 'reviewed',
    summary:
      'Redis is down or unreachable. Every request that expected a cache hit now goes to the database — the cache was silently carrying most of the read load, so the DB sees a sudden traffic cliff.',
    intuition:
      'The cart by the door disappears; every visitor walks to the archive at once.',
    symptoms: ['DB read QPS jumps to pre-cache levels within seconds', 'p95 latency climbs', 'connection pool exhaustion risk'],
    detectionSignals: ['cache connection errors', 'hit ratio → 0', 'DB QPS step change'],
    improves: [],
    costs: [],
    howItWorks:
      'Mitigations shape behavior, not magic: fail-open with a per-request DB budget, short DB timeouts, circuit breaker on the cache client, and capacity headroom sized for cache-down load. Each mitigation adds its own trade-off (e.g. fail-open risks DB overload).',
    edges: [
      { to: 'db-read-bottleneck', type: 'INTRODUCES', note: 'Cache-down instantly resurrects the original problem.' },
      { to: 'cache-stampede', type: 'ALTERNATIVE_TO', note: 'Related but distinct: unavailability is the cache gone; stampede is the cache present but misses correlated.' },
    ],
    sources: [{ title: 'Redis Docs — High Availability', url: 'https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/', type: 'primary' }],
  },
  {
    id: 'cache-stampede',
    kind: 'failure',
    title: 'Cache Stampede (Thundering Herd)',
    status: 'reviewed',
    summary:
      'A hot key expires and hundreds of concurrent requests miss simultaneously — all of them hit the database to regenerate the same value at the same time.',
    intuition:
      'The most popular book\'s cart copy vanishes; fifty visitors sprint to the archive in the same second.',
    symptoms: ['periodic DB load spikes aligned with TTL expiry', 'spike after deploy/restart (cold cache)'],
    detectionSignals: ['miss bursts on a small key set', 'regeneration queries duplicated in pg_stat_statements'],
    howItWorks:
      'Mitigations: request coalescing (only one request regenerates; others wait or serve stale), jittered TTLs (spread expiry), stale-while-revalidate. Each trades freshness or complexity.',
    edges: [
      { to: 'db-read-bottleneck', type: 'INTRODUCES' },
      { to: 'hot-key', type: 'PART_OF', note: 'Stampedes usually happen on hot keys.' },
    ],
    sources: [{ title: 'Wikipedia — Cache stampede', url: 'https://en.wikipedia.org/wiki/Cache_stampede', type: 'secondary' }],
  },
  {
    id: 'hot-key',
    kind: 'failure',
    title: 'Hot Key',
    status: 'reviewed',
    summary:
      'One cache key (a viral product, a celebrity profile) receives so much traffic that the single node owning it saturates — while the rest of the fleet idles.',
    intuition:
      'One book so popular the door-cart itself becomes the bottleneck.',
    symptoms: ['one cache node at 100% CPU, others idle', 'latency degradation on a tiny key subset'],
    detectionSignals: ['per-node QPS skew', 'top-key analytics'],
    howItWorks:
      'Mitigations: replicate hot reads into in-process caches, key splitting (item:123 → item:123:0..N), or serve truly hot data from a separate path. Each adds invalidation complexity.',
    edges: [{ to: 'cache-stampede', type: 'INTRODUCES', note: 'When the hot key expires, its concentrated traffic stampedes.' }],
  },
  {
    id: 'replication-lag',
    kind: 'failure',
    title: 'Replication Lag',
    status: 'reviewed',
    summary:
      'Replicas fall behind the primary. Reads routed to replicas return data that does not yet include recent writes — a customer places an order, opens "My Orders", and the order is missing.',
    intuition:
      'The branch reading room has yesterday\'s ledger while head office already recorded today\'s sale.',
    symptoms: ['read-your-writes violations after checkout', 'stale reads clustered after write bursts'],
    detectionSignals: ['replay lag metrics (pg_stat_replication)', 'user reports of "disappearing" fresh data'],
    howItWorks:
      'Lag grows under write bursts, long transactions, or replica overload. Mitigations: route your-own-writes to primary for a window, read from primary for lag-sensitive queries, synchronous replication for critical data (at write-latency cost).',
    edges: [
      { to: 'stale-data', type: 'INTRODUCES' },
      { to: 'consistency-models', type: 'MITIGATED_BY', note: 'Read-your-writes routing is the classic mitigation.' },
    ],
    sources: [
      { title: 'PostgreSQL Docs — Streaming Replication monitoring', url: 'https://www.postgresql.org/docs/current/monitoring-stats.html', type: 'primary' },
      { title: 'Designing Data-Intensive Applications, Ch. 5 (Problems with Replication Lag)', type: 'secondary' },
    ],
  },
  {
    id: 'consumer-failure',
    kind: 'failure',
    title: 'Consumer Failure',
    status: 'reviewed',
    summary:
      'A worker crashes mid-processing or gets stuck on a poison message. Unacknowledged messages pile up; redelivery of half-done work creates duplicates; a single bad message can kill every worker that touches it.',
    symptoms: ['queue depth growing', 'emails/invoices delayed or duplicated', 'worker crash loops'],
    detectionSignals: ['unacked message count rising', 'consumer restart rate', 'redelivery counters'],
    howItWorks:
      'The broker\'s redelivery protects against lost work but amplifies poison messages. Mitigations: idempotent consumers, bounded retries, dead-letter queues for messages that keep failing, alerts on backlog age.',
    edges: [
      { to: 'duplicate-processing', type: 'INTRODUCES' },
      { to: 'idempotency-key', type: 'MITIGATED_BY' },
    ],
    sources: [{ title: 'RabbitMQ Docs — Consumer Acknowledgements and Poison Messages', url: 'https://www.rabbitmq.com/docs/confirms', type: 'primary' }],
  },
  {
    id: 'database-primary-failure',
    kind: 'failure',
    title: 'Database Primary Failure',
    status: 'draft',
    summary:
      'The single writer dies. Replicas can still serve reads, but no order can be placed until a replica is promoted — and promotion risks losing recently-written data that had not yet replicated.',
    intuition:
      'Head office burns down; branches have copies, but yesterday\'s last entries existed only at head office.',
    symptoms: ['writes fail entirely', 'reads continue but go stale', 'checkout down, catalog up'],
    detectionSignals: ['write error rate 100%', 'primary unreachable', 'replication stopped'],
    howItWorks:
      'Mitigations: standby promotion (manual or automated), synchronous replication for zero-loss failover, runbooks. Promotion is a data-loss vs downtime trade-off, not a free fix.',
    edges: [
      { to: 'replication', type: 'MITIGATED_BY', note: 'A replica is the raw material of recovery — but async replication may lag at the moment of failure.' },
    ],
    sources: [{ title: 'PostgreSQL Docs — High Availability and Failover', url: 'https://www.postgresql.org/docs/current/high-availability.html', type: 'primary' }],
  },
];
