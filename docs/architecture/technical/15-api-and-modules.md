# API Surface & Module Contract

> How a module is packaged so it runs standalone and inside the shell, and how its API is
> shaped so agents and developers can both navigate it. Implements
> [ADR-002](10-decisions.md#adr-002), [ADR-009](10-decisions.md#adr-009),
> [ADR-015](10-decisions.md#adr-015).

---

## 1. The module package

```
modules/contelli/
├── package.json                 @tezzeract/contelli
├── src/
│   ├── manifest.ts              ← the only thing a shell imports
│   ├── client/                  routes, pages, components
│   ├── server/                  NestJS module: controllers, services
│   ├── tools/                   agent tool definitions
│   ├── contracts/               Zod schemas — the single source (ADR-009)
│   └── migrations/              owns contelli schema
└── brand.ts                     token overlay
```

One package: UI, API, tools, and migrations travel together. That is what makes a module
extractable into its own service later without touching a caller.

```ts
// manifest.ts
export const contelli: TezzeractModule = {
  id: 'contelli',
  displayName: 'Contelli',
  brand: contelliBrand,
  entitlement: 'contelli',
  routes: contelliRoutes,
  navigation: [{ icon: BarChart3, label: 'Contelli', path: '/contelli' }],
  tools: contelliTools,
  serverModule: ContelliServerModule,
  migrations: './migrations',
};
```

**Adding a module must require zero shell code changes.** If it doesn't, the contract has
leaked. Today [`VerticalSidebar.tsx`](../../../client/src/shared/layouts/VerticalSidebar.tsx)
hardcodes a `navItems` array — that is exactly the leak to close.

### Dependency rules (CI-enforced)

```
modules/*  →  packages/*        ✅
modules/*  →  modules/*         ⛔  breaks standalone sale
modules/*  →  apps/*            ⛔  breaks standalone sale
apps/*     →  modules/*         ✅
```

Enforced by `dependency-cruiser` in CI. A rule that is only in a document is a
suggestion; the build must reject the import.

## 2. Two shells, one module

```ts
// apps/contelli-web — standalone
<TezzeractShell modules={[contelli]} brand={contelliBrand} agent={false} />

// apps/tezzeract-app — the suite
<TezzeractShell
  modules={[talent, contelli, talk]}
  brand={tezzeractBrand}
  agent={true}
/>
```

Same package, different composition. The module must never assume the agent panel exists —
`useAgent()` returns `null` in standalone, and every call site handles that.

## 3. URL shape

```
/api/v1/<module>/<resource>[/<id>][/<sub-resource>]

/api/v1/platform/organizations
/api/v1/talent/talents/:id
/api/v1/contelli/scheduled-posts/:id/publish
/api/v1/talk/channels/:id/messages
/api/v1/agent/threads/:id/messages
```

Versioned from day one. Module segment always present — it is what makes routing,
permission filtering, and later service extraction mechanical.

## 4. Envelope

```jsonc
{
  "data": [
    { "id": "tsk_01H…", "title": "Review copy",
      "organizationId": "org_abc", "organizationName": "ABC Corp" }
  ],
  "meta": { "requestId": "req_01H…", "traceId": "…" },
  "pagination": { "cursor": "eyJ…", "hasMore": true, "limit": 50 }
}
```

```jsonc
{
  "error": {
    "code": "PLATFORM_NOT_CONNECTED",
    "message": "TikTok is not connected for ABC Corp.",
    "hint": "Call GET /api/v1/contelli/connections to list connected platforms.",
    "requestId": "req_01H…"
  }
}
```

`hint` is written **for an agent deciding what to do next**. A stable `code` plus an
actionable `hint` converts a failed call into a successful retry — the difference between
an agent that recovers and one that gives up.

Every org-scoped item carries `organizationId` **and** `organizationName`. The name is
denormalised deliberately: the UI must render an origin badge on every row of a union view,
and making that an N+1 lookup would be absurd.

## 5. Union reads, explicit writes

```
GET /api/v1/talk/channels
  → channels from ALL the caller's orgs, each labelled

GET /api/v1/talk/channels?organizationId=org_abc
  → narrowed, explicit opt-in

POST /api/v1/talk/channels
  { "organizationId": "org_abc", "name": "design" }   ← required
```

There is no ambient "current organization". Writes name their target; the gateway verifies
authority over that specific org ([13 §5](13-identity-and-sso.md)).

## 6. Query grammar — identical in every module

```
?status=active&skills=react,figma       filter
&sort=-updatedAt,name                   sort, '-' = desc
&expand=portfolio,availability          expansion — fewer round-trips
&limit=50&cursor=eyJ…                   cursor pagination, never offset
&fields=id,name,role                    sparse fieldsets
```

Learned once, applied everywhere. `expand` matters most for agents: one call answering one
question beats four calls and four chances to go wrong.

## 7. Capability catalog

```
GET /api/v1/_catalog
GET /api/v1/_catalog?module=contelli&q=schedule
```

Generated from the same Zod schemas that validate requests. This is how an agent discovers
a surface too large to hold in a prompt, and how a new developer explores the API without
reading source.

## 8. IDs

Type-prefixed, sortable: `org_01HQ…`, `usr_…`, `tal_…`, `tsk_…`, `msg_…` (ULID body).

Prefixes make malformed calls fail loudly at the boundary instead of silently querying the
wrong table — a property that matters far more when a model is composing the calls.

## 9. Codegen pipeline

```
contracts/*.ts (Zod)
   ├─► runtime validation      (nestjs-zod)
   ├─► OpenAPI 3.1             → docs + Postman
   ├─► @tezzeract/api-client   → typed frontend client
   └─► agent tool definitions  → orchestrator catalog
```

Generated output is committed and CI-verified clean. Hand-editing a generated file is a
build failure, not a code-review comment.

## 10. Design system packaging

```
packages/ui/
├── tokens/  core.ts · brands/{tezzeract,contelli,talk}.ts
├── primitives/  Button · Input · Card · Table · Modal · Tabs · Toast
└── patterns/    DataTable · EmptyState · OrgBadge · PageHeader
```

`OrgBadge` is a platform primitive, not a per-module component — every union view needs it,
and consistency in how org origin is displayed is a product requirement.

Rules: no business logic in `packages/ui`; no raw hex or arbitrary Tailwind values in
`modules/*` (ESLint-enforced); one primitive per job. The current
`Button` / `TezzeractButton` / `TezzeractSendButton` split collapses into one `Button` with
variants plus a composed `SendButton`.

## 11. Rate limiting

| Scope | Limit |
|---|---|
| Per user | 1 000 req/min |
| Per org | 10 000 req/min |
| Agent turns | 60/min per user |
| Auth endpoints | 5 per 15 min per IP+email |

Returned as `X-RateLimit-*` headers plus `Retry-After` — machine-readable, so an agent
backs off correctly instead of hammering.

## 11b. REST vs GraphQL — and why "we use a lot of AI" settles it

The intuitive case for GraphQL is that agents need flexible fetching, and GraphQL is
flexible. Examined properly, the AI argument runs the other way.

### The reframe: agents call tools, not APIs

An LLM agent does not issue HTTP requests. It calls **tools** — `contelli.schedule_post`
with a typed JSON argument object. The tool *implementation* talks to your API. So the
agent's ergonomics are set by your tool definitions ([14 §3](14-agent-runtime.md)), not by
your wire protocol.

The protocol question is therefore mostly about **your own clients**, and the AI-specific
considerations only apply if you were to expose the raw API to a model.

### What happens if you do expose GraphQL to a model

| Issue | Effect |
|---|---|
| The model must **write query strings** | Code generation — measurably more error-prone than filling a typed object |
| Introspection schemas are large | A platform-sized schema consumes a great deal of context before any work begins |
| Malformed queries | A common, recurring failure mode; each retry costs a round trip and tokens |
| **The surface is the whole graph** | You cannot enumerate what the model might ask for |

That last row is decisive for us. With REST + tools, the agent's reachable surface is
exactly what we defined. With GraphQL, it is every traversable path in the schema.

### The security argument is the one that decides it

Our tenant isolation depends on `organizationId` being injected server-side and being
**unrepresentable** as a model-supplied value ([14 §7](14-agent-runtime.md)).

- **REST + tools:** injected once, in the tool dispatcher. One place to audit.
- **GraphQL:** every resolver on every field is a potential leak. Nested traversals
  (`organization → teams → members → engagements`) must each re-check scope. The audit
  surface is the entire schema, permanently, and it grows with every field added.

For a platform whose central claim is *"the agent cannot cross a tenant boundary"*, that
difference is not a preference. It is the difference between a claim we can prove and one
we can only assert.

### Where GraphQL would genuinely help — and whether it applies

| GraphQL strength | Applies to us? |
|---|---|
| Avoid over/under-fetching | Partly — `?expand=` and `?fields=` cover the real cases |
| Single round trip for nested data | Partly — same |
| Many heterogeneous clients | ❌ We control all clients |
| Schema as contract | ❌ Already solved by Zod → OpenAPI → generated client |
| Rapid frontend iteration without backend changes | ⚠️ Real, but see below |

And Supabase's PostgREST already provides much of the fetching flexibility over REST
semantics for simple reads:

```
GET /talents?select=id,name,teams(id,name)&status=eq.active
```

Column selection and embedded resources, without a resolver layer to secure.

### Costs we would take on

DataLoader batching everywhere (or N+1 by default) · query depth and complexity limiting to
prevent denial-of-service · no HTTP cache semantics · per-query-cost rate limiting rather
than per-request · field-level authorization across the whole schema. That is significant
machinery for a three-person team.

### Decision

**REST, with the tool layer as the agent interface.** See [ADR-018](10-decisions.md#adr-018).

### The forward-looking option: expose tools over MCP

Because `defineTool` already produces typed JSON-schema tool definitions, exposing them as
an **MCP server** is nearly free — and strategically interesting:

```
Tezzeract Kernel tools
  ├─► internal agent            (today)
  └─► customer's own assistant  (via MCP + OAuth)
```

A customer's Claude could then read their Tezzeract tasks, schedule a post, or query their
team — with our OrgContext injection and audit still enforced server-side, because the
tools are the same ones.

That is a genuine differentiator for an "AI-first platform", and it is only cheap because
the tool layer is typed JSON schemas rather than a query language. **Another reason the
protocol choice and the agent interface should stay separate concerns.**

## 12. Versioning

Additive changes ship in `v1`. Breaking changes mint `v2`, both served through a
deprecation window announced via the `Sunset` header. Agents and clients can both act on
that header, which is the point of using a standard one.
