# Tezzeract Architecture

The complete architecture record: what we're building, why, and how. Living documents —
when a decision changes, the document changes.

> ### 👉 New here? Read **[SUMMARY.md](SUMMARY.md)** — the whole architecture on one page.

---

## How this is organised

Four bands. The number tells you what kind of document it is.

| Band | Purpose | Audience |
|---|---|---|
| **00–07** | **Vision** — what Tezzeract is and why | Everyone |
| **10–25** | **Technical foundations** — how it's built | Engineers |
| **30–35** | **Strategy** — Kernel, IP, moat, scale | Founders, investors, leads |
| **40–45** | **Execution** — what to build now | The team, day to day |

Bands 30–45 are the current spine. Bands 00–25 remain accurate for their subjects; 30–45
reorganise and sequence them, they don't replace them.

---

## 00–07 · Vision

| # | Document | Settles |
|---|---|---|
| 00 | [North Star](00-north-star.md) | What Tezzeract is; the seven non-negotiables |
| 01 | [Platform Topology](01-platform-topology.md) | Modules as independently sellable apps |
| 02 | [Identity & Tenancy](02-identity-and-tenancy.md) ⭐ | SSO, orgs, memberships, roles, AI isolation |
| 03 | [Agent Layer](03-agent-layer.md) | Cross-module tool calling; org-bound threads |
| 04 | [API Conventions](04-api-conventions.md) | Envelope, error hints, agent ergonomics |
| 05 | [Design System](05-design-system.md) | Unified look, per-product identity |
| 06 | [Current State](06-current-state.md) | Honest inventory of the repo + ranked gaps |
| 07 | [Open Questions](07-open-questions.md) | What's still undecided |

⭐ **02 is the one to read.** Nearly every other decision depends on the tenancy model, and
it's what the current schema most directly contradicts.

## 10–25 · Technical foundations

| # | Document | Contents |
|---|---|---|
| 10 | [**Decisions (ADRs)**](technical/10-decisions.md) ⭐ | All 18 records: choice, reasoning, cost, revisit trigger |
| 11 | [System Architecture](technical/11-system-architecture.md) | Services, request path, failure posture |
| 12 | [Data Model](technical/12-data-model.md) ⭐ | Executable DDL, RLS, migration order |
| 13 | [Identity & SSO](technical/13-identity-and-sso.md) | Token design, OIDC flows, OrgContext |
| 14 | [Agent Runtime](technical/14-agent-runtime.md) ⭐ | `defineTool`, isolation controls, injection defence |
| 15 | [API & Modules](technical/15-api-and-modules.md) | Module contract, envelope, REST-vs-GraphQL |
| 16 | [Infrastructure](technical/16-infrastructure.md) | CI/CD, migrations, cost, scaling triggers |
| 17 | [Security & Compliance](technical/17-security-and-compliance.md) | Threat model, GDPR, incident response |
| ~~18~~ | ~~Delivery Plan v1~~ | **Superseded by [40](technical/40-revenue-first-plan.md)** |
| 19 | [Scale Model](technical/19-scale-model.md) | What breaks first at 1M users |
| 20 | [Carve-Out Readiness](technical/20-carve-out-readiness.md) | Selling one product: what it costs |
| 21 | [CI/CD & Repo Strategy](technical/21-ci-cd.md) | One repo, ~10 deploy targets, the four guards |
| 22 | [Hosting](technical/22-hosting.md) | Domain map, request flow, cross-domain cookies |
| 23 | [Open-Source Foundations](technical/23-open-source-foundations.md) | AGPL, tenancy conflict, adapter pattern |
| 24 | [Headless Integration](technical/24-headless-integration.md) | Upstream as backend: mapping, provisioning |
| 25 | [App Platform](technical/25-app-platform.md) | Three module tiers, the SDK, the app store |

## 30–35 · Strategy

| # | Document | Contents |
|---|---|---|
| 30 | [**Architecture v2**](technical/30-architecture-v2.md) ⭐ | The Kernel model — how IP, modules and substrate stratify |
| 31 | [IP Strategy](technical/31-ip-strategy.md) 🔴 | Where value lives, contributor assignment, diligence pack |
| 32 | [Talent Graph](technical/32-talent-graph.md) ⭐ | The compounding moat: co-work outcomes, team composition |
| 33 | [Substrate Strategy](technical/33-substrate-strategy.md) | Two implementations per substrate while AGPL is open |
| 34 | [Stress Tests](technical/34-stress-tests.md) | Every decision pushed until it breaks |
| ~~35~~ | ~~Delivery Plan v2~~ | **Superseded by [40](technical/40-revenue-first-plan.md)** |

## 40–45 · Execution

| # | Document | Contents |
|---|---|---|
| 40 | [**Revenue-First Plan**](technical/40-revenue-first-plan.md) 🔑 | What 3 devs build; the 5 cheap-now-expensive-later items |
| 41 | [AI-First Codebase](technical/41-ai-first-codebase.md) | Conventions, `AGENTS.md`, CI as the reviewer |
| 42 | [Talent Operations](technical/42-talent-operations.md) | Ops rules as enforced domain invariants |
| 43 | [Frontend Evaluation](technical/43-frontend-evaluation.md) | React tested and kept; marketing app isolated |
| 44 | [Token Economics](technical/44-token-economics.md) 🔴 | Cost tiering, public-endpoint abuse defence |
| 45 | [Model Selection](technical/45-model-selection.md) | Whole market: OpenAI, Gemini, Chinese labs, open weights |

---

## Reading paths

| You are… | Read |
|---|---|
| **New engineer** | [SUMMARY](SUMMARY.md) → [02](02-identity-and-tenancy.md) → [41](technical/41-ai-first-codebase.md) → [12](technical/12-data-model.md) |
| **Starting work this week** | [SUMMARY](SUMMARY.md) → [40](technical/40-revenue-first-plan.md) → [42](technical/42-talent-operations.md) |
| **Building the agent** | [14](technical/14-agent-runtime.md) → [03](03-agent-layer.md) → [44](technical/44-token-economics.md) → [45](technical/45-model-selection.md) |
| **Doing a security review** | [17](technical/17-security-and-compliance.md) → [13](technical/13-identity-and-sso.md) → [12 §8](technical/12-data-model.md) |
| **Investor / diligence** | [SUMMARY](SUMMARY.md) → [31](technical/31-ip-strategy.md) → [32](technical/32-talent-graph.md) → [34](technical/34-stress-tests.md) |
| **Deciding something** | [10](technical/10-decisions.md) first — it may already be settled |

---

## Maintaining these

- **ADRs are append-only.** Supersede, never edit — the reasoning trail is the value. Two
  reversals are recorded already ([ADR-016](technical/10-decisions.md) NestJS deferral,
  [ADR-017](technical/10-decisions.md) the withdrawn Astro proposal); both kept their history.
- **Gap tables at the end of 01–05 and in 06 are the backlog.** Delete a row when it closes.
- **[06-current-state.md](06-current-state.md) is a dated snapshot.** Refresh it when the
  stack moves.
- Resolved items in [07](07-open-questions.md) become decision records.

> ⚠️ **Root [`ARCHITECTURE.md`](../../ARCHITECTURE.md), [`DASHBOARD_GUIDE.md`](../../DASHBOARD_GUIDE.md) and
> [`TROUBLESHOOTING.md`](../../TROUBLESHOOTING.md) describe auth schemes the code does not use**
> (bespoke JWT and Clerk respectively; the code uses Supabase Auth). They are historical and
> scheduled for deletion in M0. **This folder is the authority.**

## Knowledge graph

A queryable graph over the repo lives in `graphify-out/`:

```
graphify query "how does org isolation work in the agent layer?"
graphify path "Membership" "Agent Orchestrator"
```

Rebuild after substantial changes: `/graphify . --update`.
