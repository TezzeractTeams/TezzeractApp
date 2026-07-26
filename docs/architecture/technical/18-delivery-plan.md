# Delivery Plan (v1 — Superseded)

> ⚠️ **Superseded by [40-revenue-first-plan.md](40-revenue-first-plan.md).**
> This plan assumed ramping to 7–9 engineers from the start. The team begins at 3 and ramps
> on funding, so the sequencing was rebuilt around a revenue-first phase. The **phase
> ordering and exit criteria here remain sound** — only the resourcing and timeline changed.
> Kept for the reasoning trail; do not plan against it.


> Sequenced so each phase makes the next cheaper. The ordering is the argument — later
> work is far more expensive if earlier work is skipped.

---

## Phase 0 — Foundations (4–6 weeks)

**Nothing else can be built correctly until this lands.**

| # | Deliverable | Notes |
|---|---|---|
| 0.1 | 🔴 Rotate leaked Supabase keys, purge git history | Day one. See [17 §3](17-security-and-compliance.md) |
| 0.2 | `platform` schema: users, organizations, memberships, entitlements, audit_log | [12](12-data-model.md) |
| 0.3 | Backfill + dual-read; drop `organizations.user_id` | Point of no return |
| 0.4 | OrgContext middleware; union reads, explicit writes | [ADR-007](10-decisions.md#adr-007) |
| 0.5 | RLS on every tenant table | |
| 0.6 | Close public `/talent` and `/social` routes | |
| 0.7 | Re-scope `platform_connections` to `organization_id` | Must precede any second membership |
| 0.8 | Delete stale `ARCHITECTURE.md`, `DASHBOARD_GUIDE.md` Clerk references | Four contradictory auth docs today |

**Exit criteria.** A user can belong to two orgs and see a labelled union in one list. The
nightly isolation test passes. No secrets in the repo.

**Risk.** 0.3 touches every read path. Mitigate with dual-read and a feature flag; do not
attempt it in the same release as 0.7.

---

## Phase 1 — Contracts (3–4 weeks)

Do this *before* the API surface grows. Retrofitting conventions across 200 endpoints is
what makes teams give up on them.

| # | Deliverable |
|---|---|
| 1.1 | Zod contracts for all existing endpoints |
| 1.2 | Codegen: OpenAPI + typed client + drift check in CI |
| 1.3 | `/api/v1/<module>/*` with uniform envelope; legacy paths proxied |
| 1.4 | Cursor pagination, filter/sort grammar |
| 1.5 | Error codes + agent-directed `hint` field |
| 1.6 | `GET /api/v1/_catalog` |

**Exit criteria.** Every endpoint validated by generated schema; the client is generated,
not hand-written.

---

## Phase 2 — Extraction (5–7 weeks)

| # | Deliverable |
|---|---|
| 2.1 | Turborepo; `packages/` · `modules/` · `apps/` · `services/` |
| 2.2 | `@tezzeract/ui` with token layer; collapse the three Button variants |
| 2.3 | `TezzeractModule` manifest; shell renders from it |
| 2.4 | `features/*` → `modules/*`; **rename `social` → `contelli`** |
| 2.5 | `dependency-cruiser` in CI |
| 2.6 | NestJS migration, module by module |
| 2.7 | Entitlement-gated rail |

**Exit criteria.** Adding a module requires zero shell changes. CI rejects cross-module
imports.

**Risk.** 2.6 is the largest single item. Run it strangler-style — new modules in NestJS,
migrate existing ones one at a time, both mounted behind the same gateway.

---

## Phase 3 — Agent (5–6 weeks)

| # | Deliverable |
|---|---|
| 3.1 | `services/agent`; `ModelProvider` interface |
| 3.2 | `defineTool` + registry; org-injected `ToolContext` |
| 3.3 | Threads in Postgres with immutability trigger; retire `localStorage` |
| 3.4 | Agent panel into the shell layout (persistent across module switches) |
| 3.5 | Talent tools; **delete the regex parsers** |
| 3.6 | Contelli tools |
| 3.7 | Tiered catalog, pgvector retrieval, audit, prompt-cache |

**Exit criteria.** The agent performs a real Contelli action from a Talent context without
crossing an org boundary. Isolation suite covers every tool.

---

## Phase 4 — Standalone & Talk (6–8 weeks)

| # | Deliverable |
|---|---|
| 4.1 | `apps/contelli-web` on contelli.co |
| 4.2 | Tezzeract Identity service; cross-domain SSO |
| 4.3 | Stripe + entitlement webhooks; standalone → suite upgrade path |
| 4.4 | Talk: schema, `services/realtime`, channels/messages/presence |
| 4.5 | Talk union view across orgs |
| 4.6 | Talk tools for the agent |

**Exit criteria.** A customer buys Contelli on contelli.co, upgrades to Tezzeract, and
keeps all data with no migration.

---

## Critical path

```
0.2 → 0.3 → 0.4 → 0.5 ─┬─► 1.x ─► 2.x ─► 3.x
                       └─► 0.7 ─────────────► 4.3
```

Phases 1 and 2 can partially overlap. **Phase 3 cannot start before 0.4** — an agent
without OrgContext is the one thing we must never ship.

## Team shape

| Phase | Needs |
|---|---|
| 0 | 1 senior backend + 1 DBA-minded engineer |
| 1 | 2 backend |
| 2 | 2 frontend + 1 backend |
| 3 | 1 AI engineer + 1 backend |
| 4 | 2 full-stack + 1 infra |

Roughly 6–8 months at 3–4 engineers. The current repo shows one primary contributor — the
plan assumes hiring, and Phase 0 is the part I would least want a new hire to do alone.

## What we are explicitly not doing yet

- Module Federation ([ADR-015](10-decisions.md#adr-015)) — until teams block each other
- Microservices per module — until load demands it
- Kubernetes — Fly until compliance forces a VPC
- Multi-region writes — read replicas first
- Custom model fine-tuning — prompt + tools first; revisit with real usage data

Each is a real option we are deferring with a named trigger, not a rejection.

## Metrics

**Engineering:** deploy frequency, lead time, change-failure rate, p95 latency, isolation
suite pass rate (must be 100%).

**Agent:** tool success rate, hops per turn, tokens per turn (release gate), disambiguation
rate, task completion.

**Product:** modules per org, agent DAU/MAU, standalone→suite conversion, time-to-team-formed.

`disambiguation_rate` is the one to watch closest — it is the only direct signal on whether
the union-view model matches how people actually work.
