# Headless Integration — Upstream as Backend

> Concrete plan for running Mattermost, Twenty and AppFlowy as **headless backends** behind
> our own UI and API. Supersedes the tentative options in
> [23 §3](23-open-source-foundations.md).

---

## 1. Shape

Yes — each upstream is hosted separately, on a **private network**, reachable only by its
adapter. Our frontend never talks to them.

```
┌──────────────────────────────────────────────────────┐
│  apps/tezzeract-app · apps/talk-web                  │
│  Your React UI, @tezzeract/ui, agent panel           │
└──────────┬─────────────────────────────┬─────────────┘
           │ REST /api/v1/talk/*         │ WSS ws.tezzeract.com
           │ (your envelope)             │ (your events)
┌──────────▼─────────────────────────────▼─────────────┐
│  services/gateway → modules/talk (adapter)           │
│  services/realtime  (bridge + enrich)                │
│    · OrgContext → team ids                           │
│    · union across orgs                               │
│    · stamps organizationId on every event            │
│    · agent tool manifest                             │
└──────────┬─────────────────────────────┬─────────────┘
           │  private network only — no public route   │
┌──────────▼─────────────────────────────▼─────────────┐
│  Mattermost (stock, unmodified)  +  its own Postgres │
└──────────────────────────────────────────────────────┘
```

Two properties to preserve at all costs:

1. **Upstream is never publicly routable.** No ingress except from the adapter. If a client
   can reach Mattermost directly, its ACLs — not ours — become your tenancy boundary.
2. **Upstream is never modified.** Configuration and API only. This is what keeps
   [23 §2](23-open-source-foundations.md)'s AGPL obligations from triggering and makes
   upgrades a version bump.

## 2. Correction: the union view works

[23 §3](23-open-source-foundations.md) treated team-switching as a blocker. That was
imprecise — it is a property of Mattermost's **UI**, not its **data model**:

- A Mattermost user can belong to **many teams** simultaneously.
- Its WebSocket is authenticated **per user** and delivers events for every channel they
  are in, across all teams.

Since we build the UI, the union is the natural result and switching is what we would have
had to add. **Verify in the spike** ([§9](#9-spike-checklist)), but if it holds, Talk on
Mattermost becomes a strong fit rather than a compromised one.

The same question must be asked of Twenty and AppFlowy independently — a per-user event
stream is not guaranteed to exist in either.

## 3. One shared instance, org → team

| Model | Isolation | Union view | Ops cost | Verdict |
|---|---|---|---|---|
| **Shared instance, org = team** | Upstream ACLs | ✅ natural | Flat | ✅ |
| Instance per org | Physical | ❌ N connections | Scales per customer | Only for enterprise isolation contracts |

Shared instance, with `organization → team` (Mattermost) or `organization → workspace`
(Twenty).

⚠️ **This makes upstream ACLs part of your tenancy boundary.** Your four-layer defence
([17 §2](17-security-and-compliance.md)) gains a fifth layer you did not write. Mitigations,
all required:

- The adapter **never** passes a client-supplied team id — it derives team ids from
  `OrgContext` alone.
- The isolation suite ([21 §7](21-ci-cd.md)) gains upstream cases: seed two orgs, assert no
  cross-team read is possible through any adapter endpoint or tool.
- Pin upstream versions; re-run isolation tests on every upgrade before promoting.

## 4. Mapping tables

The adapter owns a schema in **our** Postgres for mapping and adapter-local state. The
upstream keeps its own database entirely — we never read its tables.

```sql
create schema talk;

-- organization → upstream team
create table talk.workspace_links (
  organization_id     uuid primary key references platform.organizations(id) on delete cascade,
  upstream_team_id    text not null unique,
  upstream_team_slug  text not null,
  created_at          timestamptz not null default now()
);

-- user → upstream user, with an encrypted upstream token
create table talk.user_links (
  user_id                uuid primary key references platform.users(id) on delete cascade,
  upstream_user_id       text not null unique,
  access_token_encrypted bytea,
  token_expires_at       timestamptz,
  created_at             timestamptz not null default now()
);

-- membership → team membership, so we can reconcile
create table talk.membership_links (
  membership_id   uuid primary key references platform.memberships(id) on delete cascade,
  upstream_team_id text not null,
  synced_at       timestamptz not null default now()
);
```

`membership_links` is what makes deprovisioning reliable. Without it, removing someone from
an org leaves them in the upstream team — a silent, durable access leak. That is the single
most likely way this integration breaks tenancy.

## 5. Identity provisioning

Tezzeract Identity remains the only source of truth. Upstream accounts are derived.

```
User opens Talk for the first time
  └─ adapter: talk.user_links row? no
       ├─ create upstream user via admin API (no password; SSO or token auth)
       ├─ store mapping + encrypted token
       └─ join upstream teams for every active membership
```

Kept in sync by the event bus ([11 §6](11-system-architecture.md)) — never by a nightly
job alone:

| Platform event | Adapter action |
|---|---|
| `membership.created` | join upstream team |
| `membership.removed` | **leave upstream team** |
| `membership.role_changed` | adjust upstream role |
| `organization.created` | create upstream team |
| `user.suspended` | deactivate upstream user |

Plus a nightly reconciliation job that diffs `platform.memberships` against
`talk.membership_links` and repairs drift. Events can be missed; reconciliation is what
turns that from a security incident into a log line.

## 6. Realtime — the bridge

Revising [23 §8](23-open-source-foundations.md): `services/realtime` does **not** disappear.
Its job shrinks from *building chat* to *bridging and enriching* — much less work, still
necessary.

```
Browser ──WSS──► services/realtime ──WS──► Mattermost
                    │
                    ├─ holds the upstream connection (client never sees an upstream token)
                    ├─ maps team_id → organizationId  ← the org badge on every message
                    ├─ translates event shapes to our envelope
                    └─ filters to the caller's OrgContext
```

Three reasons not to connect the browser straight to Mattermost:

1. The client would need an upstream token — a second credential outside our control.
2. Upstream events carry `team_id`, not `organization_id`. Every message in a union view
   needs the org label, and the mapping lives in our database.
3. Exposing upstream publicly breaks §1.

## 7. What we still own

Building on upstream does not mean building nothing. We own:

- The entire UI and design system
- The union-across-orgs merge: ordering, pagination, unread counts
- Agent tool manifests for every upstream capability
- Org labelling on every record
- Our API envelope, error codes, and hints
- Identity, provisioning, deprovisioning
- The isolation guarantees

**Upstream gives us the hard, commoditised backend** — message storage, delivery
guarantees, search indexing, attachments, CRM object modelling. That is the right split:
we buy the parts where we would not differentiate, and build the parts that are the product.

## 8. Hosting

```
Fly private network (no public ingress)
├── mattermost      + Postgres + R2 (attachments)
├── twenty          + Postgres + Redis
└── appflowy        + Postgres        [pending §9 verification]
```

Each upstream gets its **own database** — never our platform Postgres. They own their
schema and migrations; mixing them into ours would forfeit the clean upgrade path that is
the entire point of staying unmodified.

Budget roughly **+$150–400/month** at early scale for the extra databases and containers.
Cheap against the engineering it replaces — but note it is per-product, not one-off.

## 9. Spike checklist

Run per product, **before** committing. Two weeks each, timeboxed.

- [ ] Deploy stock upstream on the private network
- [ ] **Does a per-user event stream span all teams/workspaces?** ← decides §2
- [ ] Is SSO (OIDC/SAML) available on the licence tier we can afford?
- [ ] Can users be provisioned via API with no password?
- [ ] Admin/service token model — can the adapter act on behalf of a user?
- [ ] API coverage: can our UI do everything their UI does?
- [ ] Rate limits on the admin API — will provisioning throttle at scale?
- [ ] Data export path (carve-out + GDPR)
- [ ] Upstream breaking-change history over the last 12 months
- [ ] Cross-team isolation holds under adversarial adapter calls

**Sequence: Twenty → AppFlowy → Mattermost.** Twenty is the same language as our stack and
has the mildest tenancy conflict — it proves the adapter pattern cheaply. Mattermost last,
because Talk carries the most product risk.

AppFlowy needs one extra question answered first: its primary client is Flutter. Confirm
its API is complete enough to drive a React UI, or drop it and build Tasks natively.

## 10. Delivery impact

Phases 0–3 of [18-delivery-plan.md](18-delivery-plan.md) are unchanged — identity, tenancy,
contracts and the agent are all prerequisites this approach needs *more* of, not less.
Phase 4 becomes:

```
4.0  Licence review (counsel)                        ← Blocks all below
4.1  Adapter framework: mapping tables, provisioning, reconciliation, contract tests
4.2  Spike Twenty  → decide → build CRM adapter
4.3  Spike AppFlowy → decide → build or go native
4.4  Spike Mattermost → decide → build Talk adapter + realtime bridge
```

4.1 is shared infrastructure and pays for itself across all three. Build it once, properly,
before the first adapter — retrofitting reconciliation onto a live integration is how
deprovisioning bugs reach production.
