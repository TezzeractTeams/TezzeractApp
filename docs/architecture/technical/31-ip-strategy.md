# IP Strategy & Diligence Readiness

> Written for a raise of $4–10M at $100M+. Technical DD will ask one question:
> **"What do you own that a funded competitor cannot rebuild in twelve months?"**
> This document is the answer, and the architecture that makes it true.

---

## 1. Where the value actually is

Be honest about what is and is not defensible:

| Asset | Defensible? | Why |
|---|---|---|
| Chat, CRM objects, task boards | ❌ | Commodity. Substrate, not product |
| Contelli's dashboards | ⚠️ Weak | Rebuildable in months |
| App SDK / module contract | ⚠️ Medium | Defensible only with ecosystem adoption |
| **Additive-membership tenancy** | ✅ **Strong** | Schema-level; incumbents cannot retrofit |
| **Tenant-safe agent orchestration** | ✅ **Strong** | Hard, novel, and the enabler of B2B agent trust |
| **Talent graph + co-work outcomes** | ✅ **Strongest** | Requires years of operating. Unbuyable |

**The strategy follows directly: concentrate engineering in rows 4–6, treat rows 1–2 as
substrate, and keep the boundary between them clean and documentable.**

## 2. The Kernel is the asset

[30 §1](30-architecture-v2.md) defines the Kernel as identity/tenancy, agent orchestration,
policy, app SDK, talent graph, and the event spine.

Three properties make it an *asset* rather than merely code:

1. **Zero AGPL, zero copyleft.** Permissive dependencies only (MIT/Apache-2.0/BSD/ISC).
   Enforced in CI (§5).
2. **No dependency on any module or substrate.** It is separately buildable and could be
   licensed, sold, or spun out independently.
3. **Documented boundary.** A diligence reader can see exactly what is owned and verify
   nothing encumbers it.

That third property is worth real money. "Here is the asset, here is its boundary, here is
the automated proof" is a materially different conversation from "our IP is distributed
throughout the codebase" — which reads, correctly, as *we have not thought about this*.

## 3. Substrate is deliberately arm's-length

Whatever counsel decides on AGPL, the architecture holds the same shape:

```
Kernel  ──interface──►  Adapter  ──network──►  Substrate
                                                (AGPL or permissive)
```

- The Kernel **never** links, embeds, vendors, or forks substrate code.
- Adapters call over the network only — ordinarily "mere aggregation", not derivative work.
- Every substrate has **two viable implementations** ([33](33-substrate-strategy.md)), which
  is what converts *"we depend on Mattermost"* into *"Mattermost is a replaceable backend,
  like Postgres."*

That second framing is the one that survives diligence, and it is a genuine engineering
property — not a talking point — because the second implementation actually exists.

## 4. Patent considerations

Not legal advice; a list for counsel. Two candidates look substantive:

**(a) Structurally-enforced tenant isolation in multi-tenant agent systems.** The claim
shape: a tool-dispatch architecture where tenant identity is injected server-side into an
execution context and is *absent from the model-visible tool schema*, making cross-tenant
access inexpressible rather than merely prohibited.

**(b) Constrained team composition from outcome-weighted collaboration graphs.** Selecting
a complementary set of individuals under coverage, availability and budget constraints,
weighted by measured joint-delivery outcomes.

Both are architectural rather than abstract, which is the side of the line that matters.
Timing note: **public disclosure starts clocks.** If either is worth filing, file before
publishing detailed technical content or presenting at conferences.

Trade secret is the alternative for (b) — the *data* is protected by being unobtainable,
regardless of whether the method is patented.

## 5. Automated IP hygiene

Assertions do not survive diligence; evidence does. All of these run in CI:

```yaml
license-audit:      # fails on any copyleft in Kernel dependencies
  - pnpm licenses list --filter './packages/kernel/**' --json
  - assert-licenses --allow MIT,Apache-2.0,BSD-2,BSD-3,ISC

kernel-boundary:    # Kernel must not import modules or substrate SDKs
  - dependency-cruiser --config .kernel-boundary.cjs

provenance:         # every commit maps to a signed CLA/assignment
  - verify-contributors --against ip-assignments.json

secret-scan:
  - gitleaks detect --redact
```

`provenance` is the one teams skip and regret — see §6.

## 6. 🔴 Contributor IP assignment

**This is the most likely deal-blocker in your specific situation, and it is not a
technical problem.**

Your role model includes *Tezzeract Associate/Pro members (external, but long-term)*. If
external contributors have committed code without a signed IP assignment, **you may not own
your codebase.** Diligence will check this, and remediation after the fact means tracking
down every past contributor for a retroactive signature — with no leverage.

Required, before the raise:

1. Audit `git log --format='%an %ae' | sort -u` against signed agreements.
2. Signed IP assignment for **every** contributor, employee and contractor alike, before
   first commit. No exceptions, including short engagements.
3. A CLA bot enforcing it on every PR.
4. Written confirmation that no contributor used employer equipment or time in a way that
   could create a competing claim.
5. Founder IP assigned to the company (not held personally).

Do this first. It costs a week now and can cost a round later.

## 7. Open-source hygiene

| Practice | Why |
|---|---|
| SBOM generated per release | Standard diligence request |
| Allow-list, not deny-list, for licences | Deny-lists miss new entrants |
| No vendored third-party source in-repo | Vendoring blurs the boundary |
| Attribution file maintained automatically | Licence compliance evidence |
| Kernel dependencies reviewed quarterly | Licences change — Mattermost's has, twice |

## 8. The data moat

Code is copyable; the graph is not. Protect accordingly:

- `graph.cowork_edges` and `graph.engagement_outcomes` are the crown jewels
  ([32](32-talent-graph.md)). Access-controlled, audited, never in a lower environment.
- Never exposed raw through any API — only derived signals ("strong prior collaboration").
- Backed up separately with independent retention.
- **Instrumented from the first placement**, twelve months before it is trainable. At a
  12–18 month horizon this is the difference between a demonstrable moat at raise and a
  slide claiming one.

## 9. The diligence pack

Assemble as you build, not in the two weeks before a term sheet:

- [ ] Architecture documentation (this folder)
- [ ] Kernel boundary + automated licence-audit results
- [ ] Complete contributor IP assignment records
- [ ] SBOM + attribution
- [ ] Security posture: pen test, isolation suite results, incident log
- [ ] Data moat evidence: placement counts, outcome coverage, matching-quality trend
- [ ] Unit economics: cost per active user, infra vs inference split
- [ ] Substrate replaceability: two implementations demonstrated
- [ ] Patent filings or documented decision not to file

## 10. The narrative

What this architecture lets you say, truthfully:

> Tezzeract owns a Kernel — identity, additive-multi-tenancy, tenant-safe agent
> orchestration, and a talent graph — under permissive licences with full contributor
> assignment. Commodity functions run on replaceable substrate behind adapters, each with
> two demonstrated implementations. The defensible asset is the outcome-labelled
> collaboration graph, which compounds with every placement and cannot be acquired any
> other way.

Every clause is an architectural commitment made elsewhere in this folder. That is the
point: **the IP story is not a narrative laid over the architecture — it is the
architecture.**
