# Technical Architecture

> Part of the [Tezzeract Architecture](../README.md) set. Start with
> [SUMMARY.md](../SUMMARY.md) if you haven't.

Three bands: **10–25** foundations · **30–36** strategy · **40–45** execution.

## ⭐ Current spine — Distributed Topology (v3)

> Written 2026-07-27. Backend services split into independent repos/DBs per product, one
> Identity service owns SSO and tenancy for all of them. Partially supersedes
> [ADR-001](10-decisions.md#adr-001) and [ADR-015](10-decisions.md#adr-015) on the exact
> triggers those records named.

**[36 · Distributed Topology v3](36-distributed-topology-v3.md)** — the topology diagram,
all seven risks (SSO, tenancy fragmentation, agent isolation, distributed sagas, CORS/CSRF,
contract drift, ops cost) each with a concrete mitigation, and the extraction sequencing
that avoids a big-bang rewrite. Corresponding ADRs: **019–023**, in [10-decisions.md](10-decisions.md).

---

## 10–25 · Foundations

| # | Document | Contents |
|---|---|---|
| 10 | [**Decisions (ADRs)**](10-decisions.md) ⭐ | 23 records with cost and revisit trigger |
| 11 | [System Architecture](11-system-architecture.md) | Services, request path, failure posture |
| 12 | [Data Model](12-data-model.md) ⭐ | Executable DDL, RLS, migration order |
| 13 | [Identity & SSO](13-identity-and-sso.md) | Tokens, OIDC flows, OrgContext, cross-org access |
| 14 | [Agent Runtime](14-agent-runtime.md) ⭐ | `defineTool`, isolation controls, prompt injection |
| 15 | [API & Modules](15-api-and-modules.md) | Module contract, envelope, codegen, REST vs GraphQL |
| 16 | [Infrastructure](16-infrastructure.md) | Hosting, CI/CD, migrations, cost, scaling triggers |
| 17 | [Security & Compliance](17-security-and-compliance.md) | Threat model, isolation, GDPR, incidents |
| ~~18~~ | ~~Delivery Plan v1~~ | ⚠️ **Superseded — use [40](40-revenue-first-plan.md)** |
| 19 | [Scale Model](19-scale-model.md) | What breaks first at 1M users |
| 20 | [Carve-Out Readiness](20-carve-out-readiness.md) | Selling one product |
| 21 | [CI/CD & Repo Strategy](21-ci-cd.md) | One repo, ~10 targets, four guards, dev workflow |
| 22 | [Hosting](22-hosting.md) | Domains, request flow, cross-domain cookies, regions |
| 23 | [Open-Source Foundations](23-open-source-foundations.md) | AGPL, tenancy conflict, adapters |
| 24 | [Headless Integration](24-headless-integration.md) | Upstream as backend; mapping and provisioning |
| 25 | [App Platform](25-app-platform.md) | Three module tiers, SDK, app store, hosting economics |

## 30–35 · Strategy

| # | Document | Contents |
|---|---|---|
| 30 | [**Architecture v2**](30-architecture-v2.md) ⭐ | The Kernel model |
| 31 | [IP Strategy](31-ip-strategy.md) 🔴 | Where value lives; contributor assignment; diligence |
| 32 | [Talent Graph](32-talent-graph.md) ⭐ | The moat: co-work outcomes, team composition |
| 33 | [Substrate Strategy](33-substrate-strategy.md) | Two implementations per substrate |
| 34 | [Stress Tests](34-stress-tests.md) | Every decision pushed until it breaks |
| ~~35~~ | ~~Delivery Plan v2~~ | ⚠️ **Superseded — use [40](40-revenue-first-plan.md)** |
| 36 | [**Distributed Topology v3**](36-distributed-topology-v3.md) ⭐ | Per-product backends, one Identity/SSO service, 7 risks mitigated |

## 40–45 · Execution

| # | Document | Contents |
|---|---|---|
| 40 | [**Revenue-First Plan**](40-revenue-first-plan.md) 🔑 | 3-dev scope; the 5 irreversible foundations |
| 41 | [AI-First Codebase](41-ai-first-codebase.md) | Conventions, `AGENTS.md`, CI as reviewer |
| 42 | [Talent Operations](42-talent-operations.md) | Ops rules as DB-enforced invariants |
| 43 | [Frontend Evaluation](43-frontend-evaluation.md) | React kept; marketing app isolated |
| 44 | [Token Economics](44-token-economics.md) 🔴 | Cost tiering; public-endpoint abuse defence |
| 45 | [Model Selection](45-model-selection.md) | Whole market; data-class routing |

---

## The stack, settled

> ⚠️ **This table describes the pre-distributed (single-Postgres) shape.** As of
> [ADR-019](10-decisions.md#adr-019) / [36](36-distributed-topology-v3.md), backend rows
> marked 🔀 below now apply **per product backend**, not to one shared instance. Frontend,
> contracts, and agent-orchestration rows are largely unchanged in kind — see the note on
> each row.

| Layer | Choice | ADR |
|---|---|---|
| Frontend repo | Vite + React SPA, **frontend only** — no backend co-located | [006](10-decisions.md), [017](10-decisions.md), [019](10-decisions.md) |
| Public web | Next.js, unchanged | [006](10-decisions.md) |
| Backends 🔀 | **One repo + DB per product** (`ai.`/`talk.`/`task.`/`team.`/`contelli.tezzeract.com`) | [019](10-decisions.md) |
| Backend framework | Express now → NestJS at ~5 engineers, Fastify adapter — per backend | [002](10-decisions.md), [016](10-decisions.md) |
| Database 🔀 | One Postgres **per backend**, `organization_id` + RLS within each | [003](10-decisions.md), [004](10-decisions.md) — both scope-noted under [019](10-decisions.md#adr-019) |
| Identity 🔀 | `auth.tezzeract.com` — sole owner of SSO + the tenancy graph; every other backend verifies tokens only | [005](10-decisions.md), [019](10-decisions.md), [020](10-decisions.md) |
| Request scope | Server-derived `OrgContext`, now resolved from token claims across a network boundary | [007](10-decisions.md) |
| Agent | Dedicated orchestrator (`ai.tezzeract.com`); forwards the user's own token, never mints its own | [008](10-decisions.md) |
| Contracts | Zod → OpenAPI + client + tools; now published per-repo via `@tezzeract/contracts` | [009](10-decisions.md) |
| Kernel SDK 🆕 | `@tezzeract/kernel-sdk` — mandatory dependency for `OrgContext`, CORS/CSRF, idempotent consumers | [020](10-decisions.md) |
| Models | Provider-agnostic, routed by data class | [010](10-decisions.md), [45](45-model-selection.md) |
| Events 🔀 | Outbox → **NATS JetStream**, mandatory per service before cross-module workflows ship | [022](10-decisions.md) (supersedes [011](10-decisions.md)) |
| Isolation suite 🆕 | Federated across all backends; deploy-gating, 100% required | [021](10-decisions.md) |
| Realtime | Dedicated WS service for Talk | [012](10-decisions.md) |
| Vectors | pgvector, org-partitioned | [013](10-decisions.md) |
| Billing | Stripe → local entitlements | [014](10-decisions.md) |
| Frontend composition | Build-time modules — now applies to the frontend repo only, no co-located backends to compose against | [015](10-decisions.md), [019](10-decisions.md) |
| API protocol | REST; tools are the agent interface | [018](10-decisions.md) |
| Sagas 🆕 | Explicit per-workflow failure semantics, documented not assumed | [023](10-decisions.md) |

## The five that carry the most weight

1. **`memberships` join table** ([12](12-data-model.md)) — the union-view model is impossible
   without it, and today's `organizations.user_id` actively prevents it.
2. **Server-derived `OrgContext`** ([ADR-007](10-decisions.md)) — makes tenant isolation
   structural, not a rule people must remember.
3. **`organizationId` unrepresentable as a model input** ([14 §7](14-agent-runtime.md)) — a
   model that can name an org can exfiltrate across tenants.
4. **Zod as the single contract source** ([ADR-009](10-decisions.md)) — four hand-maintained
   copies of one contract will drift.
5. **CI-enforced module boundaries** ([15 §1](15-api-and-modules.md)) — a documented rule is
   a suggestion; the build must reject the import.

   > ⚠️ **This mechanism doesn't carry over mechanically to separate repos.**
   > `dependency-cruiser` can only see imports inside one repo. Under the distributed
   > topology ([019](10-decisions.md#adr-019)), the equivalent enforcement is: no
   > service-to-service database access, ever ([020](10-decisions.md#adr-020)); the
   > forbidden-field lint on tool schemas; and the federated isolation suite as a deploy
   > gate ([021](10-decisions.md#adr-021)). Same principle, three different mechanisms,
   > because there's no longer one build to reject the import at.

## Maintenance

ADRs are **append-only** — supersede rather than edit, so the reasoning survives. Notable
reversals, each kept its history rather than being edited away:
[ADR-016](10-decisions.md) (NestJS deferred once team size was known),
[ADR-017](10-decisions.md) (an Astro proposal, withdrawn), and
[ADR-019](10-decisions.md) (monorepo/build-time-composition scope partially reversed once
real dedicated-team hiring made the original triggers fire).
