# Scale Model — What Breaks First

> Written in response to a direct challenge: *does this stack serve 1M users?*
> Short answer: yes, but not for the reasons people usually assume, and the binding
> constraint is not infrastructure.

---

## 1. Terminology, because two tools have confusing names

| | What it is | Where we use it |
|---|---|---|
| **NestJS** | Backend framework — DI + module system over Express/Fastify | All API services |
| **Next.js** | React meta-framework — SSR/ISR | **Public site only**: marketing, blog, portfolios, SEO'd talent profiles |

**We deliberately do not run the API on Next.js.** Serverless route handlers have cold
starts, cannot hold long-lived connections, cannot serve WebSockets, and price badly at
sustained high RPS. Next.js gets the workload it is excellent at — CDN-cached, statically
regenerated public pages — and nothing else.

## 2. Traffic model

Assumption: 1M registered B2B users.

```
1,000,000  registered
  350,000  MAU        (35% — typical B2B)
  150,000  DAU        (43% of MAU — daily work tool)
   10,000  peak concurrent   (~7% of DAU)
    2,000  req/s average at peak
    5,000  req/s spike
```

B2B traffic is spiky by timezone but far more predictable than consumer. The daily peak is
roughly 3× the trough.

## 3. Where the latency budget goes

A typical authenticated read, p50:

```
 0.3ms   Fastify routing + Nest guard/interceptor chain
 0.5ms   JWT verify (JWKS cached in memory)
 0.8ms   OrgContext (Redis hit)
 4–12ms  Postgres query incl. RLS
 0.4ms   serialize
──────
~7–15ms  total
```

**The framework is 2–4% of the budget.** Replacing NestJS with hand-rolled Fastify would
save under a millisecond and cost the module-boundary enforcement that is its entire
justification ([ADR-002](10-decisions.md#adr-002)). That is a bad trade.

## 4. What actually binds, in order

### 4.1 LLM inference cost — the real wall

```
150,000 DAU × 20% agent usage × 5 turns = 150,000 turns/day
$0.02–0.05 per turn (cached system prompt + tool catalog)
= $3,000–7,500/day = $90k–225k/month
```

Against ~$8–15k/month of infrastructure at the same scale. **Inference is COGS; everything
else is noise.**

Controls, in order of leverage:

1. **Prompt-cache the system prompt and tool catalog.** They are large and near-constant —
   the single biggest lever, often 60–80% off input cost.
2. **Tiered tool exposure** ([14 §4](14-agent-runtime.md)) — do not ship 300 tool
   definitions in every turn.
3. **Route by workload** — Haiku for classification/extraction/titling, Sonnet for
   tool-calling, Opus only where depth demonstrably pays.
4. **Cap hops at 12.** A runaway loop is a runaway invoice.
5. **Token-per-turn regression as a CI gate.** A prompt change that doubles cost should
   fail the build, not surface on the monthly bill.
6. **Cache deterministic retrievals** — the same org asking the same question in an hour
   should not re-embed.

### 4.2 Postgres connections

Node's async model opens connections fast; Postgres tops out around 500 direct.

- **Supavisor/PgBouncer in transaction mode**, app pool of 10–20 per instance.
- Transaction mode means **no session state across statements** — so org context must be
  set *inside* the transaction (§4.3), not at connection checkout. This is the subtle part
  and the one most likely to be got wrong.
- Read replicas for analytics and dashboards; writes to primary.

### 4.3 RLS evaluation cost

The naive policy re-evaluates a membership lookup per row. Two mitigations, both required:

```sql
-- 1. Wrap the function in a subselect so Postgres hoists it to an InitPlan,
--    evaluated once per query rather than once per row.
create policy tenant_read on contelli.scheduled_posts for select
  using (organization_id in (select platform.member_org_ids()));

-- 2. At high volume, skip the DB lookup entirely: the app sets a GUC
--    inside the transaction from the already-resolved OrgContext.
set local app.org_ids = 'org_abc,org_xyz';

create policy tenant_read_fast on contelli.scheduled_posts for select
  using (organization_id::text = any(string_to_array(
           current_setting('app.org_ids', true), ',')));
```

The service layer is the *performance* path; RLS is the *safety net*
([17 §2](17-security-and-compliance.md)). Both run. Optimise the net so nobody is tempted
to remove it — a disabled control is worse than a slow one.

Also mandatory: a composite index leading with `organization_id` on every tenant table.
Without it, RLS turns every query into a sequential scan.

### 4.4 WebSocket fan-out — the hardest thing here

10k concurrent connections is fine for one Node process on paper (~10–40KB each), but
fan-out is the cost: one message to a 500-member channel is 500 writes.

- Shard `services/realtime` by channel hash; Redis pub/sub between shards.
- Sticky sessions at the load balancer.
- Batch and coalesce presence/typing — they are the highest-volume, lowest-value events.
- **This is the component most likely to need a rewrite in Go or Rust**, and the
  architecture permits it: it is a standalone service behind a transport interface
  ([ADR-012](10-decisions.md#adr-012)).

### 4.5 Vector search

pgvector with HNSW handles low millions of rows at good latency. Org-partitioned
namespaces help — each query searches one org's slice, not the global index.

Migrate to a dedicated store past ~10M vectors or p95 > 200ms
([ADR-013](10-decisions.md#adr-013)).

## 5. Scaling sequence

| Users | Move |
|---|---|
| 10k | Current shape. 2 API instances. |
| 100k | Connection pooler, read replicas, Redis cluster, realtime sharding |
| 500k | Extract hottest module to its own service; CDN for API reads |
| 1M | Multi-region reads, dedicated vector store, realtime possibly in Go |

Every step is enabled by the module packaging ([15 §1](15-api-and-modules.md)) — a module
is self-contained (handlers, migrations, tools), so extraction is a deployment change, not
a rewrite.

## 6. What would genuinely justify leaving Node

Not raw HTTP throughput — Node is comfortably sufficient there. Only these:

| Signal | Move |
|---|---|
| Realtime fan-out CPU-bound at target concurrency | Go or Rust for `services/realtime` |
| Sustained CPU-heavy transforms (video, large exports) | Separate worker, any language |
| p99 tail dominated by GC pauses | Profile first; usually a leak, not the runtime |

**We do not pre-emptively rewrite in Go.** The architecture makes it a per-service decision
we can take later on evidence, which is worth more than guessing correctly today.

## 7. Honest limits of this document

The traffic model is assumption-driven — 1M B2B users could plausibly mean 3× or ⅓ these
numbers depending on how sticky Talk becomes. Treat it as an order-of-magnitude sanity
check, not a capacity plan.

The number to instrument from day one is **cost per active user per month, split into
infrastructure and inference**. At any real scale the second dominates, and it is the only
line that can move an order of magnitude without anyone shipping a feature.
