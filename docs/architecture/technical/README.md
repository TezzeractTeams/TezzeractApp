# Technical Architecture

> Part of the [Tezzeract Architecture](../README.md) set. Start with
> [SUMMARY.md](../SUMMARY.md) if you haven't.

Three bands: **10–25** foundations · **30–35** strategy · **40–45** execution.

---

## 10–25 · Foundations

| # | Document | Contents |
|---|---|---|
| 10 | [**Decisions (ADRs)**](10-decisions.md) ⭐ | 18 records with cost and revisit trigger |
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

| Layer | Choice | ADR |
|---|---|---|
| Monorepo | pnpm + Turborepo (+ separate infra & marketing repos) | [001](10-decisions.md) |
| Backend | **Express now → NestJS at ~5 engineers**, Fastify adapter | [002](10-decisions.md), [016](10-decisions.md) |
| Database | One Postgres, schema per module | [003](10-decisions.md) |
| Tenancy | Shared DB + RLS, `organization_id` everywhere | [004](10-decisions.md) |
| Identity | Supabase Auth behind Tezzeract Identity | [005](10-decisions.md) |
| Frontend | Next.js public + Vite SPA app, both React | [006](10-decisions.md), [017](10-decisions.md) |
| Request scope | Server-derived `OrgContext` | [007](10-decisions.md) |
| Agent | Dedicated orchestrator service | [008](10-decisions.md) |
| Contracts | Zod → OpenAPI + client + tools | [009](10-decisions.md) |
| Models | Provider-agnostic, routed by data class | [010](10-decisions.md), [45](45-model-selection.md) |
| Events | Outbox → Redis Streams | [011](10-decisions.md) |
| Realtime | Dedicated WS service (bridge, if substrate does fan-out) | [012](10-decisions.md) |
| Vectors | pgvector, org-partitioned | [013](10-decisions.md) |
| Billing | Stripe → local entitlements | [014](10-decisions.md) |
| Composition | Build-time modules | [015](10-decisions.md) |
| API protocol | REST; tools are the agent interface | [018](10-decisions.md) |

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

## Maintenance

ADRs are **append-only** — supersede rather than edit, so the reasoning survives. Two
reversals are already recorded and kept their history:
[ADR-016](10-decisions.md) (NestJS deferred once team size was known) and
[ADR-017](10-decisions.md) (an Astro proposal, withdrawn).
