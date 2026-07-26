# Revenue-First Plan — 3 Devs Now, 7–9 Post-Funding

> Supersedes the resourcing in [35-delivery-v2.md](35-delivery-v2.md). The architecture is
> unchanged; the **sequencing** is rebuilt around a CEO-set priority order and a team that
> starts at 3 and ramps on funding.

---

## 1. The shape

```
M0───────M5────────────M10──────M12─────────────────M18
│  Build  │   Sell      │ Raise  │   Scale           │
│ 3 devs  │  3 devs     │        │  ramp to 7-9      │
│ revenue │  iterate    │        │  build the moat   │
│ engine  │  harden     │        │                   │
└─────────┴─────────────┴────────┴───────────────────┘
     ▲                                            ▲
  irreversible                            moat is trainable
  foundations                             (15 months of data)
```

The funded phase builds the Kernel, agent, and talent graph as designed in
[30](30-architecture-v2.md)–[35](35-delivery-v2.md). This document covers the **pre-funding
phase**, whose only jobs are: earn revenue, and don't foreclose the funded phase.

## 2. Scope, from the CEO priority order

| Priority | Scope | Phase |
|---|---|---|
| 1. Marketplace + team augmentation revenue | Full build | **Pre-funding** |
| 2. Talent module end-to-end + ops rules | Full build | **Pre-funding** |
| 3. Billing, subscription, accounts, access | Full build | **Pre-funding** |
| 4. Internal comms | **WhatsApp/Slack, manual** | Post-funding |
| 5. Task management | Deferred | Post-funding |

Deliberately **out** of the pre-funding build: Contelli, the agent orchestrator, the talent
graph ML, the app SDK, substrate adapters, cross-domain SSO, NestJS.

> ⚠️ **Contelli does not appear in the priority list.** It is a substantial existing
> codebase. Is it parked, being sold separately, or assumed as an upsell? It needs an
> explicit decision — half-maintained products cost more than either shipping or shelving
> them.

## 3. 🔑 Cheap now, expensive later

This is the core of the document. Five things cost days now and quarters later, because
later means migrating live customer data.

| # | Do now | Cost now | Cost at month 12 |
|---|---|---|---|
| 1 | **`memberships` table** (no `organizations.user_id`) | 2 days — no data yet | Weeks, on live customers, with downtime |
| 2 | **`organization_id` on every tenant table** | Hours | Retrofit across every query and index |
| 3 | **Outcome instrumentation** ([32 §2](32-talent-graph.md)) | ~2 days | **Cannot be bought — 15 months of wall-clock data lost** |
| 4 | **Contributor IP assignment + CLA bot** | 1 week | Chasing past contributors with no leverage |
| 5 | **`audit_log` write path** | 1 day | Compliance evidence has no history |

Item 3 is the one to defend hardest under delivery pressure. It ships no feature and no
customer notices. But the learned ranker needs ~500 labelled placements, and those accrue
in **calendar time, not engineering time**. Instrument at month 3 and the funded team
inherits a moat. Instrument at month 12 and they inherit an empty table.

Item 1 is the one that will be argued about. "We only have one org per customer, why the
join table?" Because at month 12 you have paying customers and a Tezzeract account manager
who needs to sit in four of them at once — and by then it is a migration with a maintenance
window instead of a `CREATE TABLE`.

## 4. What 3 devs build (M0–M5)

Building on what exists — the repo is roughly 40% of the way there.

### M0 — Foundations (2 weeks)
- 🔴 Rotate leaked Supabase keys; purge history
- 🔴 Contributor IP audit + CLA bot
- `platform` schema: users, organizations, **memberships**, entitlements, audit_log
- OrgContext middleware; close public `/talent`, `/social`
- RLS on every tenant table

### M1–M2 — Talent end-to-end
- Talent profile + approval workflow ([42](42-talent-operations.md))
- AI requirement → role extraction (harden what exists; drop the regex fallback)
- **Team composition with ops constraints** — ≥1 internal member, etc.
- Account manager assignment
- First-call scheduling (Cal.com already integrated)
- 🔑 Outcome instrumentation live

### M3–M4 — Money
- Stripe subscriptions by team-size tier ($3k/3 · $5k/5 · $10k+ enterprise)
- Org onboarding, user invitations, roles
- Client dashboard: your team, your account manager, your invoices
- Entitlements table driving access

### M5 — Ship
- Comms: WhatsApp/Slack group links stored per engagement — manual, honest, sufficient
- Onboarding runbook for the ops team
- First paying customer

## 5. What "not building for scale" means

The stress tests in [34](34-stress-tests.md) target 1M users. **You are building for ~50
orgs and ~500 users.** At that size:

| Don't build | Do keep |
|---|---|
| Read replicas, sharding, multi-region | `organization_id` everywhere |
| Connection pooler | Indexes leading with `organization_id` |
| Separate services | Union reads (`IN`, not `=`) |
| Redis cache layer | RLS |
| Tiered tool catalog | Zod contracts on new endpoints |

**Preserve the seams; don't pay for the scale.** Every item in the right column is a
schema or query-shape decision that is nearly free now and expensive to retrofit. Every
item in the left is infrastructure you can add in a week when a metric says so.

## 6. Framework: defer the NestJS migration

See [ADR-016](10-decisions.md#adr-016). Summary: NestJS was chosen to enforce module
boundaries across multiple teams. With 3 devs and a revenue deadline, that is solving a
problem you do not yet have, and the migration is 3–4 weeks of zero customer value.

**Stay on Express. Write business logic in framework-agnostic service functions with
Express as a thin transport layer.** Migrate when you hire — which is exactly when
boundary enforcement starts paying, and when the migration becomes mechanical.

## 7. Lean into Supabase harder

At 3 devs, every line not written is a win. Supabase already provides auth, RLS, realtime,
storage and PITR.

- **Simple reads: client → Supabase directly** via `supabase-js`, protected by RLS. No
  endpoint to write, no client to generate.
- **Business logic: through your API.** Team composition, billing, provisioning, anything
  with an invariant.

This roughly halves the code for CRUD screens. The trade is that the client couples to the
schema — acceptable now, and reversible by moving a query behind an endpoint later. RLS is
what makes it safe rather than reckless.

## 8. Revenue model → what billing must support

| Tier | Price/mo | Team size |
|---|---|---|
| Starter | $3 000 | 3 |
| Growth | $5 000 | 5 |
| Enterprise | $10 000+ | Custom |

Implications:

- Subscription is **per organization**, priced by **team size** — so billing depends on the
  talent module's team state. Team size changes must trigger proration.
- Entitlements derive from the plan ([12 §5](12-data-model.md)).
- Enterprise is quote-based: a manual plan record, not a self-serve checkout.

At ~20 customers on Growth that is $100k MRR — which is the traction shape that makes the
raise a conversation about a moat rather than a promise. **The software must never be the
thing blocking a sale**; if a deal needs something manual, do it manually and log it.

## 9. Post-funding (M12–18, 7–9 engineers)

The plan in [35-delivery-v2.md](35-delivery-v2.md) resumes, minus what shipped:

- Kernel proper: agent orchestration, policy engine, app SDK
- **Talent graph**: learned ranker on 15 months of accumulated outcomes
- NestJS migration (now that boundaries matter)
- Internal comms — build or adapt, per [33](33-substrate-strategy.md)
- Task management
- Cross-domain SSO, standalone shells, enterprise features

## 10. Risks

| Risk | Severity | Response |
|---|---|---|
| Outcome instrumentation cut under pressure | 🔴 | It is 2 days. Treat it as non-negotiable |
| `memberships` deferred as "premature" | 🔴 | Cheapest at zero customers. Do it in M0 |
| Contributor IP gaps | 🔴 | Audit in M0 |
| 3 devs slip on a 5-month scope | 🟠 | Cut Contelli maintenance; keep comms manual |
| Bus factor at 3 devs | 🟠 | Types, tests and [41](41-ai-first-codebase.md) conventions as the safety net |
| Selling faster than delivery capacity | 🟡 | A good problem — but the ops runbook must exist before the first sale |

## 11. The one-line version

> Build the revenue engine and the five irreversible foundations. Defer everything else.
> Instrument outcomes from the first placement so the funded team inherits a moat rather
> than an empty table.
