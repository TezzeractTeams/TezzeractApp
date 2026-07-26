# Talk

Internal communications — the Slack/Teams-alternative surface, unioned across every
organization a user belongs to rather than switched between.

**Status:** not started. WhatsApp/Slack groups are the manual stand-in until this is built
— see the [Revenue-First Plan](../architecture/technical/40-revenue-first-plan.md) for why
that's the right call pre-funding.

**Planned approach:** headless integration over an existing open-source chat backend,
run unmodified behind an adapter — never forked, so it stays swappable and keeps AGPL
exposure at arm's length.

## Deep dives

- **[Open-Source Foundations](../architecture/technical/23-open-source-foundations.md)** —
  why Mattermost's tenancy model conflicts with the union-view requirement, and the licence
  question still pending counsel
- **[Headless Integration](../architecture/technical/24-headless-integration.md)** — running
  it as a backend only, with the org-mapping and deprovisioning machinery that makes it safe
- **[Substrate Strategy](../architecture/technical/33-substrate-strategy.md)** — why every
  substrate gets two candidate implementations while the licence decision is open
