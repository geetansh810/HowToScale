import type { KnowledgeNode } from '../types';

export const roles: KnowledgeNode[] = [
  {
    id: 'application-server',
    kind: 'role',
    title: 'Application Server',
    status: 'reviewed',
    summary:
      'The component role that executes business logic: receives requests, orchestrates data access and side effects, returns responses. Ideally stateless so it can scale horizontally.',
    fitsWhere: 'Present in every state from S0 onward; at S2 it becomes a fleet behind the load balancer.',
    howItWorks:
      'Holds no durable data of its own (in this architecture). Sessions, files and caches live in dedicated roles so any instance can serve any request.',
    edges: [{ to: 'horizontal-scaling', type: 'USES', note: 'Statelessness is what makes the tier horizontally scalable.' }],
  },
  {
    id: 'load-balancer',
    kind: 'role',
    title: 'Load Balancer',
    status: 'reviewed',
    summary:
      'Distributes incoming requests across a fleet of interchangeable servers, health-checks them, and routes around failed instances — turning "one server" into "a tier".',
    problem: 'App-tier-capacity and single-point-of-failure at the application layer.',
    howItWorks:
      'Operates at L4 (connections) or L7 (HTTP, path-aware). Algorithms: round-robin, least-connections. Health checks remove dead backends; the LB itself must be redundant (often handled by the platform/provider).',
    fitsWhere: 'Enters at S2, the first component added purely for scale and availability.',
    improves: ['horizontal capacity', 'instance-failure tolerance', 'zero-downtime deploys'],
    costs: ['another component in every request path', 'its own availability must be solved'],
    edges: [
      { to: 'app-tier-capacity', type: 'SOLVES', conditions: ['app tier is (or can become) stateless'], tradeoffs: ['extra hop', 'LB redundancy question'] },
      { to: 'horizontal-scaling', type: 'PART_OF' },
    ],
    sources: [{ title: 'NGINX Docs — Load Balancing', url: 'https://nginx.org/en/docs/http/load_balancing.html', type: 'primary' }],
  },
  {
    id: 'database',
    kind: 'role',
    title: 'Database (Primary Store)',
    status: 'reviewed',
    summary:
      'The system of record: owns durable, transactional truth for orders, inventory, catalog. Everything else — caches, replicas, queues — is a derived, disposable, or deferred view of what the database knows.',
    fitsWhere: 'The constant of the entire journey: every state either relieves it, replicates it, or routes around it.',
    howItWorks:
      'ACID transactions make multi-row invariants (decrement stock + create order) atomic. Its limits — a single writer, finite I/O — generate most of the journey\'s problems.',
    costs: ['vertical scaling limits', 'single writer bottleneck', 'failure means the truth is unavailable'],
    edges: [
      { to: 'database-primary-failure', type: 'HAS_FAILURE_MODE' },
      { to: 'replication', type: 'PART_OF', note: 'The primary is the source every replica follows.' },
    ],
  },
  {
    id: 'cache',
    kind: 'role',
    title: 'Cache',
    status: 'reviewed',
    summary:
      'A fast, disposable, non-authoritative copy of hot data kept close to the application. Exists to make reads cheap and frequent — never to be the only place data lives.',
    problem: 'Db-read-bottleneck on repetitive, freshness-tolerant reads.',
    fitsWhere: 'Enters at S4 with cache-aside. Note: the same technology (Redis) can fill other roles — session store, rate limiter — in other contexts.',
    improves: ['read latency (memory, ~sub-ms)', 'database load for hot keys'],
    costs: ['staleness by design', 'invalidation complexity', 'new failure modes (stampede, unavailability)'],
    edges: [
      { to: 'cache-aside', type: 'PART_OF' },
      { to: 'cache-unavailable', type: 'HAS_FAILURE_MODE' },
      { to: 'cache-stampede', type: 'HAS_FAILURE_MODE' },
      { to: 'hot-key', type: 'HAS_FAILURE_MODE' },
    ],
  },
  {
    id: 'message-broker',
    kind: 'role',
    title: 'Message Broker',
    status: 'reviewed',
    summary:
      'Accepts, durably stores, and redelivers messages between producers and consumers. Decouples "the request is done" from "all its consequences are done".',
    problem: 'Synchronous-side-effects and the need for reliable, deferrable work handoff.',
    fitsWhere: 'Enters at S6 as a work queue; evolves toward event streaming in Part 2 when replay and multiple consumers are needed.',
    improves: ['temporal decoupling', 'load leveling', 'survives consumer crashes'],
    costs: ['at-least-once semantics → duplicates', 'ordering limits', 'broker operations and monitoring'],
    edges: [
      { to: 'work-queue', type: 'PART_OF' },
      { to: 'consumer-failure', type: 'HAS_FAILURE_MODE' },
    ],
    sources: [{ title: 'RabbitMQ Docs', url: 'https://www.rabbitmq.com/docs', type: 'primary' }],
  },
  {
    id: 'worker',
    kind: 'role',
    title: 'Worker',
    status: 'reviewed',
    summary:
      'A service that consumes jobs from a queue and executes side effects — email, invoices, notifications — off the user-facing critical path.',
    fitsWhere: 'Enters at S6 in pairs (email worker, invoice worker); scales independently of web traffic.',
    howItWorks:
      'Pulls messages, does the work, acknowledges. Crash before ack → redelivery → duplicate risk, which is why workers implement idempotency keys.',
    improves: ['side-effect throughput independent of web tier', 'failure isolation'],
    costs: ['must be idempotent', 'backlog becomes a first-class metric'],
    edges: [
      { to: 'work-queue', type: 'PART_OF' },
      { to: 'consumer-failure', type: 'HAS_FAILURE_MODE' },
    ],
  },
];
