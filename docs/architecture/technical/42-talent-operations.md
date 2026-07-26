# Talent Operations — The Domain Model

> The talent module is the end-to-end revenue path. Its business rules are not incidental
> logic to scatter through controllers — they are **domain invariants**, and modelling them
> properly is what stops the ops team having to police them by hand.

---

## 1. The rules, as stated

1. **Every team must include at least one Tezzeract internal member.**
2. **The first call is scheduled with an account manager**, not with the talent.
3. Talent profiles require approval before appearing publicly.
4. Team size determines the subscription tier ($3k/3 · $5k/5 · $10k+).

Rules 1 and 2 are the ones with teeth: they encode how Tezzeract delivers quality and keeps
a relationship owner on every account. They must be enforced by the system, because a rule
enforced by ops memory fails on the day everyone is busy.

## 2. Lifecycle

```
Requirement ──► Team proposed ──► Team accepted ──► Call scheduled
                                                          │
                                                          ▼
   Engagement active ◄── Subscription active ◄── Onboarding
        │
        ├──► member swapped        → re-validate invariants
        ├──► team resized          → subscription proration
        └──► ended                 → 🔑 Outcome captured
```

The final transition is the one that feeds [32-talent-graph.md](32-talent-graph.md). It is
also the one most likely to be skipped when an engagement ends messily — so make it a
required field on closure, not an optional follow-up.

## 3. Schema

```sql
create schema talent;

create type talent.team_status as enum (
  'proposed', 'accepted', 'call_scheduled', 'active', 'paused', 'ended'
);

create table talent.teams (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references platform.organizations(id) on delete cascade,
  name                text,
  status              talent.team_status not null default 'proposed',
  requirement_summary text,
  account_manager_id  uuid references platform.users(id),   -- rule 2
  proposed_at         timestamptz not null default now(),
  accepted_at         timestamptz,
  activated_at        timestamptz,
  ended_at            timestamptz,
  end_reason          text
);

create type talent.member_kind as enum ('internal', 'associate', 'verified', 'unverified');

create table talent.team_members (
  team_id     uuid not null references talent.teams(id) on delete cascade,
  talent_id   uuid not null references talent.talents(id),
  user_id     uuid references platform.users(id),
  role_title  text not null,
  kind        talent.member_kind not null,     -- derived from platform_standing
  rate_monthly numeric(10,2),
  joined_at   date not null default current_date,
  left_at     date,
  primary key (team_id, talent_id)
);
```

`kind` is denormalised from `platform.users.platform_standing` deliberately: rule 1 must be
checkable in a single query, and a team member's standing at the time of composition is the
fact that matters, not their standing today.

## 4. Invariants, enforced in the database

Application-level checks get bypassed — by an admin script, a data fix, or a second code
path written in a hurry. Rule 1 protects revenue quality, so it belongs in Postgres.

```sql
-- Rule 1: at least one internal member on any team past 'proposed'
create or replace function talent.assert_internal_member() returns trigger
language plpgsql as $$
declare n int; st talent.team_status;
begin
  select status into st from talent.teams
   where id = coalesce(new.team_id, old.team_id);

  if st = 'proposed' then return coalesce(new, old); end if;   -- drafts may be incomplete

  select count(*) into n from talent.team_members
   where team_id = coalesce(new.team_id, old.team_id)
     and kind = 'internal' and left_at is null;

  if n < 1 then
    raise exception 'TEAM_REQUIRES_INTERNAL_MEMBER';
  end if;
  return coalesce(new, old);
end $$;

create constraint trigger team_internal_member
  after insert or update or delete on talent.team_members
  deferrable initially deferred
  for each row execute function talent.assert_internal_member();
```

`deferrable initially deferred` matters: it lets a swap (remove + add, in one transaction)
pass, while still rejecting a committed state that violates the rule. Without it, every
member swap would have to be ordered add-then-remove.

```sql
-- Rule 2: an account manager is required before a call can be scheduled
alter table talent.teams add constraint am_required_from_call
  check (status in ('proposed','accepted') or account_manager_id is not null);
```

## 5. Composition, with constraints

Team assembly ([32 §4](32-talent-graph.md)) gains hard constraints alongside its soft
objective:

```ts
export const TEAM_RULES = {
  minInternalMembers: 1,          // rule 1
  requiresAccountManager: true,   // rule 2
  tiers: [
    { size: 3, plan: 'starter',    priceMonthly: 3000 },
    { size: 5, plan: 'growth',     priceMonthly: 5000 },
    { size: null, plan: 'enterprise', priceMonthly: null },  // quoted
  ],
} as const;
```

Composition is then: satisfy hard constraints first, optimise the soft objective within
what remains. Surfacing *why* a constraint bound ("we've included Priya as your Tezzeract
lead") turns a rule into a selling point rather than a limitation the client discovers
later.

## 6. Account manager assignment

Rule 2 needs an owner chosen before the first call. Assignment inputs, in priority order:

1. Existing relationship — has this AM worked with this org before?
2. Domain fit — industry or technology familiarity
3. Load balance — active engagements per AM
4. Timezone overlap with the client

Assignment writes a `platform.memberships` row for the AM in the client's organization with
`source = 'tezzeract_assigned'`. That is the whole point of the additive-membership model:
**an AM covering four clients sees all four in one view without switching**, and their
access is expressed by the same mechanism as everyone else's — so it is auditable and
revocable by the same machinery.

## 7. Talent approval workflow

From the structural diagram: submission → status check → approval gate → edit.

```
submitted ──► under_review ──► approved   → public profile live, standing → verified
                    │
                    └────────► rejected   → feedback, resubmission allowed
```

Approval promotes `platform_standing` from `talent_unverified` to `tezzeract_verified`.
Only `tezzeract_internal` or above may approve, and every decision is written to
`audit_log` — this is an employment-adjacent decision and will eventually be questioned.

## 8. Billing coupling

Team size drives the subscription, so the talent module and billing are genuinely coupled.
Keep the coupling explicit and one-directional:

```
team_members changed
   └─► domain event `team.size_changed`
        └─► billing consumer → Stripe subscription update (prorated)
```

Via the event spine, not a direct call. Billing must never be able to block a team change —
a failed Stripe call should raise an alert, not prevent an ops action.

## 9. Outcome capture — the moat's entry point

```sql
-- on transition to 'ended', per member
insert into graph.engagement_outcomes
  (organization_id, team_id, talent_id, started_at, ended_at,
   end_reason, client_rating, renewed, rehired)
values (...);
```

Make `end_reason` and `client_rating` **required** to close an engagement. An engagement
closed without them is a lost training label, and at ~500 labels needed, each one counts.

The ops team should understand *why* they are filling this in — that it is the asset the
company's valuation rests on. Rules people understand get followed.

## 10. Agent tools

```ts
'talent.parse_requirement'      // NL → structured spec
'talent.propose_team'           // spec → teams satisfying TEAM_RULES
'talent.swap_member'            // re-optimise, re-validate invariants
'talent.assign_account_manager'
'talent.schedule_first_call'    // Cal.com
'talent.record_outcome'         // 🔑 close the loop
```

Every one respects the invariants in §4 — the agent cannot propose an invalid team, because
the constraint lives below it in the database rather than in a prompt.
