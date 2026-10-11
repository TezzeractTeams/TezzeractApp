---
date: 2026-10-12
status: open
tags: [vision, pricing, strategy]
---

# Vision refinement — 12 Oct 2026

Conversation-derived. **Nothing here has been promoted to an ADR yet**: three decisions are
still open (below), and ADRs shouldn't record undecided things.

## What was proposed

Tezzeract is positioned as **Talent + Agents + Systems**. Stated as a *modification*, not a
pivot. "Teamforce" is a marketing term only; **the talent marketplace is still what the
company is based on.** The motivation: as more specialists join, standardized processes
become necessary, and agents make that easier but add technical complexity.

## Decided

- **New Starter tier: $99 per seat, systems only.** Access to the tools Tezzeract builds,
  with agents inside them. No talent and no human services. Existing Teams packages
  ($3k / 3-person, $5k / 5-person, $10k+) stay and bundle talent plus the system.
- **A seat is the client's own staff only.** Tezzeract specialists never count. This maps onto
  `memberships.source` ([12 §4](../architecture/technical/12-data-model.md)): `org_native`
  counts, `tezzeract_assigned` doesn't.
- **One shared system used by both the client and Tezzeract's team**, the same system of
  record for both.
- **Specialists work exclusively inside Tezzeract tools** for coordination (comms, tasks,
  status), and the system must also integrate with other products.
- **Agents handle project-management admin** (task updates and similar) so specialists never
  touch PM tooling. Repeatability of the delivery work itself is deliberately out of scope.
- **The public marketplace stays, and is also a lead-gen surface.**

## Naming rule

**Never label the product an "ERP".** The word was used only to explain the concept.
Tezzeract's ambition is to *disrupt* ERPs, so the label is the category being displaced.
"Shared workspace" is a working term only; the external name is undecided.

## Critical evaluation

**Conceded during the discussion**
- The first read over-weighted a services pivot. With the marketplace as the base, the
  margin and valuation critique mostly falls away.
- The "automating chaos" objection applies to agents doing *delivery* work. It mostly doesn't
  apply to PM-admin automation, which is observe-and-record work.

**What looks strong**
- The shared system is the instrumentation layer for the
  [co-work graph](../architecture/technical/32-talent-graph.md): specialists working inside
  the client's workspace means every task, message and outcome is captured natively.
- The three parts can form one loop instead of three products. A Starter user's agent notices
  a skill or capacity gap, proposes a specialist from the marketplace, and the user converts
  to a Teams package. If that loop can't be drawn, it's three products.

**Risks, in order**
1. **Starter has a cold-start problem Teams doesn't.** In a Teams engagement the client must
   join the workspace to work with their specialists, so adoption comes from necessity. A
   Starter customer has no forcing function: their staff must choose to replace tools they
   already use. Land through integrations first, and treat Starter as a landing zone for
   clients whose team engagement ended, not only as an entry-level upsell path.
2. **Per-seat price against per-event cost.** Illustratively, using the per-turn costs in
   [44](../architecture/technical/44-token-economics.md) ($0.016–0.05) at 40 agent turns a day
   over 22 days, user-initiated turns cost about $14–44 per seat per month, leaving roughly
   55–85% margin on the model line alone. The ambient agent (watching comms, updating tasks)
   costs by workspace activity, not clicks, and is extra.
3. **$99 is steep against PM tools**, whose seats are typically a small fraction of that
   (verify current prices). It only holds against an ops-coordinator hire, and needs a number
   behind it: admin hours removed per person per week.
4. **Two go-to-market motions**: self-serve $99 and sales-assisted $3k+ have different support,
   onboarding and churn profiles. It works if Starter feeds Teams; decide that deliberately.
5. **Agents writing to the system of record.** A wrong status or time entry is client-visible,
   and costs money if billing derives from it. Client-visible agent edits should be
   confirmable, reversible and attributed. Ambient reading of specialists' work needs explicit
   consent and a clear rule on what the agent can see.
6. **The system becomes production-critical.** If it goes down, every specialist across every
   client stops working at once. Availability becomes a delivery commitment: graceful
   degradation (email fallback, data export) and an uptime target for Talk in particular.

**"Exclusively inside Tezzeract tools" means coordination, not craft tools.** Engineers'
work lives in GitHub and designers' in Figma. The agent can't know what got done there
without integration, so "integratable" is required for the PM-admin claim, with GitHub first
for dev teams.

## Open decisions

1. **Agent usage cap / credit model.** Recommendation: don't guess a number. Run a metered
   pilot first (~10 orgs, 4–6 weeks, metering on, billing off). Use a pooled org-level
   allowance rather than per-seat. Degrade to a cheaper model rather than hard-stopping. Don't
   charge customers for ambient capture, but bound its cost with a cheap triage model and
   batching; meter only user-initiated agentic runs.
2. **Which fields are Tezzeract-internal vs client-visible.** The user deferred this "down the
   line". Recommendation: the field list can wait, **the mechanism shouldn't**, because it's
   the same class of decision as `memberships`: hours now, a retrofit across five backends
   later, and a leak is trust-ending.
   - Derive an `audience` (internal | client) from the membership source and carry it in
     `OrgContext`.
   - Add a `visibility` column to tenant tables, **defaulting to internal**, so a forgotten tag
     hides data from a client instead of exposing it.
   - Filter on it in `kernel-sdk`.
   - Bind agent threads to an audience, the way they're already bound to an org.
3. **Teams-package seat allowance.** How many client seats a Teams package bundles, whether
   extra seats cost $99, and how the client's own contractors or guests are counted.

## Architecture implications

- **Dual-audience visibility** isn't in [12](../architecture/technical/12-data-model.md) or
  [14](../architecture/technical/14-agent-runtime.md). The tenancy model separates orgs but
  nothing separates internal from client-visible data *within* one org.
- **The ambient agent is a cross-service pipeline** (Talk → Task → AI → Team). ADR-019 split
  those across four services and databases, so the event bus and saga semantics
  ([ADR-022, ADR-023](../architecture/technical/10-decisions.md)) become core product
  infrastructure, not an edge feature. Decide the failure rule up front: a failed agent update
  must never block the specialist's work.
- **Billing** needs per-seat counts plus metered usage; the current design assumed plan-level
  entitlements.
- **Signal source**: native capture from Tezzeract's own tools, plus a few high-value
  connectors.

## Related

[Architecture summary](../architecture/SUMMARY.md) ·
[Talent graph](../architecture/technical/32-talent-graph.md) ·
[Token economics](../architecture/technical/44-token-economics.md) ·
[Distributed topology v3](../architecture/technical/36-distributed-topology-v3.md)
