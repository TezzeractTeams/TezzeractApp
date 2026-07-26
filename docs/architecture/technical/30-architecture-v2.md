# Architecture v2 — The Kernel Model

> A rethink after four constraints were settled: hybrid talent marketplace, mixed
> self-serve→enterprise GTM, 12–18 months to raise, AGPL pending legal review.
>
> Supersedes the layering in [11-system-architecture.md](11-system-architecture.md).
> Decisions in [10-decisions.md](10-decisions.md) survive except where noted.

---

## 1. The organising idea

The previous architecture treated every module as equal. That is wrong for a company whose
value must be defensible: it spreads engineering evenly across things that differentiate
and things that do not.

v2 stratifies by **ownership and defensibility**:

```
┌──────────────────────────────────────────────────────────┐
│  Surfaces                                    replaceable │
│  web · app · contelli.co · talk.* · mobile               │
├──────────────────────────────────────────────────────────┤
│  Modules                            some owned, some not │
│  talent · contelli · talk · crm · tasks · micro-apps     │
╞══════════════════════════════════════════════════════════╡
│  ★  Tezzeract Kernel  ★                    100% owned IP │
│                                                          │
│   Identity & additive-membership tenancy                 │
│   Agent orchestration & tenant-safe tool dispatch        │
│   Policy engine (standing × role × entitlement)          │
│   App SDK & module contract                              │
│   Talent graph & team composition                        │
│   Event spine & audit                                    │
╞══════════════════════════════════════════════════════════╡
│  Substrate                            commodity, swappable│
│  Postgres · Redis · R2 · [chat] · [crm] · [tasks] · LLM  │
└──────────────────────────────────────────────────────────┘
```

Three rules that make this more than a diagram:

1. **The Kernel has zero AGPL dependencies** and no dependency on any module. It is
   separately versioned, separately buildable, and could be licensed on its own.
2. **Modules depend on the Kernel, never on each other.** CI-enforced.
3. **Substrate is reached only through an interface** with at least two viable
   implementations ([33](33-substrate-strategy.md)).

Rule 1 is the one that matters in diligence. "Here is the asset, here is its boundary,
here is proof nothing encumbers it" is a materially different conversation from "our IP is
distributed across the codebase."

## 2. What changed from v1, and why

| v1 | v2 | Reason |
|---|---|---|
| Modules are peers | Kernel / module / substrate strata | Concentrates IP where it's defensible |
| Talent is a module | **Talent graph is in the Kernel** | It's the compounding data moat, not a CRUD app |
| Upstream chosen (Mattermost/Twenty) | **Interface + two implementations** | AGPL undecided; also better hygiene |
| Agent orchestrator is a service | Same, but **Kernel-owned and licensable** | It is the primary technical differentiator |
| Enterprise deferred to Phase 4 | **Seams from Phase 0** | Mixed GTM; retrofitting isolation is expensive |
| Delivery optimised for shipping | **Optimised for a defensible asset at raise** | 12–18 month horizon |

Everything else — NestJS on Fastify, one Postgres with schema-per-module, RLS, Zod
codegen, monorepo, headless integration — survives the rethink. Those were stress-tested
in [34](34-stress-tests.md) and hold.

## 3. The Kernel in detail

### 3.1 Identity & tenancy
`platform.users` · `organizations` · `memberships` · `entitlements`. Additive membership,
union reads, explicit writes ([12](12-data-model.md), [13](13-identity-and-sso.md)).

**Why it's IP:** every comparable platform — Zoho, Odoo, Slack, Notion — models tenancy as
a mode you switch into. Ours is a label on data. That is a schema-level decision an
incumbent cannot retrofit without a migration they will never justify. For a business where
people work across multiple clients simultaneously, it is *the* structural differentiator.

### 3.2 Agent orchestration
Threads, tool registry, dispatch, retrieval, audit ([14](14-agent-runtime.md)).

**Why it's IP:** `organizationId` is structurally unrepresentable as a model input. Most
agent frameworks either ignore multi-tenancy or handle it with prompt instructions. Making
cross-tenant access *inexpressible* rather than *forbidden* is the property that makes an
autonomous agent safe to sell to B2B buyers. This is the piece most worth documenting
carefully for diligence — and the one to discuss with IP counsel regarding filing.

### 3.3 Policy engine
Effective permission = `platform_standing × org_role × entitlement × scope`, resolved once
per request into `OrgContext`, reused by API, agent, and UI.

**Why it's Kernel:** three axes evaluated in one place is the difference between a
consistent system and one where the agent and the API disagree about what a user may do.

### 3.4 App SDK & module contract
`TezzeractModule`, `defineTool`, `useOrgDb` ([25](25-app-platform.md)).

**Why it's IP:** it makes tenancy and agent-integration *inherited rather than
implemented*. That is what lets a micro-app take a day, which is what makes an app store
viable, which is what makes the platform compound.

### 3.5 Talent graph & team composition
Skills ontology, multi-vector talent representation, outcome feedback, and constrained
team assembly ([32](32-talent-graph.md)).

**Why it's IP:** individual talent matching is commodity. **Team composition under
complementarity and availability constraints, improved by outcome data you alone hold, is
not.** This is the asset that compounds with every placement.

### 3.6 Event spine & audit
Outbox → stream → idempotent consumers; append-only audit with `cross_org` flagging.

**Why it's Kernel:** it is how modules stay decoupled and how compliance claims become
evidence rather than assertions.

## 4. Runtime topology

```
                         Cloudflare
                              │
   ┌──────────────┬───────────┼───────────┬──────────────┐
   ▼              ▼           ▼           ▼              ▼
 web(Next)   app(SPA)   contelli(SPA)  talk(SPA)    apps sandbox
   └──────────────┴───────────┼───────────┴──────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Kernel Gateway    │  authn · OrgContext · policy
                   └──────────┬──────────┘
        ┌──────────┬──────────┼──────────┬──────────────┐
        ▼          ▼          ▼          ▼              ▼
    identity     agent    talent-graph  modules      realtime
                              │            │          bridge
                              ▼            ▼            ▼
                        Postgres+pgvector  │      [chat substrate]
                        feature store      └──────[crm substrate]
```

`talent-graph` is a distinct service because its workload is different in kind: batch
embedding, model inference, and periodic retraining do not belong in a request-path
process.

## 5. Scalability posture

Full analysis in [34-stress-tests.md](34-stress-tests.md). The findings that changed the
design:

| Finding | Response |
|---|---|
| Union reads degrade above ~50 orgs per user | Cap at 50; above that, search UI instead of a feed. **Product boundary, not just technical** |
| RLS function-per-row is the real cost | Session-GUC policies + `organization_id`-leading composite indexes |
| Tool catalog inflates every turn | Tiered exposure + prompt caching; catalog never exceeds ~8k cached tokens |
| Inference dominates COGS ~15:1 over infra | Routing, caching, hop caps, and token-per-turn as a **release gate** |
| Realtime fan-out is the hardest component | Bridge only; substrate does delivery. Shard by channel |
| Vector search over talent needs filters first | Pre-filter structurally, then ANN — never the reverse |

## 6. Cost posture

| Stage | Monthly | Dominated by |
|---|---|---|
| Build (pre-launch) | ~$600–1 200 | Fixed infra, small substrate |
| 50 orgs / 500 users | ~$1 500–3 500 | Substrate + inference |
| 500 orgs / 10k users | ~$12–30k | **Inference (~70%)** |

The controls are in [34 §7](34-stress-tests.md). The governing rule: **instrument cost per
active user, split infra vs inference, from the first agent turn.** It is the only line
that can move an order of magnitude without anyone shipping a feature — and at raise, a
credible unit-economics story is worth more than any architecture diagram.

## 7. Developer experience

Non-negotiable, because it determines velocity for the whole 12–18 months:

- `pnpm dev` — one command, Kernel + seeded data, running in under 2 minutes.
- **Substrate runs on shared dev instances, not laptops.** Three self-hosted upstreams in
  Docker Compose will not fit comfortably on a laptop, and forcing it is how local dev
  becomes something people avoid.
- End-to-end types from Zod: schema → API → client → tools.
- `pnpm tz create-app` scaffolds a working, installable app.
- Preview environment per PR with an ephemeral database.

## 8. Document map

| Doc | Covers |
|---|---|
| [31-ip-strategy.md](31-ip-strategy.md) | Where IP lives, how it's protected, diligence checklist |
| [32-talent-graph.md](32-talent-graph.md) | The compounding data moat and its ML architecture |
| [33-substrate-strategy.md](33-substrate-strategy.md) | Dual-path design while AGPL is undecided |
| [34-stress-tests.md](34-stress-tests.md) | Every major decision tested at scale |
| [35-delivery-v2.md](35-delivery-v2.md) | 12–18 month plan optimised for the raise |

Docs 10–25 remain current for their subjects; this document reorganises them, it does not
replace them.
