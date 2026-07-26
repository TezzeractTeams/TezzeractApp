# System Architecture

> The physical shape of Tezzeract. Decisions and their costs live in
> [10-decisions.md](10-decisions.md); this document shows what we build.

---

## 1. Context

```
   Prospects          Customers (org users)      Talent           Tezzeract staff
       │                      │                    │                    │
       ▼                      ▼                    ▼                    ▼
┌─────────────┐      ┌──────────────────┐   ┌────────────┐    ┌──────────────────┐
│ tezzeract   │      │ app.tezzeract    │   │ talent     │    │ same app, higher │
│ .com        │      │ .com             │   │ onboarding │    │ standing         │
│ (Next.js)   │      │ (Vite SPA)       │   │            │    │                  │
└─────────────┘      └──────────────────┘   └────────────┘    └──────────────────┘
       │                      │                    │                    │
       └──────────────────────┴────────────────────┴────────────────────┘
                                      │
                            ┌─────────▼─────────┐
                            │   API Gateway     │
                            └─────────┬─────────┘
                                      │
        ┌──────────┬──────────┬───────┴────┬──────────┬──────────┐
        ▼          ▼          ▼            ▼          ▼          ▼
    Identity   Platform    Talent      Contelli     Talk      Agent
                                                            Orchestrator
        └──────────┴──────────┴────────────┴──────────┴──────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
        Postgres+pgvector          Redis                 Object storage
```

External: Stripe · Google/Meta/X OAuth · Cal.com · Anthropic API · email.

## 2. Runtime components

| Component | Tech | Responsibility |
|---|---|---|
| `apps/web` | Next.js | Public site, blog, portfolios, **SEO'd talent profiles** |
| `apps/tezzeract-app` | Vite SPA | Authenticated shell: rail + agent panel + module viewport |
| `apps/contelli-web`, `apps/talk-web` | Vite SPA | Standalone module shells |
| `services/gateway` | NestJS | Authn, OrgContext, rate limit, routing, audit |
| `services/identity` | NestJS | SSO, sessions, token issue/refresh, memberships |
| `services/agent` | NestJS | Threads, tool dispatch, retrieval, model calls |
| `services/realtime` | Node + ws | Talk transport: presence, typing, fan-out |
| `services/jobs` | BullMQ | Scheduled posts, digests, embeddings, webhooks |
| `modules/*` | NestJS modules | Business logic; mounted in gateway today |

**Modules are libraries, not services** — for now. They ship handlers, migrations, and a
tool manifest as one package, so any of them can be lifted into its own process later
without touching callers ([ADR-003](10-decisions.md#adr-003), [ADR-015](10-decisions.md#adr-015)).

## 3. Request path

```
Client
  │  Authorization: Bearer <tezzeract access token>
  ▼
Gateway
  ├─ 1. Verify token (JWKS, cached)
  ├─ 2. Resolve OrgContext ────────► Redis (60s) ──miss──► platform.memberships
  │      { userId, standing, orgIds[], roleByOrg, entitlements }
  ├─ 3. Entitlement check for the target module
  ├─ 4. Rate limit (per user × per org)
  ├─ 5. Zod-validate request
  ▼
Module handler
  ├─ reads : WHERE organization_id = ANY(ctx.orgIds)     ← union
  ├─ writes: assert ctx.roleByOrg[body.organizationId]   ← explicit
  ▼
Postgres (RLS enforces the same rule independently)
  ▼
Response  { data, meta: { organizationId, … }, pagination }
```

Steps 2 and 5 are the whole tenancy model. Everything else is plumbing.

## 4. The agent path

```
Agent panel (shell, persistent)
  │  POST /api/v1/agent/threads/:id/messages
  ▼
Agent Orchestrator
  ├─ load thread → thread.organization_id (immutable)
  ├─ build ToolContext — organizationId injected HERE, never from the model
  ├─ filter tool catalog by entitlements × standing × orgRole × active module
  ├─ retrieve context, org-filtered at the query layer
  ├─ ModelProvider.complete({ tools, messages })
  ├─ dispatch tool calls → module handlers with ToolContext
  ├─ audit every call
  └─ stream response (SSE)
```

The thread's org is fixed at creation. A request that spans orgs gets a disambiguation
question, never a guess ([03 §5](../03-agent-layer.md)).

## 5. Data topology

One Postgres, four schemas:

```
platform/   users · organizations · memberships · entitlements
            subscriptions · audit_log · agent_threads · agent_messages
talent/     talents · talent_skills · portfolios · teams · team_members
            bookings · talent_embeddings
contelli/   platform_connections · scheduled_posts · content_suggestions
            objectives · analytics_snapshots
talk/       channels · channel_members · messages · reactions · read_state
```

Cross-schema FKs point **only** into `platform`. Everything tenant-scoped carries
`organization_id`, indexed, with RLS.

## 6. Events

```
Module writes row + outbox record  (one transaction)
        │
   Relay polls outbox ──► Redis Stream `tz.events`
        │
   Consumers (idempotent, by event id)
```

Envelope: `{ id, type, organizationId, actorId, occurredAt, payload, traceId }`.
`organizationId` is mandatory — it is how consumers stay tenant-safe, and how we satisfy
per-org erasure.

## 7. Environments

| Env | Purpose | Data |
|---|---|---|
| local | development | seeded fixtures |
| preview | per-PR | ephemeral branch DB |
| staging | pre-prod, load tests | synthetic |
| production | live | real |

**No production data in any lower environment.** Not anonymised, not "just for
debugging". This is a hard line — it is the one that most often gets crossed under
delivery pressure, and it converts a bug into a breach.

## 8. Observability

- **Tracing** — OpenTelemetry end-to-end. Every span carries `organization_id` and
  `trace_id`; the agent's tool dispatch is a span so a slow turn is attributable.
- **Logs** — structured JSON, `trace_id` on every line. **Never log tenant payloads.**
- **Metrics** — RED per endpoint; agent-specific: tokens/turn, tool latency, tool error
  rate, disambiguation rate.
- **Audit** — `platform.audit_log`, append-only, for every write and tool call.

## 9. Failure posture

| Failure | Behaviour |
|---|---|
| Identity down | Existing tokens work to expiry (JWKS cached); no new logins |
| Agent down | App fully usable; panel shows degraded state |
| Model provider down | Fail over to secondary provider ([ADR-010](10-decisions.md#adr-010)) |
| Redis down | OrgContext falls back to Postgres; slower, correct |
| A module down | Only that module's rail entry degrades |

The load-bearing property: **the agent is never in the critical path of core CRUD.** It
is how work gets done fastest, not the only way it can be done.
