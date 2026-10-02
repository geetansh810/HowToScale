import type { ArchitectureState } from './types';

/**
 * ArchitectureState = Architecture + operating conditions.
 * Coordinates are in a 0–100 layout space for the diagram renderer.
 * "Client" is drawn automatically by the renderer; do not add it here.
 */
export const states: ArchitectureState[] = [
  {
    id: 's0',
    era: 'one-machine',
    title: 'One Server',
    headline: 'Everything lives on one machine — and that is fine, for now.',
    conditions: {
      traffic: { rps: 50 },
      latency: { p95_ms: 500 },
      availability: { target: null },
      workload: { read_write_ratio: '80/20' },
      data: { size_gb: 5 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', host: 'server-1', x: 50, y: 38 },
      { id: 'db-1', role: 'database', technology: 'postgresql', host: 'server-1', x: 50, y: 70 },
    ],
    connections: [{ from: 'app-1', to: 'db-1' }],
    patterns: [],
    configuration: [],
    narrative:
      'A weekend project turned real store. One machine runs the Spring Boot application and PostgreSQL side by side. At 50 RPS with a 5 GB catalog this is entirely reasonable — the simplest architecture that could possibly work. There is no availability target because nobody has promised one yet.',
    teachingNotes: [
      'Every state is a genuine architecture, not a toy. S0 is the correct answer to S0\'s conditions.',
      'Notice what is absent: no availability target. The moment downtime has a business cost, this state becomes indefensible.',
    ],
    failureScenarios: [
      {
        title: 'The machine dies',
        failureMode: 'single-point-of-failure',
        narrative: 'server-1 reboots for a kernel panic. The entire store — catalog, checkout, everything — is down for four minutes. Nobody notices at 3 AM. Someone will, eventually.',
      },
    ],
  },
  {
    id: 's1',
    era: 'one-machine',
    title: 'Separate Database',
    headline: 'The first split: data gets its own machine.',
    conditions: {
      traffic: { rps: 150 },
      latency: { p95_ms: 500 },
      availability: { target: null },
      workload: { read_write_ratio: '80/20' },
      data: { size_gb: 12 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', host: 'app-server-1', x: 50, y: 36 },
      { id: 'db-1', role: 'database', technology: 'postgresql', host: 'db-server-1', x: 50, y: 72 },
    ],
    connections: [{ from: 'app-1', to: 'db-1', label: 'TCP :5432' }],
    patterns: [],
    configuration: [{ key: 'db.max_connections', value: '100' }],
    narrative:
      'Traffic tripled after launch, and the application and database started competing for the same CPU, memory and disk I/O. The database moved to its own machine — same topology, but each workload can now be tuned and scaled independently. The app talks to PostgreSQL over the network instead of a local socket.',
    teachingNotes: [
      'Separate responsibilities that need to scale independently. This is the first architectural decision driven by *measured contention*, not by fashion.',
      'Note the new dependency: a network now sits between app and data. Latency per query just gained a floor.',
    ],
  },
  {
    id: 's2',
    era: 'scale-compute',
    title: 'Horizontal Application Scaling',
    headline: 'One app server is no longer enough — and one of anything is fragile.',
    conditions: {
      traffic: { rps: 800 },
      latency: { p95_ms: 500 },
      availability: { target: '99.9%' },
      workload: { read_write_ratio: '80/20' },
      data: { size_gb: 25 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'lb-1', role: 'load-balancer', technology: 'nginx', x: 50, y: 24 },
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', x: 28, y: 52 },
      { id: 'app-2', role: 'application-server', technology: 'spring-boot', x: 72, y: 52 },
      { id: 'db-1', role: 'database', technology: 'postgresql', host: 'db-server-1', x: 50, y: 82 },
    ],
    connections: [
      { from: 'lb-1', to: 'app-1' },
      { from: 'lb-1', to: 'app-2' },
      { from: 'app-1', to: 'db-1' },
      { from: 'app-2', to: 'db-1' },
    ],
    patterns: [],
    configuration: [{ key: 'session.model', value: 'stateless JWT — no server-side session state' }],
    narrative:
      'At 800 RPS a single application server queues requests and inflates tail latency — and the store now promises 99.9% availability, which one instance can never deliver. Two identical app servers sit behind an NGINX load balancer. Crucially, the tier stays stateless: authentication uses signed tokens, so any instance can serve any request. No Redis was required to go horizontal — do not let anyone tell you otherwise.',
    teachingNotes: [
      'Horizontal scaling is a statement about *state*, not about servers. The work was making the app stateless; adding the second box was the easy part.',
      'The load balancer is itself a single point of failure. At this scale a managed/HA LB pair answers that; the journey accepts the risk consciously.',
      'All reads and writes still hit one database. Watch what breaks next.',
    ],
    failureScenarios: [
      {
        title: 'An app server dies mid-sale',
        failureMode: 'single-point-of-failure',
        narrative: 'app-2 OOMs during a flash sale. NGINX health checks eject it in seconds; all traffic flows through app-1 at higher latency. The store degrades instead of dying — the first time failure became survivable.',
      },
    ],
  },
  {
    id: 's3',
    era: 'scale-compute',
    title: 'Database Optimization',
    headline: 'The topology does not change. The system gets faster anyway.',
    conditions: {
      traffic: { rps: 1500 },
      latency: { p95_ms: 400 },
      availability: { target: '99.9%' },
      workload: { read_write_ratio: '80/20' },
      data: { size_gb: 40 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'lb-1', role: 'load-balancer', technology: 'nginx', x: 50, y: 24 },
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', x: 28, y: 52 },
      { id: 'app-2', role: 'application-server', technology: 'spring-boot', x: 72, y: 52 },
      { id: 'db-1', role: 'database', technology: 'postgresql', host: 'db-server-1', x: 50, y: 82 },
    ],
    connections: [
      { from: 'lb-1', to: 'app-1' },
      { from: 'lb-1', to: 'app-2' },
      { from: 'app-1', to: 'db-1' },
      { from: 'app-2', to: 'db-1' },
    ],
    patterns: ['database-indexing', 'connection-pooling'],
    configuration: [
      { key: 'db.indexes', value: 'products(category, price), orders(customer_id, created_at)' },
      { key: 'db.connection_pool', value: '20 per app instance (PgBouncer transaction pooling)' },
      { key: 'http.timeout_ms', value: '200' },
    ],
    narrative:
      'With the app tier scaled, the database became the visible bottleneck — but the answer was not new infrastructure. EXPLAIN showed sequential scans on the hot product and order queries; indexes fixed those. Per-request connection setup was costing milliseconds and memory; PgBouncer pooling fixed that. Same boxes, much faster system.',
    teachingNotes: [
      'Not every scaling problem requires additional infrastructure. Optimization is a decision with options, trade-offs and failure modes — treat it with the same rigor as adding a component.',
      'Indexes tax every write. The 80/20 read/write ratio is what makes that trade obviously right *here*.',
    ],
  },
  {
    id: 's4',
    era: 'scale-reads',
    title: 'Cache-Aside',
    headline: 'The database is optimized — and still too slow for hot reads.',
    conditions: {
      traffic: { rps: 3000 },
      latency: { p95_ms: 300 },
      availability: { target: '99.9%' },
      workload: { read_write_ratio: '85/15' },
      data: { size_gb: 60 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'lb-1', role: 'load-balancer', technology: 'nginx', x: 50, y: 18 },
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', x: 26, y: 45 },
      { id: 'app-2', role: 'application-server', technology: 'spring-boot', x: 60, y: 45 },
      { id: 'cache-1', role: 'cache', technology: 'redis', x: 86, y: 32 },
      { id: 'db-1', role: 'database', technology: 'postgresql', host: 'db-server-1', x: 50, y: 78 },
    ],
    connections: [
      { from: 'lb-1', to: 'app-1' },
      { from: 'lb-1', to: 'app-2' },
      { from: 'app-1', to: 'cache-1', label: 'GET/SET' },
      { from: 'app-2', to: 'cache-1', label: 'GET/SET' },
      { from: 'app-1', to: 'db-1', label: 'miss' },
      { from: 'app-2', to: 'db-1', label: 'miss' },
    ],
    patterns: ['database-indexing', 'connection-pooling', 'cache-aside'],
    configuration: [
      { key: 'db.indexes', value: 'products(category, price), orders(customer_id, created_at)' },
      { key: 'db.connection_pool', value: '20 per app instance (PgBouncer transaction pooling)' },
      { key: 'http.timeout_ms', value: '200' },
      { key: 'cache.ttl.product', value: '60s + jitter' },
      { key: 'cache.invalidate_on_write', value: 'true' },
    ],
    narrative:
      'Reads remain too expensive for the 300 ms target — the same product pages are fetched from PostgreSQL thousands of times per minute. Cache-aside with Redis serves hot catalog reads from memory: hit → sub-millisecond response; miss → read PostgreSQL, populate the cache, respond. Writes update the database and invalidate the key. The catalog tolerates a minute of staleness; orders and inventory never touch the cache.',
    teachingNotes: [
      'The cache exists because of *conditions*: repetitive access, expensive reads, relaxed freshness. Change any one and the decision collapses.',
      'This decision bought speed and imported three failure modes: stampede, unavailability, hot keys. They are now your problem.',
      'stale-data is a new *problem* introduced by this state — distinct from the failure modes.',
    ],
    failureScenarios: [
      {
        title: 'Kill Redis',
        failureMode: 'cache-unavailable',
        narrative: 'Redis becomes unreachable at peak. Every product read falls through to PostgreSQL; DB QPS jumps 6× in seconds. The connection pool saturates, latency blows past target, and the store nearly falls over — the cache was silently carrying most of the read load.',
      },
      {
        title: 'The viral product',
        failureMode: 'cache-stampede',
        narrative: 'A product goes viral. Its 60-second TTL expires and 400 concurrent requests miss together — 400 identical queries hit PostgreSQL in the same second. Jittered TTLs and request coalescing later tame this; the first time, it looked like a DDoS.',
      },
    ],
  },
  {
    id: 's5',
    era: 'scale-reads',
    title: 'Read Replicas',
    headline: 'Cache misses and dynamic reads still drown the primary.',
    conditions: {
      traffic: { rps: 5000 },
      latency: { p95_ms: 300 },
      availability: { target: '99.95%' },
      workload: { read_write_ratio: '85/15' },
      data: { size_gb: 120 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'lb-1', role: 'load-balancer', technology: 'nginx', x: 50, y: 12 },
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', x: 24, y: 38 },
      { id: 'app-2', role: 'application-server', technology: 'spring-boot', x: 56, y: 38 },
      { id: 'cache-1', role: 'cache', technology: 'redis', x: 88, y: 26 },
      { id: 'db-primary', role: 'database', technology: 'postgresql', x: 44, y: 68 },
      { id: 'db-replica-1', role: 'database', technology: 'postgresql', x: 26, y: 90 },
      { id: 'db-replica-2', role: 'database', technology: 'postgresql', x: 62, y: 90 },
    ],
    connections: [
      { from: 'lb-1', to: 'app-1' },
      { from: 'lb-1', to: 'app-2' },
      { from: 'app-1', to: 'cache-1', label: 'GET/SET' },
      { from: 'app-2', to: 'cache-1', label: 'GET/SET' },
      { from: 'app-1', to: 'db-primary', label: 'writes' },
      { from: 'app-2', to: 'db-primary', label: 'writes' },
      { from: 'app-1', to: 'db-replica-1', label: 'reads' },
      { from: 'app-2', to: 'db-replica-2', label: 'reads' },
      { from: 'db-primary', to: 'db-replica-1', label: 'WAL' },
      { from: 'db-primary', to: 'db-replica-2', label: 'WAL' },
    ],
    patterns: ['database-indexing', 'connection-pooling', 'cache-aside', 'read-replication'],
    configuration: [
      { key: 'db.indexes', value: 'products(category, price), orders(customer_id, created_at)' },
      { key: 'db.connection_pool', value: '20 per app instance (PgBouncer transaction pooling)' },
      { key: 'http.timeout_ms', value: '200' },
      { key: 'cache.ttl.product', value: '60s + jitter' },
      { key: 'cache.invalidate_on_write', value: 'true' },
      { key: 'db.replication', value: 'async streaming (WAL)' },
      { key: 'read.routing', value: 'reads → replicas; order reads → primary for 5s after own write' },
    ],
    narrative:
      'Caching absorbs the hot keys, but the long tail — cache misses, filtered search, order history — still grows with traffic, and every one of those reads competes with writes on a single primary. Two streaming replicas now serve the read path; writes stay on the primary. Read capacity scales horizontally, at the price of replication lag. Order reads are routed to the primary for five seconds after the customer\'s own write: read-your-writes, surgically applied.',
    teachingNotes: [
      'Deferred at S4, chosen at S5: read replicas were always plausible — the conditions made them *necessary* only now. Deferred ≠ rejected.',
      'Two reasonable decisions interact dangerously here: a stale replica read can populate the cache, and Redis then serves that stale value until expiry. See the scenario below.',
      'The primary remains the single writer — and the store\'s most important single point of failure.',
    ],
    failureScenarios: [
      {
        title: 'The missing order',
        failureMode: 'replication-lag',
        narrative:
          'A customer checks out; the write lands on the primary. They immediately open "My Orders" — the read hits a replica 800 ms behind — and the order appears missing. Without the read-your-writes routing rule, support tickets follow. This is the scenario that makes consistency models concrete.',
      },
      {
        title: 'Stale replica poisons the cache',
        failureMode: 'replication-lag',
        narrative:
          'A price update commits on the primary. A cache miss for that product reads a *lagging* replica, gets the old price, and writes it into Redis. The cache now serves the stale price until invalidation or TTL — two individually reasonable decisions (cache-aside, read replicas) combining into behavior nobody designed.',
      },
    ],
  },
  {
    id: 's6',
    era: 'scale-work',
    title: 'Work Queue',
    headline: 'Checkout returns in 200 ms. The email can wait three seconds.',
    conditions: {
      traffic: { rps: 5000 },
      latency: { p95_ms: 250 },
      availability: { target: '99.95%' },
      workload: { read_write_ratio: '85/15' },
      data: { size_gb: 150 },
      consistency: { product_catalog: 'eventual', inventory: 'strong', orders: 'strong' },
    },
    components: [
      { id: 'lb-1', role: 'load-balancer', technology: 'nginx', x: 50, y: 10 },
      { id: 'app-1', role: 'application-server', technology: 'spring-boot', x: 22, y: 32 },
      { id: 'app-2', role: 'application-server', technology: 'spring-boot', x: 52, y: 32 },
      { id: 'cache-1', role: 'cache', technology: 'redis', x: 88, y: 20 },
      { id: 'db-primary', role: 'database', technology: 'postgresql', x: 40, y: 60 },
      { id: 'db-replica-1', role: 'database', technology: 'postgresql', x: 22, y: 80 },
      { id: 'db-replica-2', role: 'database', technology: 'postgresql', x: 58, y: 80 },
      { id: 'broker-1', role: 'message-broker', technology: 'rabbitmq', x: 86, y: 50 },
      { id: 'worker-email', role: 'worker', x: 78, y: 88 },
      { id: 'worker-invoice', role: 'worker', x: 94, y: 88 },
    ],
    connections: [
      { from: 'lb-1', to: 'app-1' },
      { from: 'lb-1', to: 'app-2' },
      { from: 'app-1', to: 'cache-1' },
      { from: 'app-2', to: 'cache-1' },
      { from: 'app-1', to: 'db-primary', label: 'writes' },
      { from: 'app-2', to: 'db-primary', label: 'writes' },
      { from: 'app-1', to: 'db-replica-1', label: 'reads' },
      { from: 'app-2', to: 'db-replica-2', label: 'reads' },
      { from: 'db-primary', to: 'db-replica-1', label: 'WAL' },
      { from: 'db-primary', to: 'db-replica-2', label: 'WAL' },
      { from: 'app-1', to: 'broker-1', label: 'publish' },
      { from: 'app-2', to: 'broker-1', label: 'publish' },
      { from: 'broker-1', to: 'worker-email' },
      { from: 'broker-1', to: 'worker-invoice' },
    ],
    patterns: ['database-indexing', 'connection-pooling', 'cache-aside', 'read-replication', 'work-queue'],
    configuration: [
      { key: 'db.indexes', value: 'products(category, price), orders(customer_id, created_at)' },
      { key: 'db.connection_pool', value: '20 per app instance (PgBouncer transaction pooling)' },
      { key: 'http.timeout_ms', value: '200' },
      { key: 'cache.ttl.product', value: '60s + jitter' },
      { key: 'cache.invalidate_on_write', value: 'true' },
      { key: 'db.replication', value: 'async streaming (WAL)' },
      { key: 'read.routing', value: 'reads → replicas; order reads → primary for 5s after own write' },
      { key: 'queue.delivery', value: 'at-least-once (consumer acks)' },
    ],
    narrative:
      'Checkout p95 was dominated by side effects: confirmation email, invoice PDF, warehouse notification — none of which the user needs in the response. A RabbitMQ work queue now carries them. The app writes the order, publishes a job, and returns; workers do the rest. Kafka was considered and deferred: the system needs reliable task delivery, not event replay or multi-consumer streams. The queue\'s at-least-once semantics immediately create a new problem — duplicate processing — which the reliability segment answers with idempotency.',
    teachingNotes: [
      'The queue was chosen because side effects are *deferrable*. If the user needed the invoice in the response, this decision would be wrong.',
      'Every asynchronous boundary trades immediacy for resilience. "When does the email arrive?" is now "eventually, usually in seconds".',
      'Duplicate-processing is a *problem* created by at-least-once delivery; consumer-failure is a *failure mode* of the workers. The distinction matters.',
    ],
    failureScenarios: [
      {
        title: 'The double email',
        failureMode: 'consumer-failure',
        narrative:
          'worker-email sends the confirmation and crashes one millisecond before acknowledging. RabbitMQ redelivers; the restarted worker sends the email again. Without idempotency keys, a flash sale produces thousands of duplicate emails — and, in worse domains, duplicate charges.',
      },
    ],
  },
];
