# Identity, Organizations & Tenancy

> The load-bearing document. Nearly every other design decision depends on getting this
> layer right, and the **current schema contradicts it** — see §7.

---

## 1. One account, everywhere

A person has exactly **one Tezzeract account**, regardless of which property they signed
up on (tezzeract.com, contelli.co, talk.*, any future module domain).

Implication: identity is a **platform-level service**, not a per-module concern. A module
never owns a user table. Contelli standalone authenticates against Tezzeract Identity and
gets a Tezzeract user back; it just doesn't show Tezzeract branding while doing it.

```
             ┌──────────────────────────┐
contelli.co ─┤                          │
tezzeract.com┤   Tezzeract Identity     ├── one user record
talk.*      ─┤   (SSO / OIDC provider)  │
             └──────────────────────────┘
```

**Open decision:** whether Supabase Auth remains the identity provider once cross-domain
SSO is required. Supabase Auth is per-project and cookie-scoped to one domain; serving
three consumer domains from it means either (a) all module frontends authenticate against
one Supabase project via a hosted-login redirect flow, or (b) Tezzeract runs its own OIDC
layer in front. Not yet decided — flagged in [07-open-questions.md](07-open-questions.md).

## 2. The core entities

```
User  ──< Membership >──  Organization
 │                             │
 │                             └── owns: workspaces, connections, threads,
 │                                        tasks, content — all org-scoped data
 └── has: platform_standing (Tezzeract-side role, one per user)
```

### User
The person. Global. Carries:
- identity fields (email, name, avatar)
- **`platform_standing`** — one of the five Tezzeract-side levels
- talent profile (optional — a user may or may not be talent)

### Organization
The tenant. Owns all business data. Carries name, slug, industry, size, subscription.

### Membership — *the join table that does not exist yet*
`(user_id, organization_id, org_role, source, status)`

- **`org_role`** — Admin | Manager | Staff
- **`source`** — how they got here: `org_native` (works for the customer) vs
  `tezzeract_assigned` (Tezzeract staff/talent placed into this org)
- A user has **N memberships**. This is the whole point.

## 3. Two orthogonal role axes

Do not collapse these into one enum. They answer different questions.

| Axis | Stored on | Answers |
|---|---|---|
| **Platform standing** | `User` | How much does Tezzeract trust this person, globally? |
| **Org role** | `Membership` | What may they do *inside this one organization*? |

**Platform standing** (descending): `tezzeract_admin`, `tezzeract_internal`,
`tezzeract_associate`, `tezzeract_verified`, `talent_unverified`.

**Org role**: `org_admin`, `org_manager`, `org_staff`.

Effective permission = a function of **both**. A `tezzeract_internal` user holding
`org_staff` at ABC gets staff-level data access at ABC, plus whatever platform-level
support capabilities their standing grants. `tezzeract_admin` is the only standing that
may imply cross-org reach, and that reach must be **audited on every use**.

## 4. Union view, not context switching

> A user assigned to two organizations sees both organizations' data at once. They do
> not swap. Organization is a label on the data, not a mode the user is in.

This is the defining UX decision and it drives the data layer. Concretely:

- **Talk**: thread list = union of threads across all the user's orgs. Each thread
  carries a visible org badge.
- **Tasks**: one overview, all pending tasks, each labelled with its origin org.
- **Contelli**: accounts and calendars from all orgs the user belongs to, grouped.

### What this demands of every query

Every org-scoped read is `WHERE organization_id IN (<user's org ids>)`, **never**
`WHERE organization_id = <the current one>`. There is no "current org" in session state.

The corollary is that **every org-scoped record must carry `organization_id`** and every
API response must return it, so the UI can render the origin badge. An org-scoped entity
without an org label on the wire is a bug.

### Where a single org *is* required
Writes. Creating a task, sending a message, scheduling a post — these need an explicit
target org, chosen by the user (or inferred by the agent and then confirmed). The rule:
**reads are union, writes are explicit.**

## 5. AI isolation — the compliance boundary

The union-view model makes this harder than normal multi-tenancy, because a single agent
turn serves a human who legitimately straddles orgs. Prompt instructions are not a
control. Enforce structurally:

1. **Every agent turn is bound to exactly one `organization_id`.** Even though the human
   sees a union, the agent operates in one org at a time. Ambiguous requests get a
   disambiguation prompt, not a guess.
2. **Retrieval is filtered before the model sees anything.** Tool implementations and
   vector search apply the org filter at the query layer. The model is never handed
   multi-org context and asked to be careful.
3. **Per-org memory and embedding namespaces.** No shared vector index across orgs.
4. **Conversation threads are org-scoped.** An agent thread cannot change its org
   mid-conversation; switching starts a new thread.
5. **Tool calls carry the org in the invocation envelope**, server-side, from the
   authenticated session — never from a model-supplied argument. A model that can name
   its own `organization_id` can exfiltrate across tenants.
6. **Audit log** on every cross-org-capable action (i.e. anything a `tezzeract_admin`
   does).

Design target: GDPR-shaped obligations (data locality, right to erasure per org, export
per org, processor agreements). Erasure must be executable as "delete everything for
org X" — which is only possible if `organization_id` is on every record.

## 6. Row-level security

Supabase RLS is the enforcement backstop, and it should express exactly the model above:

```sql
-- shape, not final
create policy org_scoped_read on <table> for select
using (
  organization_id in (
    select organization_id from memberships
    where user_id = auth.uid() and status = 'active'
  )
);
```

RLS is the floor, not the ceiling — the API layer still filters, so that a bug in one
layer is not a breach.

## 7. ⚠️ How the current code contradicts this

Read this before writing any migration.

| Vision | Today (`main`) |
|---|---|
| `Membership` join table, N orgs per user | **No membership table.** `organizations.user_id` is a direct FK — one org per user, enforced in code |
| Reads are a union across orgs | `organization.controller.ts` does `.eq('user_id', userId).maybeSingle()` |
| Two role axes | **No roles exist** in schema or code |
| Org owns integrations | `platform_connections.user_id → auth.users` — Contelli OAuth tokens belong to a *user*; if they leave, the org loses its connections |
| Every org-scoped record carries `organization_id` | `scheduled_posts` and `content_suggestions` do. `platform_connections` does not |
| Tenant boundary enforced | `/talent` and `/social` are **unauthenticated routes** in `App.tsx`; `optionalAuth` is applied globally in `server.ts` |

`ARCHITECTURE.md` at repo root describes a bespoke JWT access/refresh scheme. **That is
stale** — the code uses Supabase Auth (`supabase.middleware.ts`). Treat that document as
historical.

### Migration sketch (not yet executed)

1. Create `memberships (user_id, organization_id, org_role, source, status)`.
2. Backfill: for each existing `organizations` row, insert a membership with
   `org_role = 'org_admin'`, `source = 'org_native'`.
3. Add `platform_standing` to the user profile table.
4. Drop `organizations.user_id` **only after** all readers move to `memberships`.
5. Re-scope `platform_connections` to `organization_id`, backfilling via the owner's
   membership.
6. Replace every `.eq('user_id', ...)` org lookup with a membership join.
7. Add RLS policies; move `/talent` and `/social` behind auth.

Step 4 is the point of no return — sequence it deliberately.
