# Talent Module

The end-to-end revenue path: AI-assisted requirement parsing, team composition against
enforced ops rules, account-manager assignment, the engagement lifecycle, and the outcome
data that feeds the talent graph.

**Status:** ~40% built — AI chat, talent cards, team panel, Cal.com booking exist. Team
composition constraints, account-manager assignment, and outcome capture are not yet wired.
See [Current State](../architecture/06-current-state.md) for the full inventory.

## Deep dives

This module's detailed specs live under Core Architecture, because they're written and
cross-referenced against the Kernel and data model directly:

- **[Talent Graph](../architecture/technical/32-talent-graph.md)** — the compounding moat:
  co-work outcomes, multi-vector matching, constrained team composition
- **[Talent Operations](../architecture/technical/42-talent-operations.md)** — the ops
  rules (≥1 internal member, account-manager-first-call) as database-enforced invariants,
  not conventions
- **[Revenue-First Plan](../architecture/technical/40-revenue-first-plan.md)** — what ships
  first, and in what order, with the current 3-developer team
