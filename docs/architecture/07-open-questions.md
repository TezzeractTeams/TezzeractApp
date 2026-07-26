# Open Questions

> Decisions not yet made. Each one has downstream consequences, so they're recorded
> rather than silently defaulted. Move an entry to a decision record once settled.

---

### Q1 — Identity provider for cross-domain SSO
Supabase Auth is cookie-scoped to one domain. Serving tezzeract.com, contelli.co and
talk.* from one account means either a hosted-login redirect flow against a single
Supabase project, or a dedicated OIDC layer in front.
**Consequence:** touches every shell's auth code. Cheaper to decide before the second
shell exists. — see [02](02-identity-and-tenancy.md) §1

### Q2 — Does talent live in the same `users` table?
Talent are users with a talent profile, but most never join an org and many never log in.
One table with an optional profile, or a separate `talent_profiles` keyed to user?
**Consequence:** shapes the talent marketplace's entire data model.

### Q3 — Is "Tezzeract" itself an organization?
If Tezzeract staff are modelled as members of an internal org, cross-org access becomes a
special membership rather than a special code path — which is much easier to audit.
**Leaning:** yes. Needs confirmation. — see [02](02-identity-and-tenancy.md) §3

### Q4 — Billing granularity
Per-org, per-seat, per-module, or a hybrid? Determines the `entitlements` schema and
whether a standalone Contelli org upgrading to full Tezzeract is a plan change or a
migration. — see [01](01-platform-topology.md) §7

### Q5 — Model provider for the agent
Currently Gemini 2.5 Flash. Native tool calling, structured outputs, latency and cost all
matter. The orchestrator should be model-agnostic regardless, so this is reversible — but
the tool manifest format shouldn't be shaped around one provider's quirks.
— see [03](03-agent-layer.md) §6

### Q6 — Realtime transport for Talk
Supabase Realtime (already in the stack) vs. dedicated Socket.io service. Talk is the
most latency-sensitive module and the one most likely to need independent scaling.

### Q7 — Data residency
Which jurisdictions must org data stay in? Answering late means re-architecting storage.
— see [02](02-identity-and-tenancy.md) §5

### Q8 — Where does the marketplace live?
The structural diagram puts the AI Talent Exploration page on `tezzeract.com` (marketing
site) while `app.tezzeract.com` hosts the app. Is the public marketplace part of this repo
or the website's? Affects whether talent search is a module or a public service.

### Q9 — Talent profile approval workflow
The diagram shows submission → email status check → an "Approved" decision gate → edit.
Who approves, against what criteria, and how does that map to the standing ladder
(`talent_unverified` → `tezzeract_verified` → `tezzeract_associate`)?

### Q10 — Module runtime independence
Build-time composition is the recommended start ([01](01-platform-topology.md) §4). What
concretely triggers a move to runtime federation? Suggested trigger: separate teams owning
separate modules and blocking each other on release trains — not a date.
