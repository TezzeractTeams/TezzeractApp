# Delivery Plan v2 — 18 Months to the Raise (Superseded)

> ⚠️ **Superseded by [40-revenue-first-plan.md](40-revenue-first-plan.md).**
> Written before team shape was settled; it assumes 7–9 engineers throughout. The
> **post-funding phases (M12–18) still apply** and 40 hands back to them. Use 40 for
> anything before month 12.


> Sequenced so that at month 18 the demonstrable assets are: a working Kernel, a compounding
> data moat with real placements behind it, and clean IP provenance.
> Supersedes [18-delivery-plan.md](18-delivery-plan.md).

---

## Month 0 — Before any code

Cheap, and each is far more expensive later.

| # | Action | Why now |
|---|---|---|
| 0.1 | 🔴 Rotate leaked Supabase keys; purge git history | Live exposure ([17 §3](17-security-and-compliance.md)) |
| 0.2 | 🔴 **Audit contributor IP assignment; CLA bot** | The likeliest deal-blocker ([31 §6](31-ip-strategy.md)) |
| 0.3 | Instruct counsel on AGPL | Unblocks the Chat decision |
| 0.4 | Delete the three contradictory auth docs | Misleads every new hire |

0.2 is the one to start today. Retroactive assignment from a past contractor with no
leverage is a genuinely bad position.

## Q1 (M1–3) — Kernel foundations

Everything else assumes this.

- `platform` schema: users, organizations, **memberships**, entitlements, audit_log
- Backfill + dual-read; drop `organizations.user_id`
- OrgContext middleware; union reads, explicit writes
- RLS with session-GUC policies ([34 §2](34-stress-tests.md))
- Close public `/talent` and `/social`; re-scope `platform_connections` to org
- **Isolation test suite in CI at 100%**
- Kernel boundary + licence-audit CI ([31 §5](31-ip-strategy.md))

**Exit:** a user belongs to two orgs and sees a labelled union. Isolation suite green.

## Q2 (M4–6) — Contracts, SDK, and the flywheel starts

- Zod contracts across all endpoints; codegen → OpenAPI + client + tool defs
- `/api/v1/<module>/*`, uniform envelope, cursor pagination, error hints
- Turborepo restructure: `packages/` · `modules/` · `apps/` · `services/`
- `@tezzeract/ui` with brand tokens; collapse the three Button variants
- `@tezzeract/app-sdk` + `tz create-app`
- 🔑 **Outcome instrumentation live** — `engagement_outcomes`, impression logging

That last item is the highest-leverage line in this plan. It generates no visible feature
and is worth more at month 18 than anything shipped this quarter — because
[32 §6](32-talent-graph.md)'s learned ranker needs ~500 labelled placements, and they can
only accumulate in wall-clock time.

**Exit:** a micro-app takes under a day. Outcome data accumulating from every placement.

## Q3 (M7–9) — Agent Kernel

- `services/agent`; `ModelProvider` interface
- `defineTool` registry; server-injected `ToolContext`
- Threads in Postgres with the immutability trigger; retire `localStorage`
- Agent panel into the shell, persistent across module switches
- Talent tools; **delete the regex parsers**
- Tiered catalog + prompt caching + token-per-turn CI gate ([34 §4](34-stress-tests.md))

**Exit:** the agent performs a real cross-module action without crossing an org boundary.
Cost per turn under $0.02.

## Q4 (M10–12) — Talent graph

The IP quarter.

- Skills ontology with alias resolution and embeddings
- Multi-vector talent representation; pre-filtered ANN ([34 §5](34-stress-tests.md))
- Matching stages 1–3; heuristic + LLM-judge ranking (cold start)
- **Team composition: greedy submodular assembly**
- `cowork_edges` populating from real engagements
- Feature store with point-in-time correctness

**Exit:** conversational team formation end to end. First co-work edges. Matching quality
measurable and trending.

## Q5 (M13–15) — Modules & substrate

- Native CRM ([33 §5](33-substrate-strategy.md)) — adjacent to the moat
- Native Tasks — small surface, deep agent integration
- Chat: implement whichever backend counsel cleared, against the conformance suite
- Contelli hardening; `social` → `contelli` rename
- App registry, install/uninstall, per-app billing

**Exit:** four modules live. Substrate replaceability demonstrated by two passing
implementations.

## Q6 (M16–18) — Raise readiness

- Tezzeract Identity service; cross-domain SSO; `contelli.co` standalone live
- Stripe entitlements; standalone → suite upgrade path proven with zero data migration
- Learned reranker if placement volume permits; otherwise document the trajectory
- SOC 2 readiness assessment; pen test
- Enterprise seams: SAML evaluation, DPAs, security page
- **Diligence pack assembled** ([31 §9](31-ip-strategy.md))

**Exit:** a customer buys Contelli standalone, upgrades to the suite, keeps all data.
Diligence pack complete.

## Critical path

```
IP audit ──────────────────────────────────────────────► raise
Kernel ─► Contracts ─► Agent ─► Talent graph ─► Modules ─► SSO
              └─► outcome instrumentation ──────────────► moat
                     (12 months of wall-clock accumulation)
```

Two paths cannot be compressed by adding people: **IP assignment** (calendar-bound, and
blocking) and **outcome accumulation** (needs elapsed operating time). Everything else
responds to headcount.

## Team

| Quarter | Shape |
|---|---|
| Q1 | 1 senior backend + 1 data-modelling engineer |
| Q2 | +1 frontend, +1 backend |
| Q3 | +1 AI engineer |
| Q4 | +1 ML engineer (ranking, feature store) |
| Q5–6 | +2 full-stack, +1 infra/security |

Peak 7–9. At $4–10M raised, roughly 18 months of runway at that shape — which is the
implicit constraint the plan is built around.

## Milestones an investor will test

| Month | Demonstrable |
|---|---|
| 3 | Multi-org union view; isolation suite at 100% |
| 6 | Micro-app built live in under a day |
| 9 | Agent performing cross-module actions, tenant-safe |
| 12 | Conversational team formation; first co-work edges |
| 15 | Standalone Contelli sale; substrate swap demonstrated |
| 18 | Matching quality improving measurably with data |

Month 18 is the one that matters. **A chart showing match quality rising with placement
volume is the difference between selling software and selling a compounding asset** — and
it is the single most valuable artefact this plan produces.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Contributor IP gaps | 🔴 Deal-blocking | Audit in month 0 |
| Placement volume too low to train | 🟠 High | Instrument early; hybrid curated flow drives volume |
| AGPL ruling forces a chat rebuild | 🟠 High | Conformance suite makes the swap mechanical |
| Inference cost outruns revenue | 🟠 High | CI cost gate from Q3 |
| Hiring lag | 🟡 Medium | Q1–2 are small-team-shaped by design |
| Substrate rate limits at onboarding | 🟡 Medium | Measure in every spike |

## What we are not doing

Module Federation · microservices per module · Kubernetes · multi-region writes · model
fine-tuning · Tier 3 third-party sandbox · mobile native apps.

Each has a named trigger elsewhere in this folder. **At an 18-month horizon with 7–9
engineers, focus is the binding constraint — not capability.**
