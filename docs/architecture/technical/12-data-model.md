# Data Model — Platform Core

> Executable DDL for the `platform` schema. This is the foundation every module builds
> on, and the part the current database most directly contradicts.

---

## 1. Enums

```sql
create schema if not exists platform;
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Tezzeract-side standing: a property of the person, one per user.
create type platform.standing as enum (
  'tezzeract_admin',
  'tezzeract_internal',
  'tezzeract_associate',   -- external, long-term
  'tezzeract_verified',
  'talent_unverified'
);

-- Org-side role: a property of the membership, one per (user, org).
create type platform.org_role as enum ('org_admin', 'org_manager', 'org_staff');

create type platform.membership_source as enum ('org_native', 'tezzeract_assigned');
create type platform.lifecycle as enum ('active', 'invited', 'suspended', 'removed');
```

Two enums, deliberately not one. `standing` answers "how far does Tezzeract trust this
person globally"; `org_role` answers "what may they do inside this one org". Collapsing
them loses the case of a Tezzeract Internal member holding Staff role at a client.

## 2. Users

```sql
create table platform.users (
  id                uuid primary key default gen_random_uuid(),
  auth_user_id      uuid unique not null,          -- → Supabase auth.users(id)
  email             citext unique not null,
  full_name         text,
  avatar_url        text,
  platform_standing platform.standing not null default 'talent_unverified',
  status            platform.lifecycle not null default 'active',
  last_seen_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on platform.users (auth_user_id);
create index on platform.users (platform_standing) where status = 'active';
```

`auth_user_id` is the seam from [ADR-005](10-decisions.md#adr-005): swapping the identity
provider rewrites one column, not the whole model.

## 3. Organizations

```sql
create table platform.organizations (
  id           uuid primary key default gen_random_uuid(),
  slug         citext unique not null,
  name         text not null,
  industry     text,
  website      text,
  description  text,
  based_in     text,
  company_size text,
  -- Tezzeract itself is an organization (resolves Q3). Cross-org staff access
  -- becomes a membership property rather than a special code path — which means
  -- it is auditable by the same mechanism as everything else.
  is_internal  boolean not null default false,
  data_region  text not null default 'eu',
  status       platform.lifecycle not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index one_internal_org
  on platform.organizations ((true)) where is_internal;
```

Note what is **absent**: no `user_id`. The current schema's
`organizations.user_id` is the single biggest blocker in the codebase — it hardcodes one
org per user.

## 4. Memberships — the table that changes everything

```sql
create table platform.memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references platform.users(id) on delete cascade,
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  org_role        platform.org_role not null default 'org_staff',
  source          platform.membership_source not null default 'org_native',
  status          platform.lifecycle not null default 'active',
  invited_by      uuid references platform.users(id),
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index on platform.memberships (user_id)         where status = 'active';
create index on platform.memberships (organization_id) where status = 'active';
```

A user has N memberships. Every org-scoped read resolves through this table. There is no
"current organization" column anywhere in the system — introducing one would break the
union-view model.

## 5. Entitlements & subscriptions

```sql
create table platform.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references platform.organizations(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  plan                   text not null,        -- 'contelli_standalone' | 'tezzeract_full' | …
  status                 text not null,        -- mirrors Stripe
  seats                  int  not null default 1,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Derived from Stripe webhooks. Authorization reads THIS, never Stripe (ADR-014).
create table platform.entitlements (
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  module_id       text not null,               -- 'talent' | 'contelli' | 'talk'
  granted_at      timestamptz not null default now(),
  expires_at      timestamptz,
  source          text not null default 'subscription',
  primary key (organization_id, module_id)
);
```

This is what makes standalone sales work. An org that bought Contelli on contelli.co
holds one entitlement; upgrading to full Tezzeract adds rows — **same org, same users, no
data migration**.

## 6. Audit log

```sql
create table platform.audit_log (
  id              bigserial primary key,
  occurred_at     timestamptz not null default now(),
  organization_id uuid,
  actor_user_id   uuid,
  actor_standing  platform.standing,
  action          text not null,               -- 'talent.create' | 'agent.tool_call'
  resource_type   text,
  resource_id     text,
  cross_org       boolean not null default false,
  trace_id        text,
  metadata        jsonb not null default '{}'
) partition by range (occurred_at);
```

Append-only; no update or delete grant to application roles. `cross_org` flags every
action where a Tezzeract-standing user reached outside their own memberships — that
column is the first thing an auditor will ask for.

## 7. Agent threads

```sql
create table platform.agent_threads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references platform.users(id) on delete cascade,
  -- Immutable. A thread belongs to exactly one org for its whole life.
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  title           text,
  active_module   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function platform.freeze_thread_org() returns trigger
language plpgsql as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'agent_threads.organization_id is immutable';
  end if;
  return new;
end $$;

create trigger freeze_thread_org before update on platform.agent_threads
  for each row execute function platform.freeze_thread_org();
```

The trigger is deliberate. Thread-org immutability is a compliance control
([03 §5](../03-agent-layer.md)), and controls that live only in application code
eventually get bypassed by a migration script.

## 8. RLS — the backstop

```sql
create or replace function platform.current_user_id() returns uuid
language sql stable security definer set search_path = platform, public as $$
  select id from platform.users where auth_user_id = auth.uid() and status = 'active'
$$;

create or replace function platform.member_org_ids() returns setof uuid
language sql stable security definer set search_path = platform, public as $$
  select organization_id from platform.memberships
  where user_id = platform.current_user_id() and status = 'active'
$$;
```

Apply to every tenant-scoped table in every schema:

```sql
alter table contelli.scheduled_posts enable row level security;

create policy tenant_read on contelli.scheduled_posts for select
  using (organization_id in (select platform.member_org_ids()));

create policy tenant_write on contelli.scheduled_posts for all
  using      (organization_id in (select platform.member_org_ids()))
  with check (organization_id in (select platform.member_org_ids()));
```

RLS is the floor, not the ceiling. The service layer filters independently
([ADR-007](10-decisions.md#adr-007)) so a bug in one layer is not a breach.

## 8b. "But the products are sold separately — why one database?"

The most common objection to [ADR-003](10-decisions.md#adr-003). It conflates two
independent axes: **product boundary** (commercial) and **deployment boundary**
(operational). They do not have to move together.

### What independent sellability actually requires

| Requirement | Provided by |
|---|---|
| Own domain + shell | `apps/contelli-web` |
| Own billing | Stripe plan → `platform.entitlements` row |
| Own code, zero coupling | `modules/contelli` + CI-enforced import rules |
| Own API namespace | `/api/v1/contelli/*` |
| Own data ownership | the `contelli` schema |
| **Own database instance** | ❌ **not required** |

A Contelli-only customer signs up on contelli.co, holds one entitlement, and never sees
another module. Their rows live in the `contelli` schema of the shared instance. They
cannot perceive the difference, and it does not constrain what we charge them.

### Why splitting now would cost us

1. **Identity is shared by every product.** `OrgContext` resolves from
   `platform.memberships` on *every* request. A separate Contelli database turns a
   ~0.8ms cached lookup into a permanent cross-database round trip on 100% of traffic.
2. **Cross-module work becomes a saga.** The agent creating a Talk task from a Contelli
   insight is one transaction today. Across databases it needs compensating actions —
   adopting the hardest problem in distributed systems before we have the problem it
   solves.
3. **Ops multiply.** Four instances, four backup regimes, four PITR windows, four
   connection budgets — real capacity spent on something no customer can perceive.

### The property that matters is extractability

**What makes a database splittable later is not being separate today — it is that nothing
else queries its tables.** Schema-per-module plus the no-cross-module-query rule gives
exactly that:

```
1. pg_dump the contelli schema → new instance
2. repoint the Contelli module's connection string
3. done — no caller changes, because nothing else read those tables
```

A weekend, versus a quarter to disentangle shared tables.

### Named triggers to split

- An enterprise contract requiring **physical** isolation → dedicated deployment
- **Data residency** conflict (e.g. one module EU-only, rest US)
- One module needing genuinely different hardware
- Separate teams whose migration cadences collide

### Not to be confused with per-tenant separation

This is database-per-**product**, not per-**customer**. A standalone Contelli customer is
an ordinary organization holding one entitlement, isolated by `organization_id` + RLS
([ADR-004](10-decisions.md#adr-004)). That is what keeps the upgrade path free: buying
full Tezzeract adds entitlement rows — same org, same users, **zero data migration**.
Per-product databases would turn that upgrade into a migration project, which is a
commercial cost as much as a technical one.

## 9. Conventions for module schemas

Every tenant-scoped table, without exception:

1. `organization_id uuid not null references platform.organizations(id) on delete cascade`
2. an index on `organization_id`
3. RLS enabled with the policies above
4. `created_at` / `updated_at`
5. soft delete (`deleted_at`) where recovery matters

Rule (1) is what makes GDPR erasure executable as a single cascade per org. A tenant-scoped
table without `organization_id` is a defect, not a style choice.

## 10. Migration from today

Ordered. Step 5 is irreversible — sequence it deliberately.

```
1. Create platform schema, enums, users, organizations, memberships (additive, no reads change)
2. Backfill:
     platform.users        ← auth.users
     platform.organizations← public.organizations (drop user_id column later)
     platform.memberships  ← one row per existing org, org_admin, org_native
3. Create the Tezzeract internal org; add memberships for staff
4. Dual-read: services resolve orgs via memberships, falling back to organizations.user_id
5. ⚠️ Drop organizations.user_id  — point of no return
6. Re-scope contelli.platform_connections from user_id to organization_id
     (backfill via the owning user's single membership — only correct while 1:1 still holds,
      so this MUST run before any user gains a second membership)
7. Add organization_id + RLS to every remaining tenant table
8. Close the public /talent and /social routes
```

Step 6's constraint is easy to miss and expensive to discover late: the backfill is only
unambiguous while every user still has exactly one org.
