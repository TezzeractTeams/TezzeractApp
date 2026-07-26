# Architecture Decision Records

> Signed off by the CTO. Each record states the decision, the reasoning, what we
> deliberately gave up, and what would make us revisit. **A decision without a stated
> cost is a decision nobody has actually thought through.**

Status legend: ✅ Accepted · 🔄 Provisional (revisit at named trigger) · ⛔ Rejected

## Index

| # | Decision | Status | Revisit when |
|---|---|---|---|
| [001](#adr-001) | Monorepo + Turborepo | ✅ | CI > 20min warm; many external contributors; **still 1–2 devs at end of Phase 2** |
| [002](#adr-002) | NestJS on Fastify adapter | ✅ | *amended by 016* |
| [003](#adr-003) | One Postgres, schema per module | ✅ | Residency or isolation contract |
| [004](#adr-004) | Shared-DB tenancy + RLS | ✅ | Enterprise demands physical isolation |
| [005](#adr-005) | Supabase Auth behind Tezzeract Identity | ✅ | Enterprise SAML/SCIM lands |
| [006](#adr-006) | Next.js public + Vite SPA app | ✅ | *confirmed by 017* |
| [007](#adr-007) | Server-derived `OrgContext` | ✅ | — |
| [008](#adr-008) | Agent orchestrator as a service | ✅ | — |
| [009](#adr-009) | Zod as single contract source | ✅ | — |
| [010](#adr-010) | Provider-agnostic models | 🔄 | **Quarterly** — see [45](45-model-selection.md) |
| [011](#adr-011) | Redis Streams event bus | 🔄 | Multi-day replay or cross-region needed |
| [012](#adr-012) | Dedicated WebSocket service | 🔄 | Substrate may do fan-out — see [24 §6](24-headless-integration.md) |
| [013](#adr-013) | pgvector, org-partitioned | ✅ | >10M vectors or p95 > 200ms |
| [014](#adr-014) | Stripe → local entitlements | ✅ | — |
| [015](#adr-015) | Build-time module composition | 🔄 | Teams blocked on each other's release trains |
| [016](#adr-016) | **Defer NestJS migration** | ✅ | 5+ engineers, or module-ownership collision |
| [017](#adr-017) | **React retained; marketing isolated** | ✅ | A *measured* bottleneck in the app shell |
| [018](#adr-018) | **REST, not GraphQL; tools are the agent interface** | ✅ | Public dev API with many third-party clients |

Records 016–018 are the most recent and amend or confirm earlier ones. Read them before
acting on 002, 006, or the API shape.

---

## ADR-001 — Monorepo with Turborepo ✅

**Decision.** Keep pnpm workspaces; add Turborepo for task orchestration and remote
caching. Restructure to `packages/` · `modules/` · `apps/` · `services/`.

**Why.** Modules must share the design system, identity client, and agent SDK while
staying independently deployable. Turborepo gives us per-package build graphs and CI
caching without the operational weight of Nx or Bazel.

**Cost.** Three real ones, in descending severity for our situation:

1. **Access control is all-or-nothing.** GitHub has no path-level read permissions —
   CODEOWNERS routes reviews, it does not restrict access. This matters specifically
   because our own role model includes *Tezzeract Associate/Pro members (external, long
   term)*. An external Contelli contributor can read identity, billing, and every other
   product. There is no clean in-repo fix.
2. **Tooling overhead is front-loaded.** Turborepo, remote cache, dependency-cruiser,
   migration discovery — ~2–3 weeks of setup, while the atomic-refactor payoff only
   arrives at 3+ engineers touching shared code.
3. **Shared-package blast radius.** Everything lives at HEAD; there is no version pinning
   to let one app stay on last week's `@tezzeract/ui` during a regression.

**Mitigations.** Split infrastructure into a separate `tezzeract-infra` repo (Terraform,
secrets config, runbooks) — standard practice, near-zero cost, and the highest-value thing
to keep away from external readers. Extract a module to its own repo when a genuinely
untrusted short-term contributor needs it; `git filter-repo` makes that an afternoon.

**Why we accept it.** Two things outweigh the above. First, [ADR-009](#adr-009)'s codegen
guarantee — Zod → OpenAPI + client + **agent tool definitions** — is only enforceable
within one commit; split it and the agent's tool catalog silently diverges from the real
API. Second, boundary enforcement only works if the checker can see both sides: polyrepo
*looks* like it enforces module independence but nothing verifies it, whereas
`dependency-cruiser` fails the build. **The monorepo is what makes independent sellability
verifiable rather than aspirational.**

**Revisit if.** Warm-cache CI exceeds ~20 minutes; external contributors become a large
share of committers; a module needs a non-JS toolchain; **or the team is still 1–2 people
at the end of Phase 2** — at that size we would be paying tooling cost for an unrealised
benefit, and polyrepo becomes the better call.

---

## ADR-002 — NestJS (on the Fastify adapter) for all backend services ✅

**Decision.** Migrate from bare Express to NestJS, running on
`@nestjs/platform-fastify` — **not** the default Express adapter.

> **Amended 2026-07-26** after a scale challenge. The original record left the Express
> adapter in place by default, which was an oversight: Fastify gives ~2–3× JSON throughput
> for a one-line change, and Nest abstracts the HTTP layer so nothing else moves. Note
> that NestJS (backend framework) is unrelated to Next.js (React framework), which we use
> **only** for the public SEO site — see [19-scale-model.md](19-scale-model.md) §1.

**Why.** This is the least obvious call here, so the reasoning matters. Our defining
constraint is that **module boundaries must survive contact with deadlines**. Express
gives us no structural help — [`server.ts`](../../../server/src/server.ts) already shows
seven routers flat-mounted with a global `optionalAuth`, and nothing prevents the Contelli
controller importing Talent's internals tomorrow. NestJS modules map 1:1 onto Tezzeract
modules, and its DI container is what lets us inject org-scoped, request-bound context
(the foundation of ADR-007) without threading it through every function signature. Its
OpenAPI generation feeds ADR-009.

**Cost.** Real migration effort, a steeper learning curve, and decorator-heavy code that
is unfashionable. We accept this because the alternative — Express plus a
convention document — has a failure mode we have already observed in this repo.

**Rejected alternative.** Express + hand-rolled conventions. Cheaper today, and it is
precisely how we got a global `optionalAuth` and unauthenticated `/talent`.

**Revisit if.** We move to a polyglot backend, at which point boundaries get enforced by
process rather than framework.

---

## ADR-016 — Defer the NestJS migration until headcount justifies it ✅

> Amends [ADR-002](#adr-002). Recorded 2026-07-26 after team shape was settled: 3 devs now,
> 7–9 post-funding.

**Decision.** Stay on Express through the pre-funding phase. Write business logic as
**framework-agnostic service functions**, with Express as a thin transport layer. Migrate
to NestJS when headcount reaches ~5.

**Why.** ADR-002's justification was module-boundary enforcement across multiple teams.
With 3 developers and a revenue deadline, that problem does not exist yet — and the
migration is 3–4 weeks producing zero customer value. The structural properties that
actually matter (OrgContext middleware, Zod contracts, module folders, the memberships
schema) need no framework at all.

**What makes this safe rather than merely expedient:** keeping business logic out of
Express handlers means the eventual migration is mechanical — a controller wrapper swap,
not a rewrite. The cost of deferring is near zero *provided* that discipline holds, which
[41-ai-first-codebase.md](41-ai-first-codebase.md) encodes as a convention.

**Cost.** Boundary violations are unenforced by the framework in the interim, so
`dependency-cruiser` carries the load alone.

**Revisit at.** 5+ engineers, or the first time two people collide on module ownership.

---

## ADR-003 — One Postgres, schema per module ✅

**Decision.** A single Postgres instance. Each module owns a schema: `platform`,
`talent`, `contelli`, `talk`. Cross-schema foreign keys are permitted **only** into
`platform`.

**Why.** Ownership is explicit and greppable; a module can later be extracted to its own
database because nothing outside it reads its tables. We keep transactional integrity and
one backup story in the meantime.

**Cost.** Shared failure domain and one connection-pool budget until we split.

**Rejected.** Database-per-module now — premature, and it would force distributed
transactions before we have the traffic to justify them.

---

## ADR-004 — Shared-database multi-tenancy with RLS ✅

**Decision.** `organization_id` on every tenant-scoped row, plus Postgres Row-Level
Security. Not schema-per-tenant, not database-per-tenant.

**Why.** The union-view requirement is decisive. A user in two orgs must query across
both in one statement — trivial with `organization_id IN (…)`, and requiring cross-schema
UNIONs or multiple connections under the alternatives. Schema-per-tenant also collapses
operationally at a few hundred orgs.

**Cost.** A single missing `WHERE` is a cross-tenant breach. RLS is the backstop; the
service layer filters too. Defence in depth is mandatory, not optional.

**Revisit if.** An enterprise contract demands physical isolation — serve that as a
dedicated deployment rather than reshaping the core model.

---

## ADR-005 — Supabase Auth behind a Tezzeract Identity service ✅

**Decision.** Keep Supabase Auth as the credential store (passwords, OAuth, MFA). Put a
Tezzeract Identity service in front at `auth.tezzeract.com` that owns the session and
issues **Tezzeract access tokens** carrying identity *and* memberships. All properties —
tezzeract.com, contelli.co, talk.* — authenticate there.

**Why.** Supabase Auth cookies are origin-scoped and cannot deliver cross-domain SSO on
their own, but replacing it outright means rebuilding OAuth, MFA, and recovery for no
near-term gain. Centralising the session at one domain gives us true SSO, and the token
exchange is the seam where we swap the backing IdP later without touching a single
module.

**Cost.** One extra hop on login, and a service we must keep highly available.

**Revisit if.** Enterprise SAML/SCIM lands on the roadmap — that is when WorkOS or Ory
earns its price, and ADR-005's seam is what makes the swap cheap.

---

## ADR-006 — Two frontends: Next.js public, Vite SPA app ✅

**Decision.** `apps/web` on Next.js (App Router) for tezzeract.com — marketing, blog,
portfolios, and **public talent profiles**. `apps/tezzeract-app` stays a Vite SPA for
app.tezzeract.com.

**Why.** The structural diagram puts `tezzeract.com/@talentprofile`,
`/Portfolios/:id` and `/Blogs` on the public site. Those pages *are* the top of the
funnel — they must be server-rendered, indexable, and fast on first paint. A client-side
SPA cannot do that. The authenticated app has the opposite profile: no SEO value, heavy
interactivity, long-lived sessions. Forcing both into one framework compromises whichever
matters more.

**Cost.** Two frontend toolchains. Mitigated by both consuming `@tezzeract/ui`.

---

## ADR-017 — React retained; marketing site isolated ✅

> Confirms [ADR-006](#adr-006) after re-evaluation. Recorded 2026-07-26; see
> [43-frontend-evaluation.md](43-frontend-evaluation.md).
>
> *An intermediate draft proposed Astro + Webflow. Withdrawn* — that reasoning assumed
> engineers would own the public surface. Marketing owns it and works in Next.js with AI
> assistance, which models support far better than Astro. Recording the reversal rather
> than erasing it.

**Decision.** React everywhere. Next.js for the public site, Vite + React SPA for app and
module shells, `@tezzeract/ui` shared.

**Why React survives scrutiny.** Solid and Svelte are genuinely faster — that is not in
dispute. But the gap is 1–2× on operations measured in single-digit milliseconds, behind
API calls measured in hundreds, and every mitigation that matters (virtualisation, isolated
update scopes) is required in those frameworks too. Against that: ~40% of the revenue MVP
already exists in React, LLMs generate React far more reliably than the alternatives — which
is load-bearing on an AI-assisted delivery strategy — and the hiring pool is the largest.
A ~3-month rewrite with five months of runway to first revenue is a bad trade.

**New requirement — isolate the marketing app.** Non-engineers shipping to a public domain
is fine; doing so with platform credentials in scope is not. Its own repo, its own Vercel
project, **zero platform environment variables**, no direct database access, no API routes.
This also keeps it outside the Kernel boundary audit ([ADR-018](#adr-018) / [31 §5](31-ip-strategy.md))
and outside carve-out extraction.

**Cost.** Two build toolchains (Next + Vite), mitigated by a shared component library.

**Revisit if** a performance bottleneck is *measured* in the app shell. The module
architecture makes this the most reversible decision in the stack — a single module can be
built in a candidate framework and compared, without touching the Kernel, API, or data
model.

---

## ADR-007 — Request-scoped OrgContext, server-derived ✅

**Decision.** Every request resolves an `OrgContext` from the token and the `memberships`
table before any handler runs: `{ userId, standing, orgIds[], roleByOrg, entitlements }`.
Handlers may never read an org id from the request body for authorization purposes.

**Why.** This is the single control that makes tenant isolation structural rather than
disciplinary. Reads filter to `orgIds`; writes validate the caller's declared target org
against `roleByOrg`.

**Cost.** One indexed membership lookup per request. Cache in Redis, 60s TTL, busted on
membership change.

---

## ADR-008 — Agent orchestrator as a dedicated service ✅

**Decision.** A standalone `services/agent` owning threads, tool dispatch, retrieval, and
audit. Modules register tool manifests; they never call an LLM themselves.

**Why.** Centralising dispatch is what makes org isolation enforceable in one auditable
place. If each module talked to a model directly we would have N places to get injection,
retrieval scoping, and audit right — and we would get it wrong in at least one.

**Cost.** A network hop between orchestrator and module handlers, and a service on the
critical path of the primary UX.

---

## ADR-018 — REST, not GraphQL; tools are the agent interface ✅

> Recorded 2026-07-26 in response to *"should we use REST or GraphQL, since we use a lot of
> AI?"* Full analysis in [15 §11b](15-api-and-modules.md).

**Decision.** REST (`/api/v1/<module>/<resource>`) for all APIs. The agent interface is the
**tool layer**, not the HTTP API. No GraphQL.

**Why the AI argument points away from GraphQL.**

1. **Agents call tools, not APIs.** A model fills a typed JSON object; it does not compose
   HTTP requests. Agent ergonomics are set by `defineTool` schemas, so the wire protocol is
   largely orthogonal to AI usability.
2. **Query strings are code generation.** Where a model *does* touch GraphQL directly, it
   must author query text — materially more error-prone than populating a validated object,
   with each malformed attempt costing a round trip and tokens.
3. **🔴 The security argument decides it.** Tenant isolation depends on `organizationId`
   being injected server-side and unrepresentable by the model. Under REST + tools that is
   enforced in one dispatcher. Under GraphQL it must hold at every resolver on every field,
   across every nested traversal, forever — an audit surface that grows with the schema.
   Our central claim is *"the agent cannot cross a tenant boundary"*; one design lets us
   prove it, the other lets us only assert it.

**What we give up.** Client-driven field selection and single-round-trip nested fetches —
substantially recovered by `?expand=`, `?fields=`, and PostgREST's `select=` for simple
reads. We also forgo backend-free frontend iteration, which matters less when the same small
team owns both sides.

**What we avoid.** DataLoader batching everywhere, query depth/complexity limiting, loss of
HTTP caching, per-query-cost rate limiting, and field-level authorization across the entire
schema — all significant machinery for a three-person team.

**Strategic upside retained.** Because tools are typed JSON schemas, exposing them as an
**MCP server** later is nearly free — letting customers' own AI assistants drive Tezzeract
under the same OrgContext injection and audit. That option exists *because* the agent
interface is tools rather than a query language.

**Revisit if** we ship a public developer API with many third-party clients whose fetching
needs we cannot anticipate. Even then, prefer adding a GraphQL gateway over the REST layer
to introducing GraphQL as the internal contract.

---

## ADR-009 — Zod as the single contract source ✅

**Decision.** Define every endpoint and tool schema once in Zod. Generate from it:
runtime validation, OpenAPI 3.1, the typed client, and the agent tool definition.

**Why.** Four hand-maintained representations of one contract drift — guaranteed, not
likely. The agent's view of the API must stay true as the surface grows past what anyone
can hold in their head.

**Cost.** Codegen in the build pipeline; generated artifacts must never be hand-edited.

---

## ADR-010 — Provider-agnostic model layer, Claude as default 🔄

**Decision.** The orchestrator talks to an internal `ModelProvider` interface. No module
imports a vendor SDK. Default to **Claude Sonnet 5** (`claude-sonnet-5`) for tool-calling
turns and **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) for classification and
cheap extraction. Model choice is configuration, per-workload.

**Why.** The repo currently references three providers in three places — Gemini in
[`aiTalentSearch.controller.ts`](../../../server/src/controllers/aiTalentSearch.controller.ts),
OpenAI in [`SettingsPage.tsx`](../../../client/src/features/social/pages/SettingsPage.tsx)
and `DASHBOARD_GUIDE.md`. That divergence is itself the argument for an interface. We
default to Claude for tool-calling reliability and prompt caching, both of which matter
disproportionately when the system prompt carries a large tool catalog.

**Cost.** A thin abstraction that will fit some providers better than others. We accept
lowest-common-denominator features at the interface and allow provider-specific
escape hatches behind flags.

**Revisit.** Quarterly. Model economics move faster than our architecture does.

---

## ADR-011 — Redis Streams for the event bus 🔄

**Decision.** Transactional outbox in Postgres → relay → Redis Streams. Consumers are
idempotent. Every event carries `organization_id`.

**Why.** Modules must react to each other (a Contelli campaign creating a Talk thread)
without direct calls. The outbox guarantees we never publish an event for a transaction
that rolled back. Redis is already in the stack for caching and sessions.

**Cost.** Redis Streams is not Kafka — limited replay, and consumer-group management is
ours to run.

**Revisit if.** We need multi-day replay or cross-region fan-out → NATS JetStream.

---

## ADR-012 — Dedicated WebSocket service for Talk 🔄

**Decision.** `services/realtime` — Node + `ws` + Redis pub/sub for presence, typing, and
message fan-out. Not Supabase Realtime.

**Why.** Supabase Realtime is excellent for reacting to row changes and poor at what a
Slack alternative actually needs: presence, typing indicators, per-channel fan-out, and
read receipts. Building those on top of table-change subscriptions means abusing the
database as a message bus.

**Cost.** A stateful service to scale and operate — the hardest thing in this document to
run well.

**Revisit.** Prototype on Supabase Realtime to validate Talk's product shape; move before
external beta.

---

## ADR-013 — pgvector for semantic search ✅

**Decision.** `pgvector` in the same Postgres, HNSW indexes. **Embeddings are partitioned
by `organization_id`, and every similarity query is filtered by org before the ANN
search.** Public talent-profile embeddings live in a separate, explicitly public
namespace.

**Why.** Avoids a second datastore and lets us join embeddings to relational data in one
query. The org partitioning is not a performance detail — it is the isolation control
from [02 §5](../02-identity-and-tenancy.md).

**Revisit if.** Vector volume exceeds ~10M rows or ANN latency degrades → dedicated
vector store, keeping the same namespace discipline.

---

## ADR-014 — Stripe for billing, entitlements in Postgres ✅

**Decision.** Stripe owns subscriptions and invoicing. We own an `entitlements` table
derived from Stripe webhooks. Authorization reads our table, never Stripe.

**Why.** Entitlement checks are on every request and must not depend on a third party's
availability or latency.

**Cost.** Webhook reconciliation, and a drift window we must monitor.

---

## ADR-015 — Build-time module composition 🔄

**Decision.** Modules compose at build time as workspace packages with route-level lazy
`import()`. No Module Federation yet.

**Why.** Type safety end-to-end, one React runtime, trivial debugging. Federation buys
independent runtime deploys at the cost of version skew and duplicated runtimes — real
problems we would be adopting before we have the problem they solve.

**Revisit when.** Separate teams own separate modules and are blocked on each other's
release trains. That is the trigger — not a date.
