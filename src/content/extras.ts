import type { JournalEntry, Journey, KnowledgeNode, Walkthrough } from './types';
import { problems } from './nodes/problems';
import { concepts } from './nodes/concepts';
import { patterns } from './nodes/patterns';
import { roles } from './nodes/roles';
import { technologies } from './nodes/technologies';
import { failures } from './nodes/failures';
import { states } from './states';
import { decisions } from './decisions';

export const nodes: KnowledgeNode[] = [...problems, ...concepts, ...patterns, ...roles, ...technologies, ...failures];

export const nodeById = new Map(nodes.map((n) => [n.id, n]));
export const stateById = new Map(states.map((s) => [s.id, s]));
export const decisionById = new Map(decisions.map((d) => [d.id, d]));
export const decisionToState = new Map(decisions.map((d) => [d.toState, d]));

export const journey: Journey = {
  id: 'scaling-online-store-1',
  title: 'Scaling an Online Store — Part 1',
  subtitle: 'From One Server to Thousands of Requests per Second',
  states: states.map((s) => s.id),
};

export const walkthrough: Walkthrough = {
  id: 'place-order-s6',
  title: 'Place an Order — S6',
  stateId: 's6',
  intro:
    'One request, the whole journey inside it. Follow a checkout through the final architecture of Part 1 and notice how every component you watched being added now carries a specific responsibility — and how each one could betray you.',
  steps: [
    {
      title: 'Browser → Load Balancer',
      detail:
        'The request arrives at NGINX, which terminates TLS and picks a healthy app instance. Health checks matter here: a dead app server was ejected from rotation seconds after failing.',
      path: ['lb-1'],
      links: [{ node: 'load-balancer', label: 'Load Balancer' }],
    },
    {
      title: 'Authenticate, statelessly',
      detail:
        'The app validates the signed token locally — no session lookup, no shared store. This is the decision from S2 paying rent: any instance can serve this request.',
      path: ['app-1'],
      links: [{ node: 'horizontal-scaling', label: 'Horizontal Scaling' }],
    },
    {
      title: 'Product check → Cache, then Replica',
      detail:
        'The app re-reads the product to confirm price. Cache-aside: GET from Redis — a hit answers in under a millisecond. A miss reads a replica and repopulates the cache. Remember S5\'s warning: a lagging replica can poison this cache entry.',
      path: ['app-1', 'cache-1', 'db-replica-1'],
      links: [
        { node: 'cache-aside', label: 'Cache-Aside' },
        { node: 'replication-lag', label: 'Replication Lag' },
      ],
    },
    {
      title: 'Order transaction → Primary',
      detail:
        'Decrement inventory, insert the order, commit — one ACID transaction on the primary. Strong consistency is non-negotiable here, which is exactly why orders never touch the cache or the replicas.',
      path: ['app-1', 'db-primary'],
      links: [
        { node: 'database', label: 'Database' },
        { node: 'consistency-models', label: 'Consistency Models' },
      ],
    },
    {
      title: 'Publish the job → Queue',
      detail:
        'Instead of sending the email now, the app publishes `order-confirmation` to RabbitMQ and returns. Checkout latency no longer includes the mail provider — and no longer fails when it does.',
      path: ['app-1', 'broker-1'],
      links: [
        { node: 'work-queue', label: 'Work Queue' },
        { node: 'synchronous-side-effects', label: 'The problem this solved' },
      ],
    },
    {
      title: 'Response: 200 OK, ~200 ms',
      detail:
        'The customer sees the confirmation. Behind the scenes the response carried only what the customer needed — everything else is in flight, asynchronously.',
      path: ['app-1', 'lb-1'],
    },
    {
      title: 'Workers consume, idempotently',
      detail:
        'worker-email and worker-invoice pull the job, execute, acknowledge. If a worker crashes before the ack, RabbitMQ redelivers — and the idempotency key makes the second execution a no-op instead of a duplicate email.',
      path: ['broker-1', 'worker-email', 'worker-invoice'],
      links: [
        { node: 'at-least-once-delivery', label: 'At-Least-Once Delivery' },
        { node: 'idempotency-key', label: 'Idempotency Key' },
      ],
    },
    {
      title: '"My Orders" → Primary (for now)',
      detail:
        'The customer immediately opens their orders. For five seconds after their own write, their reads route to the primary — read-your-writes — so the new order is there. After the window, replicas serve them like everyone else.',
      path: ['app-1', 'db-primary'],
      links: [
        { node: 'consistency-models', label: 'Read-Your-Writes' },
        { node: 'read-replication', label: 'Read Replicas' },
      ],
    },
  ],
};

export const journal: JournalEntry[] = [
  {
    id: 'j-001',
    date: '2026-09-06',
    title: 'I thought scaling the app was the fix. The database laughed.',
    body: [
      'While modeling S2 I was convinced the story was "add servers, done". Then I ran the numbers on what 800 RPS of 80/20 traffic does to a single PostgreSQL node and realized the app tier was never going to be the real bottleneck — it just fails first, loudly.',
      'The embarrassing part: my first draft of S2 added Redis "because that\'s what you do". Writing the decision record forced me to answer *why*, and I couldn\'t. The actual problem at S2 was capacity and availability. Redis had to wait until S4, when the conditions finally justified it.',
    ],
    links: [
      { kind: 'decision', id: 'd-02-horizontal-app', label: 'Decision: scale the app tier' },
      { kind: 'node', id: 'horizontal-scaling', label: 'Horizontal Scaling' },
    ],
  },
  {
    id: 'j-002',
    date: '2026-09-19',
    title: 'The day my cache read a stale replica',
    body: [
      'I was writing the S5 failure scenarios and noticed something I had never seen called out in the resources I learned from: cache-aside and read replicas are both reasonable, well-documented decisions — and together they can serve a stale value *indefinitely* (well, until TTL).',
      'A cache miss reads a replica. If the replica lags, the stale value enters the cache and gets served at memory speed to everyone. Two correct patterns, one emergent bug. This interaction is now my favorite teaching scenario in the whole journey, and it only surfaced because the model forces me to ask "what new failure modes does this decision introduce?"',
    ],
    links: [
      { kind: 'state', id: 's5', label: 'S5 — Read Replicas' },
      { kind: 'node', id: 'replication-lag', label: 'Replication Lag' },
    ],
  },
  {
    id: 'j-003',
    date: '2026-09-28',
    title: 'Kafka stayed on the bench, and it felt great',
    body: [
      'Every instinct said "S6 is where Kafka enters". Modeling the decision killed that: the store needs reliable background task delivery. No replay. No multiple consumer groups. No event-stream semantics. RabbitMQ — or honestly SQS — is the honest answer.',
      'Writing "deferred" next to Kafka with an explicit reason felt like the whole point of this project: technologies should appear because conditions demand them. Kafka will get its entrance in Part 2, when the store genuinely needs event streaming. It will be a better entrance for the wait.',
    ],
    links: [{ kind: 'decision', id: 'd-06-work-queue', label: 'Decision: work queue over Kafka' }],
  },
];

export { states, decisions };
