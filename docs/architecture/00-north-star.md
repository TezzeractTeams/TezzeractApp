# Tezzeract — North Star

> Canonical statement of what Tezzeract is. Every other document in `docs/architecture/`
> exists to serve this one. If a design decision conflicts with this file, this file wins
> or this file gets updated — never a silent divergence.

Status: **vision captured 2026-07-26**, largely not yet implemented. See
[06-current-state.md](06-current-state.md) for the honest gap analysis.

---

## 1. What Tezzeract is

Tezzeract is a platform to **discover talent and form remote teams**, sold as a
subscription that gives a business both a **workforce on demand** and a **toolset** to
run that workforce.

Two halves, one account:

| Half | What it is | Who it faces |
|---|---|---|
| **Talent Marketplace** | Search a curated talent database via AI chat, assemble a team, get on a call with them | Prospects & customers (public-ish) |
| **TezzeractApp** | A modular suite of business tools, each a separate app, unified by one agent | Onboarded organizations & Tezzeract staff |

The subscription bundles them. **Tezzeract subscribers are the most valuable users
because they get the entire toolset *plus* the talent workforce.** Individual tools are
also sold standalone.

## 2. The modular thesis

Each module is a **separate app built for one exact business function**, not a feature
folder. A module must be independently sellable, deployable, and brandable.

| Module | Function | Standalone brand/domain |
|---|---|---|
| Talent | Talent discovery & team formation | tezzeract.com/talent |
| Contelli | Social media & content intelligence | contelli.co |
| Talk | Internal comms (Slack alternative) | (own domain) |
| _future_ | one business function each | own domain |

**The rule:** a user must be able to buy Contelli on contelli.co, never touch Tezzeract,
and have a complete product. A Tezzeract user must be able to click "Contelli" in the
left rail and have the *same* Contelli load in-place. Same code, two front doors.

This is the Zoho shape — but AI-fronted rather than menu-fronted.

## 3. The agent is the product surface

A centralized **Tezzeract agent** is persistently visible across the entire app (left
chat panel; the module renders to its right). The agent is not a chatbot bolted onto a
UI — it is the primary way work gets done.

The agent must be able to **talk to every module, run actions, create tasks, and read
state across all of them.** That is a hard architectural constraint, not a feature:

- Every module exposes its capabilities as **agent-callable tools**, not just as a UI.
- The API surface will be large. It must be designed so that **an agent can find and
  pull the right information fast** — not just so a developer can eventually figure it
  out. Agent ergonomics is a first-class API design goal alongside developer ergonomics.

See [03-agent-layer.md](03-agent-layer.md).

## 4. Uber / Uber Eats: unified but distinct

Look and feel is **unified across all surfaces**, while each product keeps its own
identity. Components are shared and recycled regardless of which tool they appear in,
and developers should reach for the shared component before writing a new one.

Concretely: one design system package, one set of primitives, per-module brand tokens
layered on top. See [05-design-system.md](05-design-system.md).

## 5. One account, many organizations

**Single sign-on across every property.** Sign up on tezzeract.com, contelli.co, the
Talk site, or anywhere else — it is *one* Tezzeract account.

Above users sit **Organizations**. Tezzeract is primarily B2B; users are assigned to
organizations.

The critical nuance, and the thing most multi-tenant systems get wrong:

> **This is membership, not context-switching.** A Tezzeract team member assigned to two
> organizations opens Talk and sees threads, groups and chats from *both* organizations
> at once. They do not swap orgs. Task overviews show all pending tasks across all their
> orgs, each labelled with its origin. Organization is a **formality and a data label**,
> not a modal state the user lives inside.

Counterweight, equally hard:

> **Organization data must never cross-contaminate in AI context.** The agent operating
> for Org A must not be able to see, retrieve, or leak Org B's data — even when the
> human it serves is a member of both. Isolation is enforced at the retrieval and tool
> layer, not by prompting.

See [02-identity-and-tenancy.md](02-identity-and-tenancy.md).

## 6. Role model

**Tezzeract-side** (descending trust):

1. Tezzeract Admin
2. Tezzeract Internal Team
3. Tezzeract Associate / Pro member — external, long-term
4. Tezzeract Verified member
5. Regular talent — unverified

**Organization-side:**

1. Organization Admin
2. Organization Manager
3. Organization Staff

These are two orthogonal axes. A person has **one Tezzeract-side standing** (a property
of the person) and **a role per organization they belong to** (a property of the
membership). An Org Admin at ABC Corp may simultaneously be an unverified talent
platform-wide; a Tezzeract Internal Team member may hold Manager role in three client
orgs.

## 7. Non-negotiables

Anything proposed for Tezzeract is checked against these:

1. **Modules stay independently sellable and deployable.** No cross-module import that
   would break standalone Contelli.
2. **One identity.** Never a second account system, on any property.
3. **Org membership is additive, not exclusive.** Multi-org users see the union.
4. **Org data isolation in AI is enforced structurally**, never by prompt instruction.
5. **Every module capability is agent-callable**, not UI-only.
6. **Shared components by default.** New primitives justify themselves.
7. **The API is designed for agent retrieval speed**, not only human REST aesthetics.
