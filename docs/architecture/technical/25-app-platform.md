# The App Platform

> How small apps — attendance, room booking, and whatever comes next — join the ecosystem,
> and how that generalises into an app store. Extends the module contract in
> [15 §1](15-api-and-modules.md).

---

## 1. The problem with one module tier

The contract so far assumes modules are first-party TypeScript packages compiled at build
time ([ADR-015](10-decisions.md#adr-015)). That is correct for Talent, Contelli, Talk and
CRM — four large, deeply-integrated products.

It does not survive thirty small apps, and it certainly does not survive third parties.
A single tier forces one trust level and one loading mechanism onto workloads that need
neither.

## 2. Three tiers, one contract

**Every tier implements the same `TezzeractModule` manifest.** What differs is how it loads
and how far it is trusted — not what it is.

| | Tier 1 — Core | Tier 2 — Micro-app | Tier 3 — Third-party |
|---|---|---|---|
| Examples | Talent, Contelli, Talk, CRM | Attendance, room booking | Partner/community apps |
| Author | Product team | You, quickly | Anyone |
| Loading | Build-time package | Build-time package | Sandboxed iframe |
| Trust | Full | Full | **None — scoped** |
| Data | Own schema | Own schema (generated) | Own schema, quota'd |
| API access | Direct | Direct via SDK | OAuth-scoped, rate-limited |
| Review | Code review | Code review | Store review |
| Build time | Months | **Hours** | — |

That single-contract property is what makes an app "always addable": the shell renders any
tier identically, and an app can be promoted from Tier 2 to Tier 1 without a rewrite.

## 3. Tier 2 — the part to build now

Your attendance and room-booking tools are Tier 2. The measure of success is blunt:

> **If building a micro-app takes more than a day, the app platform has failed** — and no
> third party will ever build one either.

### The scaffold

```bash
pnpm tz create-app attendance
```

Generates a working, installable app:

```
modules/attendance/
├── manifest.ts          id, nav entry, entitlement, brand
├── schema.sql           org-scoped table + RLS, pre-wired
├── client/Page.tsx      renders in the viewport, uses @tezzeract/ui
├── tools.ts             agent tools
└── contracts.ts         Zod — generates API, client, tool defs
```

### The SDK does the tedious parts

```ts
import { useOrgDb, useTezzeract, defineTool } from '@tezzeract/app-sdk';

export function AttendancePage() {
  const { user, orgs } = useTezzeract();
  const db = useOrgDb();                        // already org-scoped
  const records = db.attendance.list();         // union across orgs, labelled
  return <DataTable rows={records} />;          // OrgBadge included
}
```

An app author never writes tenancy code. `useOrgDb()` is bound to `OrgContext`
([ADR-007](10-decisions.md#adr-007)); the org filter is not something they can forget,
because they never write it. **Correctness by construction is the only kind that survives
being vibe-coded at speed.**

### What the app gets free

Identity and SSO · org scoping and RLS · union-across-orgs reads · the design system ·
agent tool registration · entitlement gating · audit logging · generated API client ·
preview deploys.

### What the app author writes

Their schema, their UI, their tools. That is the whole job.

## 4. Agent integration is the differentiator

A Zoho or Odoo app is a UI you click. A Tezzeract app declares tools, so installing it
**extends the agent**:

```ts
export const markAttendance = defineTool({
  name: 'attendance.mark',
  summary: 'Mark a team member present or absent for a given date.',
  scopes: ['attendance:write'],
  input: z.object({
    userId: z.string(),
    date: z.string().date(),
    status: z.enum(['present', 'absent', 'remote']),
  }),
  handler: (input, ctx) => ctx.db.attendance.upsert(input),
});
```

Install the app and the agent can immediately mark attendance, in conversation, from any
module. `organizationId` is injected server-side and remains absent from the schema
([14 §3](14-agent-runtime.md)) — a third-party app author cannot reach another tenant
because the parameter does not exist for them to set.

This is the single strongest reason to build the app platform on the agent contract rather
than bolting it on afterwards.

## 5. The app store — mostly already built

Install/uninstall maps directly onto `platform.entitlements`
([12 §5](12-data-model.md)):

```sql
-- install
insert into platform.entitlements (organization_id, module_id, source)
values ($1, 'attendance', 'app_store');

-- uninstall
delete from platform.entitlements where organization_id = $1 and module_id = 'attendance';
```

The rail already renders `entitlements ∩ registered modules`
([01 §7](../01-platform-topology.md)). The remaining work is a registry and the commercial
wrapper:

```sql
create table platform.app_registry (
  id            text primary key,        -- 'attendance'
  name          text not null,
  publisher_org uuid references platform.organizations(id),
  tier          int  not null,           -- 1 | 2 | 3
  scopes        text[] not null,         -- what it requests at install
  pricing_model text,                    -- free | flat | per_seat
  stripe_price_id text,
  status        text not null default 'draft',
  version       text not null
);
```

**Uninstall must have an explicit data policy**: retain for 30 days, then purge. Reinstalling
inside the window restores; after it, the data is gone. Decide this before the first
uninstall, not after a customer asks where their records went.

## 6. Tier 3 — design the seams, build later

Third-party apps are where security gets serious: arbitrary code with access to tenant data
and the agent.

```
┌─ Shell ─────────────────────────────────────┐
│ <iframe sandbox="allow-scripts"             │
│         src="https://apps.tezzeract.com/…"> │
│   third-party app                           │
│ </iframe>                                   │
│        ▲ typed postMessage bridge           │
│        │ · no ambient credentials           │
│        │ · scoped, short-lived tokens only  │
└────────┴────────────────────────────────────┘
```

Non-negotiables when this is built:

1. **Iframe sandbox**, separate origin (`apps.tezzeract.com`), strict CSP. Never in the
   main bundle — a Tier 3 app must not be able to read your session.
2. **Explicit scopes at install**, shown to the org admin, granted per app.
3. **Their backend, our proxy.** All API access goes through the gateway with a scoped
   token, rate-limited and audited.
4. **Store review** before publication.
5. **Kill switch** — revoke an app across all orgs in one action.

Build this only when there is genuine third-party demand. But keeping Tiers 1 and 2 on the
same manifest today means Tier 3 is an additive loader, not a redesign.

## 7. SDK versioning

Thirty apps depending on `@tezzeract/app-sdk` means an SDK breaking change breaks thirty
apps. From the first release:

- Strict semver; breaking changes only in majors.
- Two majors supported concurrently, 6-month deprecation, `Sunset`-style warnings in the
  console and CI.
- Contract tests run every registered app's tool manifest against the current SDK on each
  release.

For Tier 3 this stops being politeness and becomes a public API commitment.

## 8. CI impact

Micro-apps live in the monorepo as ordinary packages. Turborepo's affected-detection means
`apps/attendance` only builds when it changes — thirty apps do not slow a Contelli PR.

Two guardrails worth setting early:

- A micro-app failing its own tests must not block another module's deploy. Independent
  pipelines per target, already the shape in [21 §10](21-ci-cd.md).
- The four global guards ([21 §5](21-ci-cd.md)) still apply to every app. Vibe-coded is
  not exempt from `gitleaks` or the isolation suite — if anything the reverse.

## 8b. Hosting economics — "wouldn't separate free hosting be cheaper?"

A recurring question once the app count grows. It rests on a false premise worth naming:
**a monorepo does not mean one deployment** ([21 §1](21-ci-cd.md) — one repo already
produces ~10 independently deployed targets). Repo strategy and deployment topology are
orthogonal; you could deploy every micro-app to its own host from this monorepo.

The real question is whether a micro-app should be a **separate service at all**.

### What a Tier 2 app actually costs in-process

| Piece | Where | Marginal hosting cost |
|---|---|---|
| React page | lazy chunk in the existing bundle | **$0** — same CDN |
| API routes | mounted in the existing gateway | **$0** — existing headroom |
| Data | a schema in the existing Postgres | storage only |

Near-zero until it carries real traffic. Against that:

| | 20 apps in-process | 20 separate services |
|---|---|---|
| Hosting | ~$0 marginal | $100+/mo floor |
| Databases · CI · secrets · TLS · monitoring | 1 each | **20 each** |

**Per-service overhead is roughly constant regardless of service size.** That is why many
small services cost more, not less — the cost argument runs opposite to intuition.

### Three traps in free tiers

1. **Spin-down.** Cold starts of 10–30s. For a tool opened twice a day, that is the only
   experience anyone will have of it.
2. **No private networking.** The app must reach Postgres — which on a free tier means
   exposing the production database publicly, discarding the isolation property required
   of every other component ([24 §1](24-headless-integration.md)).
3. **Free tiers are loss leaders.** They get withdrawn. Architecture that depends on one
   gets rewritten on someone else's timeline.

### The dominant cost is integration, not hosting

A standalone app must implement for itself: SSO against Tezzeract Identity, correct org
scoping, the design system, agent tool registration, and deprovisioning. That is roughly a
week per app, plus permanent tenancy risk in the org-scoping code. The scaffold in §3
inherits all of it.

**Saving $5/month by spending a week per app — and adding a place where tenant isolation
can be got wrong — is the wrong trade.**

### When separate hosting is right

| Case | Why |
|---|---|
| **Tier 3 third-party** | Mandatory — untrusted code must be sandboxed and separate |
| Different runtime (Python ML, Go worker) | Does not fit the Node process |
| Genuinely different resource profile | Heavy CPU or long jobs should not share the gateway |
| **Throwaway spikes** | Validate before porting in — a good use, encouraged |

## 9. Recommended sequence

| When | Do |
|---|---|
| Phase 2 | Ship `@tezzeract/app-sdk` + `tz create-app` scaffold |
| Phase 2 | Build **attendance** with it — measure the real hours |
| Phase 3 | Build **room booking**; refine the SDK on the second data point |
| Phase 4 | `app_registry`, install/uninstall UI, per-app billing |
| Later | Tier 3 sandbox — only on real third-party demand |

**Dogfood before opening up.** The honest test of the app platform is how long *your* second
micro-app takes. If it is a day, third parties will build. If it is a week, the store will
be empty regardless of how good the marketplace UI is.

## 10. What this does not change

- The module contract ([15 §1](15-api-and-modules.md)) — apps implement the same manifest.
- Tenancy — every app is org-scoped by construction; there is no opt-out.
- The agent contract — apps extend the tool catalog through the same registry.
- Carve-out ([20](20-carve-out-readiness.md)) — a micro-app is a package, extractable like
  any other.

The app platform is not a new architecture. It is the existing module contract with two
extra loading mechanisms and a commercial wrapper — which is precisely why it is affordable.
