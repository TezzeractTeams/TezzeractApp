# Building on Open-Source Foundations

> Plan: Talk on **Mattermost**, Tasks on **AppFlowy**, CRM on **Twenty**.
> This document covers what that changes, three blockers to resolve first, and the
> integration pattern that keeps the architecture intact.

> ⚠️ **Licensing statements here need verification by counsel.** Open-source licences
> change — Mattermost's in particular has moved more than once. Treat this as a map of
> what to check, not legal advice.

---

## 1. What changes

These are not libraries. Each is a **complete application** with its own backend language,
database, auth system, frontend, tenancy model, and release cadence.

| Product | Backend | Frontend | Licence (verify) |
|---|---|---|---|
| Mattermost | Go | React | Mixed: AGPL-3.0 core + source-available enterprise |
| AppFlowy | Rust | Flutter (+ newer web client) | AGPL-3.0 |
| Twenty | NestJS/TypeScript | React | AGPL-3.0 |

Three consequences land immediately:

1. **The stack becomes polyglot.** Go + Rust + TypeScript. Turborepo does not orchestrate
   Go modules or Cargo builds.
2. **Licence compliance becomes a first-order architectural constraint** (§2).
3. **Their tenancy models are not ours** (§3) — the sharpest technical problem.

## 2. Blocker one — AGPL and SaaS

AGPL §13 is the clause that matters: if you **modify** the program and make it available to
users **over a network**, you must offer those users the source of your modified version.

What this does and does not mean:

| Scenario | Obligation |
|---|---|
| Run **unmodified** upstream, integrate over its REST API | Generally none for your code — separate programs communicating over a network are ordinarily separate works |
| **Fork and modify** the upstream, run it as a service | You must publish **those modifications** |
| Link/embed AGPL code into your service | Risk that your service becomes a derivative work |

The nuance people miss: **AGPL does not force you to open-source Tezzeract.** It forces you
to open-source modifications *to the AGPL work*. But if your Talk differentiation lives in
a Mattermost fork, that differentiation becomes public — which is a competitive problem
even where it is not a legal one.

There is a second, sharper issue: **[20-carve-out-readiness.md](20-carve-out-readiness.md)
assumes you can sell a product.** An acquirer's diligence will examine AGPL exposure
closely, and a heavily-forked AGPL core can materially reduce what a product is worth.

**Action:** counsel review before implementation. Commercial licences exist for Mattermost
and are worth pricing against the engineering cost of staying unmodified.

## 3. Blocker two — their tenancy model fights ours

This is the deepest problem, and it is specific to what makes Tezzeract distinctive.

Our defining requirement ([02 §4](../02-identity-and-tenancy.md)):

> A user in two organizations sees threads from **both at once**, labelled. They do not
> swap organizations.

Now look at what these products actually do:

| Product | Tenancy unit | Cross-tenant view |
|---|---|---|
| Mattermost | Teams within an instance | Team **switching** — the opposite of union view |
| AppFlowy | Workspaces | Workspace switching |
| Twenty | Workspaces | Workspace switching |

**Every one of them is built on the org-switching model we explicitly rejected.**

So "Talk on Mattermost" risks shipping a *worse* version of the exact thing you said was
the differentiator. Three ways out, none free:

1. **Accept switching for that module.** Cheapest. Weakens the product promise, and
   inconsistently — Contelli unions, Talk switches.
2. **Build the union in your own UI.** Use the upstream as a backend only; your client
   queries N teams and merges them. Preserves the promise; you own the merge, pagination,
   ordering, and unread-count logic.
3. **Fork to add native multi-team views.** Most faithful, most expensive, and triggers
   the AGPL obligation in §2.

**Recommendation: option 2**, which flows naturally from §5.

## 4. Blocker three — UI embedding vs. design uniformity

You require ([05](../05-design-system.md)) a unified look with per-product identity —
"like Uber and Uber Eats." Each upstream ships its own complete design system.

| Approach | Design uniformity | Effort | Verdict |
|---|---|---|---|
| iframe the upstream UI | ❌ visibly foreign | Low | Breaks a stated requirement |
| Restyle upstream's frontend | ⚠️ partial, fragile | High | Fights every upgrade |
| **Build your own UI on their API** | ✅ full | Medium–High | ✅ |

AppFlowy is the hardest case: its primary client is Flutter, which will not compose into a
React shell. Its web client should be evaluated separately, and its maturity verified
before committing.

## 5. The pattern: backend-as-a-service, adapter as anti-corruption layer

Combining §3 and §4 gives one coherent strategy:

> **Run upstream unmodified as a headless backend. Build your own UI. Put an adapter
> between them.**

```
┌──────────────────────────────────────────────┐
│ Your shell — @tezzeract/ui, agent panel      │
│  modules/talk/client   ← Your React UI       │
└────────────────────┬─────────────────────────┘
                     │ /api/v1/talk/*  (your envelope, your conventions)
┌────────────────────▼─────────────────────────┐
│ modules/talk/server — adapter                │
│  · OrgContext → upstream team/workspace ids  │
│  · union across orgs (§3 option 2)           │
│  · their response shape → your envelope      │
│  · their errors → your codes + hints         │
│  · agent tool manifest                       │
└────────────────────┬─────────────────────────┘
                     │ REST / WebSocket, unmodified
┌────────────────────▼─────────────────────────┐
│ Mattermost (upstream, stock)                 │
└──────────────────────────────────────────────┘
```

This is a classic **anti-corruption layer**, and it earns its keep four times over:

- **Licence** — no modification, so §2's obligations largely do not trigger.
- **Upgrades** — upstream releases are a version bump plus contract tests, not a merge.
- **Conventions** — [15](15-api-and-modules.md)'s envelope and [14](14-agent-runtime.md)'s
  tool manifest hold uniformly, so the agent sees one consistent API across every module.
- **Reversibility** — swapping Mattermost for something else changes only the adapter.

The cost: you can only expose what their API exposes, and you carry a translation layer
that must be maintained.

## 6. Identity — the integration you will underestimate

Each upstream has its own auth. Tezzeract Identity must become the source of truth.

```
User → Tezzeract Identity (OIDC)
         └─► adapter provisions/links the upstream account
              (JIT on first use; service token for API calls)
```

Things to verify per product **before committing**:

- Does the free tier support OIDC/SAML, or is SSO an enterprise feature? (Mattermost's
  Team Edition has historically restricted this — a direct cost driver.)
- Can accounts be provisioned via API without a password?
- Can org→team/workspace mapping be automated?
- Is there a service/bot token model for adapter calls?

A product whose SSO is paywalled changes the build-vs-buy maths entirely.

## 7. Repository strategy — the actual answer to your question

The monorepo does **not** become unmanageable, because upstream code never enters it.

```
tezzeract/                     monorepo (TypeScript) — unchanged
├── modules/talk/              adapter + your UI
├── modules/tasks/             adapter + your UI
├── modules/crm/               adapter + your UI
└── …

tezzeract-infra/               Terraform, deploy configs
tezzeract-mattermost/          Only if forking — pinned upstream + patches
tezzeract-twenty/              Only if forking
```

Key points:

- **Deploying unmodified upstream needs no repo at all** — a pinned container image
  reference in `tezzeract-infra` is sufficient.
- A fork gets its own repo, with its own language toolchain and its own CI. Never inside
  the monorepo: it would mean Go/Rust builds, a different licence boundary, and a
  vendored upstream history polluting `git filter-repo` extraction.
- Your monorepo stays pure TypeScript. Everything in [21-ci-cd.md](21-ci-cd.md) holds.

**This actually strengthens the monorepo case.** The adapters are small, share
`@tezzeract/ui` and `@tezzeract/identity`, and must stay consistent with each other — which
is exactly what a monorepo is good at.

## 8. Per-product assessment

Decide with one question: **how much of your differentiation lives in this product?**

| Product | Surface saved | Differentiation at stake | Verdict |
|---|---|---|---|
| **CRM on Twenty** | Very large — pipelines, custom fields, imports | Low: CRM is commoditised | ✅ **Strongest case** |
| **Tasks on AppFlowy** | Large — docs, boards, editors | Medium: cross-org task union matters | ⚠️ Verify the web client first |
| **Talk on Mattermost** | Very large — realtime, threads, mobile, moderation | **High: union view is the promise** | ⚠️ Weakest fit — see §3 |

Talk is the one to scrutinise. It saves the most engineering *and* conflicts most directly
with the differentiator. Two honest options: accept switching for Talk (and say so
publicly), or build the union in your own client and treat Mattermost purely as transport
plus storage.

Note also that [ADR-012](10-decisions.md#adr-012)'s dedicated realtime service becomes
unnecessary if Mattermost is doing the fan-out — a genuine saving, and one of the better
arguments for this approach.

## 9. What this does to the delivery plan

Phases 0–3 in [18-delivery-plan.md](18-delivery-plan.md) are unaffected — they concern
identity, tenancy, contracts, and the agent, all of which these products need *more* of,
not less.

Phase 4 changes shape:

```
4.0  Licence review (counsel)                    ← Blocks everything below
4.1  Spike per product: deploy, SSO, API coverage, tenancy mapping
4.2  Decide build-vs-adapt per product, on evidence
4.3  Adapter framework + contract tests against pinned versions
4.4  First adapter (Twenty — lowest risk, clearest win)
4.5  Then Tasks, then Talk
```

**Sequence Twenty first.** It is the strongest fit, the same language as our stack, and it
lets us prove the adapter pattern where the tenancy conflict is mildest.

## 10. What to verify before committing

- [ ] Licence review by counsel for all three; price the commercial options
- [ ] Does each free tier support OIDC/SAML SSO?
- [ ] API coverage — can our UI do everything their UI does?
- [ ] AppFlowy web client maturity (Flutter will not embed)
- [ ] Upstream release cadence and breaking-change history
- [ ] Can org→workspace mapping be fully automated?
- [ ] Self-host operational cost per product
- [ ] Data export path — for carve-out and GDPR portability
