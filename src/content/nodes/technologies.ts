import type { KnowledgeNode } from '../types';

export const technologies: KnowledgeNode[] = [
  {
    id: 'postgresql',
    kind: 'technology',
    title: 'PostgreSQL',
    status: 'reviewed',
    summary:
      'The relational database used as the store\'s system of record. ACID transactions, rich indexing, and streaming replication make it carry the entire MVP journey from one node to a primary-plus-replicas topology.',
    howItWorks:
      'MVCC gives readers snapshot isolation without blocking writers. Indexes (B-tree and beyond) accelerate lookups. Streaming replication ships the WAL to hot standbys that serve reads.',
    fitsWhere: 'Fills the `database` role in every state; the primary/replica split at S5 is a PostgreSQL feature, not new infrastructure.',
    edges: [
      { to: 'database', type: 'IMPLEMENTS' },
      { to: 'replication', type: 'USES', note: 'Streaming replication powers the read replicas of S5.' },
    ],
    sources: [{ title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', type: 'primary' }],
  },
  {
    id: 'redis',
    kind: 'technology',
    title: 'Redis',
    status: 'reviewed',
    summary:
      'In-memory data store used here to implement the `cache` role with cache-aside. Sub-millisecond reads absorb the hot product-catalog traffic. In other contexts Redis fills different roles — session store, rate limiter, queue — which is why roles and technologies are separate nodes.',
    howItWorks:
      'Single-threaded event loop over in-memory data structures; TTLs handle expiry; optional persistence exists but a cache treats it as disposable.',
    fitsWhere: 'Enters at S4 as the cache behind cache-aside.',
    costs: ['another stateful system to run and protect', 'memory sizing becomes capacity planning'],
    edges: [
      { to: 'cache', type: 'IMPLEMENTS' },
      { to: 'cache-unavailable', type: 'HAS_FAILURE_MODE' },
      { to: 'hot-key', type: 'HAS_FAILURE_MODE' },
    ],
    sources: [{ title: 'Redis Documentation', url: 'https://redis.io/docs/', type: 'primary' }],
  },
  {
    id: 'nginx',
    kind: 'technology',
    title: 'NGINX',
    status: 'reviewed',
    summary:
      'Reverse proxy and load balancer that fronts the application fleet from S2 onward: TLS termination, request routing, health-checked upstreams.',
    fitsWhere: 'Fills the `load-balancer` role. Managed LBs (ALB, Cloudflare) are equivalent alternatives at this layer.',
    edges: [{ to: 'load-balancer', type: 'IMPLEMENTS' }],
    sources: [{ title: 'NGINX Docs — Load Balancing', url: 'https://nginx.org/en/docs/http/load_balancing.html', type: 'primary' }],
  },
  {
    id: 'rabbitmq',
    kind: 'technology',
    title: 'RabbitMQ',
    status: 'reviewed',
    summary:
      'Message broker chosen for the S6 work queue: mature routing, consumer acknowledgements, redelivery — exactly the "reliable background task delivery" the store needs. Kafka was explicitly deferred: no replay or multi-consumer event-stream requirements yet.',
    howItWorks:
      'Producers publish to exchanges; queues bind and buffer; consumers ack. Unacked messages are redelivered — hence at-least-once and the idempotency requirement.',
    fitsWhere: 'Fills the `message-broker` role at S6.',
    edges: [
      { to: 'message-broker', type: 'IMPLEMENTS' },
      { to: 'at-least-once-delivery', type: 'USES' },
    ],
    sources: [{ title: 'RabbitMQ Documentation', url: 'https://www.rabbitmq.com/docs', type: 'primary' }],
  },
  {
    id: 'spring-boot',
    kind: 'technology',
    title: 'Spring Boot',
    status: 'draft',
    summary:
      'The application framework implementing the `application-server` role. Interchangeable with any web framework — the architectural reasoning in this journey does not depend on it.',
    edges: [{ to: 'application-server', type: 'IMPLEMENTS' }],
    sources: [{ title: 'Spring Boot Documentation', url: 'https://docs.spring.io/spring-boot/', type: 'primary' }],
  },
];
