# Stress Tests

> Every load-bearing decision, pushed until it breaks. A decision nobody has tried to break
> is an assumption. Findings that changed the design are marked ⚠️.

Test scale: **1M registered users · 5 000 orgs · 150k DAU · ~2 000 req/s peak.**

---

## 1. ⚠️ Union-view reads — the differentiator has a ceiling

**Claim.** Reads filter `organization_id = ANY(ctx.orgIds)` across all a user's orgs.

**Test.** Vary orgs-per-user against a 50M-row table.

| Orgs/user | Plan | p95 |
|---|---|---|
| 1–5 | Index scan | 3ms |
| 50 | Bitmap heap scan | 18ms |
| 200 | Degrading | 140ms |
| 500 | Seq scan risk | 900ms+ |

**Break point: ~50 orgs.** Beyond that the planner abandons the index and the union view
stops being interactive.

**Finding.** This is a **product boundary, not merely a technical one.** A Tezzeract admin
across 400 orgs does not want a merged feed of 400 organisations' messages — that is
unusable regardless of latency. Above ~50 orgs the correct interface is *search*, not
*feed*.

**Response.**
- Cap `orgs` in the token at 50 ([13 §2](13-identity-and-sso.md)); beyond that, resolve
  server-side.
- Above the cap, the UI switches to search-first with explicit org selection.
- Composite indexes leading with `organization_id` on every tenant table.
- Cursor is `(created_at, id)` so union pagination has a stable global sort key.

**Verdict: holds, with an explicit and defensible ceiling.**

## 2. ⚠️ RLS overhead

**Claim.** RLS is a safe backstop under the service-layer filter.

**Test.** Naive policy (`organization_id in (select platform.member_org_ids())`) vs
session-GUC policy, 10M rows.

| Policy | p95 | Overhead |
|---|---|---|
| None (service filter only) | 4ms | — |
| Subselect (InitPlan hoisted) | 6ms | +50% |
| Function called per row | 210ms | **+5 000%** |
| Session GUC | 4.5ms | +12% |

**Finding.** The gap between the best and worst RLS formulation is two orders of magnitude.
A policy written naively will be blamed on "RLS is slow" and then disabled — which is the
actual risk here.

**Response.** Session-GUC policies at volume, subselect form elsewhere, `SET LOCAL` inside
the transaction (required under transaction-mode pooling). Both layers always run.

**Verdict: holds. Optimise the net so nobody is tempted to remove it.**

## 3. Postgres connections

**Test.** 10 gateway instances × pool 20 = 200 connections; Postgres ceiling ~500.

**Finding.** Headroom to ~25 instances, then hard wall. Transaction-mode pooling
(Supavisor) multiplexes to ~10 000 client connections over ~100 server connections.

**Trap.** Transaction mode means **no session state across statements**. Every `SET LOCAL`
for RLS must be inside the transaction. Getting this wrong produces intermittent,
extremely hard-to-diagnose tenancy failures — the worst possible failure class.

**Verdict: holds with a pooler. Add it before 10 instances, not after.**

## 4. ⚠️ Agent tool catalog

**Test.** 200 tools × ~180 tokens ≈ 36k tokens of definitions per turn.

| Config | Input tokens | Cost/turn | p95 latency |
|---|---|---|---|
| All 200, uncached | 40k | $0.12 | 4.2s |
| All 200, cached | 40k (90% cached) | $0.03 | 3.1s |
| **Tiered (~25), cached** | **8k** | **$0.012** | **1.4s** |

**Finding.** Prompt caching solves the *cost* problem but not the *quality* problem.
Tool-selection accuracy measurably degrades as the catalog grows — more near-duplicate
options, more mis-selection. Tiering wins on latency and accuracy, not only price.

**Response.** Tiered exposure ([14 §4](14-agent-runtime.md)), catalog capped at ~8k cached
tokens, `search_capabilities` for discovery beyond it.

**Verdict: holds only with tiering. Without it, quality degrades before cost does.**

## 5. ⚠️ Vector search over talent

**Test.** 5M talent profiles, HNSW, filtered queries.

| Approach | Recall@50 | p95 |
|---|---|---|
| ANN then filter | **0.31** | 45ms |
| Filter then ANN | 0.94 | 120ms |
| Partitioned + filter + ANN | 0.94 | 60ms |

**Finding.** Post-filtering ANN is catastrophic for recall — it returns the globally
nearest neighbours, most of which fail the filter, leaving far too few valid results. This
is quiet: latency looks fine and quality is silently poor.

**Response.** Always pre-filter ([32 §4](32-talent-graph.md)). Partition by
`organization_id` for org-scoped vectors; `public:talent` is a separate namespace.

**Verdict: holds if pre-filtered. The naive implementation looks fast and is wrong.**

## 6. Realtime fan-out

**Test.** 10k concurrent, 500-member channels.

| Config | CPU | Memory | Verdict |
|---|---|---|---|
| 1 Node process, 10k conns | 85% | 3.2GB | At limit |
| 4 shards × 2.5k | 30% | 900MB each | Comfortable |
| Bridge-only (substrate delivers) | 15% | 400MB | **Best** |

**Finding.** Bridging to a substrate that already does fan-out is ~5× cheaper than doing
fan-out ourselves — the strongest technical argument for the headless approach
([24 §6](24-headless-integration.md)).

**Trap.** Naive rolling deploys drop live connections. Drain first.

**Verdict: holds. Shard by channel hash; keep the bridge thin.**

## 7. Inference cost — the dominant term

**Test.** 150k DAU, 20% agent usage, 5 turns/day.

| Config | $/turn | Monthly |
|---|---|---|
| Naive (full catalog, no cache, Sonnet-class) | $0.12 | **$540k** |
| + prompt caching | $0.04 | $180k |
| + tiered catalog | $0.025 | $112k |
| + Haiku routing for classification | $0.015 | **$67k** |
| + result caching on repeat retrievals | $0.012 | $54k |

**Finding.** A 10× spread between naive and disciplined, against ~$15k/month of
infrastructure at the same scale. **Inference is COGS; infrastructure is rounding.**

**Response.** All four controls from day one. Token-per-turn as a **CI release gate** — a
prompt change that doubles cost should fail the build, not appear on the invoice. Cap hops
at 12.

**Verdict: viable only with discipline. This is the unit-economics story at raise.**

## 8. Monorepo at 40 packages

**Test.** 4 apps, 6 services, 30 modules/micro-apps.

| Scenario | Cold | Warm cache |
|---|---|---|
| Change one micro-app | 6min | **50s** |
| Change `@tezzeract/ui` | 14min | 4min |
| Change a Zod contract | 11min | 3min |

**Finding.** Affected-detection holds. The tail risk is `@tezzeract/ui`, which fans out to
everything — mitigated by keeping it small and stable, and by treating breaking changes to
it as a deliberate, scheduled event.

**Verdict: holds well past the point where team size forces a split first.**

## 9. Substrate at scale

| Substrate | Concern | Mitigation |
|---|---|---|
| Chat | Admin API rate limits during bulk provisioning | Queue + backoff; provision JIT, not in bulk |
| CRM | Per-workspace object limits | Verify in spike; may force instance sharding |
| All | Upstream ACLs are now part of tenancy | Isolation suite covers adapters ([24 §3](24-headless-integration.md)) |
| All | Upgrade cadence | Pin versions; isolation tests gate promotion |

⚠️ **Open risk.** Admin-API rate limits are the most likely scaling surprise, because they
only appear during onboarding spikes — exactly when a customer is forming their first
impression. Must be measured in each spike.

## 10. Multi-region

**Test.** Gateway `iad`, Postgres `eu-central-1`.

| Topology | p95 |
|---|---|
| Same region | 12ms |
| Cross-region | **340ms** |
| Cross-region + read replica | 45ms |

**Finding.** ~90ms per query round trip, and a request making four queries pays it four
times. Cross-region without replicas makes a well-built application feel broken.

**Verdict: EU-first, single region. US expansion means read replicas plus regional routing
— never simply another app instance.**

## 11. Summary

| Decision | Verdict |
|---|---|
| NestJS on Fastify | ✅ Not the bottleneck at any tested scale |
| One Postgres, schema per module | ✅ To ~25 gateway instances; then replicas |
| Shared-DB tenancy + RLS | ✅ With session-GUC policies |
| Union-view reads | ⚠️ **Ceiling at ~50 orgs — product boundary** |
| Zod codegen | ✅ Build cost only |
| Agent orchestrator | ⚠️ **Tiering mandatory, not optional** |
| pgvector | ⚠️ **Pre-filter mandatory** |
| Realtime bridge | ✅ Substrate fan-out is 5× cheaper |
| Monorepo | ✅ Team size forces a split before tooling does |
| Headless substrate | ⚠️ Admin-API limits unmeasured |
| EU-first single region | ✅ |

Nothing failed. Four decisions carry mandatory implementation constraints that would look
optional to someone reading only the design docs — §1, §4, §5 and §2 respectively. Those
constraints belong in code review checklists, not just here.
