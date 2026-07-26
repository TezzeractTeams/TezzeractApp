# Platform Topology — Modules as Independent Apps

> How the codebase must be shaped so that each module is independently sellable while
> still loading in-place inside TezzeractApp.

---

## 1. The requirement

Two front doors, one implementation:

```
contelli.co                      app.tezzeract.com
   │                                    │
   │ standalone shell                   │ Tezzeract shell
   │ (Contelli brand, own billing)      │ (left rail + persistent agent)
   └──────────┬─────────────────────────┘
              │
        @tezzeract/contelli     ← the SAME module package
```

If Contelli can only render inside TezzeractApp, the standalone business is dead. If
Contelli is forked into two codebases, they diverge within a quarter. So: **one module
package, two shells.**

## 2. Target repository shape

Today the repo is `client/ + server/ + shared/`, with modules as folders under
`client/src/features/`. That cannot satisfy independent deployability. Target:

```
packages/
  ui/                    @tezzeract/ui          — design system primitives
  identity/              @tezzeract/identity    — SSO client, session, membership hooks
  agent-sdk/             @tezzeract/agent-sdk   — tool registration + agent chat client
  module-host/           @tezzeract/module-host — the contract a module implements

modules/
  talent/                @tezzeract/talent      — client + server + tool manifest
  contelli/              @tezzeract/contelli
  talk/                  @tezzeract/talk

apps/
  tezzeract-app/         the mega-shell (left rail, persistent agent, module loader)
  contelli-web/          standalone Contelli shell
  talk-web/              standalone Talk shell

services/
  gateway/               API gateway + agent orchestrator
```

Each `modules/*` package is self-contained: its own routes, its own server handlers, its
own tool manifest, its own DB migrations. It depends on `packages/*` only — **never on
another module, and never on a shell.**

## 3. The module contract

A module exports a single manifest. Both shells consume it identically:

```ts
export interface TezzeractModule {
  id: string;                      // 'contelli'
  displayName: string;             // 'Contelli'
  brand: BrandTokens;              // overlays the shared design system
  routes: RouteDefinition[];       // mounted under the shell's router
  navigation: NavItem[];           // what the left rail renders
  tools: AgentToolManifest;        // what the agent may call — see 03-agent-layer
  entitlement: string;             // subscription key gating access
  requiredScopes: Scope[];         // org-role requirements
}
```

The shell knows nothing about Contelli beyond this interface. Adding a module = adding a
package and registering its manifest. **No shell code changes to add a module** — if
adding a module requires editing the shell, the contract has leaked.

## 4. Loading strategy

Per the screenshot: the left rail lists modules; selecting one loads that module's app in
the main area while the agent chat panel stays mounted.

```
┌────┬──────────────┬────────────────────────────────┐
│Rail│ Agent chat   │  Module viewport               │
│    │ (persistent, │  (Talent | Contelli | Talk)    │
│ T  │  never       │                                │
│ C  │  unmounts)   │  ← module manifest routes here │
│ 💬 │              │                                │
└────┴──────────────┴────────────────────────────────┘
```

**Start with build-time composition** — modules as workspace packages, route-level lazy
`import()`, one deployed bundle per shell. This is simple, type-safe end-to-end, and
sufficient for a long time.

**Do not reach for Module Federation / micro-frontends yet.** It buys independent runtime
deploys at the cost of version-skew debugging, duplicated React runtimes, and a much
harder shared-state story with the agent panel. Revisit only when independent per-module
deploy cadence becomes a real bottleneck — i.e. when separate teams own separate modules
and are blocked on each other's release trains. Record the trigger, not the date.

The agent panel must **never unmount** on module switch — it holds conversation state
that spans modules. That means the panel lives in the shell layout above the router
outlet, and module switching only swaps the outlet.

## 5. Server-side topology

Modules ship server handlers, but do not each become a microservice on day one.

**Now:** one gateway process mounts each module's router under its namespace
(`/api/v1/contelli/*`). Modules are logically separated, physically co-deployed.

**Later:** any module can be lifted into its own service because its handlers, migrations
and manifest already travel together. The gateway keeps the URL shape stable, so the
extraction is invisible to clients.

The gateway owns the things that must not be per-module: authn, org-scope resolution,
rate limiting, audit logging, and the agent tool dispatcher.

## 6. Data ownership

Each module owns its tables and its migrations. Cross-module reads go **through the
owning module's API or tool interface, never by querying its tables directly.** This is
what preserves the option to extract a module into its own database later.

Shared, platform-owned tables (owned by `services/gateway`, not any module):
`users`, `organizations`, `memberships`, `subscriptions`, `entitlements`, `audit_log`.

## 7. Entitlements

A module renders only if the org holds its entitlement. This is what makes standalone
sales work:

| Org bought | Entitlements |
|---|---|
| Contelli standalone on contelli.co | `contelli` |
| Tezzeract subscription | `talent`, `contelli`, `talk`, … + workforce access |

The left rail renders from `entitlements ∩ registered modules`. A standalone Contelli
customer who later upgrades to Tezzeract gains rail entries with **no data migration** —
same org, same user, more entitlements. Preserving that upgrade path is a core reason the
identity and org model must be platform-level rather than per-module.

## 8. Gap vs. today

| Target | Today |
|---|---|
| Modules as packages | Folders in `client/src/features/*` |
| Module manifest contract | None — `VerticalSidebar.tsx` hardcodes a `navItems` array |
| Entitlement-gated rail | None — all tabs always render |
| Namespaced API (`/api/v1/<module>/*`) | Flat: `/api/talent`, `/api/social`, `/api/chat` |
| Agent panel persistent in shell | Chat panel is inside `TalentPage`, not the layout |
| Modules never import each other | Everything shares `client/src/shared/*` freely |

Note `social` is the internal name for what is branded **Contelli** — the rename hasn't
happened in code (`/api/social`, `features/social/`, `socialService.ts`). Worth doing
early, before more references accumulate.
