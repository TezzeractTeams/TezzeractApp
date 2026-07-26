# API Conventions — Designed for Agents and Developers

> Tezzeract will have a very large endpoint surface across many modules. Conventions are
> what keep it navigable — for developers *and* for agents that must find the right call
> fast.

---

## 1. Shape

```
/api/v1/<module>/<resource>[/<id>][/<sub-resource>]
```

- `/api/v1/talent/talents`
- `/api/v1/contelli/scheduled-posts/:id`
- `/api/v1/talk/channels/:id/messages`
- `/api/v1/platform/organizations` — platform-owned, not a module

Rules: `v1` from day one; module segment always present; plural kebab-case resources;
verbs live in HTTP methods, not paths. Business actions that aren't CRUD get an explicit
sub-path (`POST /scheduled-posts/:id/publish`) rather than a `?action=` parameter.

## 2. Envelope

Every response, success or failure, has the same shape. Uniformity is what lets an agent
parse without special-casing per endpoint.

```jsonc
{
  "data": { },
  "meta": {
    "organizationId": "org_abc",     // always present on org-scoped data
    "organizationName": "ABC Corp",  // so the UI can render the origin badge
    "requestId": "req_01H…"
  },
  "pagination": { "cursor": "…", "hasMore": true, "limit": 50 }
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

The `hint` field is deliberate: it is written **for an agent reading the error and
deciding what to do next**. A stable machine `code` plus an actionable `hint` turns a
failed call into a successful retry instead of a dead end.

## 3. Multi-org responses

Because reads are a union across the user's orgs ([02](02-identity-and-tenancy.md) §4),
collection endpoints return items from **all** the caller's organizations by default,
each carrying its origin.

```jsonc
{
  "data": [
    { "id": "t_1", "title": "Review copy", "organizationId": "org_abc", "organizationName": "ABC Corp" },
    { "id": "t_2", "title": "Ship landing", "organizationId": "org_xyz", "organizationName": "XYZ Ltd" }
  ]
}
```

Narrowing is an explicit opt-in filter: `?organizationId=org_abc`.

**Writes always require an explicit target org** in the body. There is no ambient
"current organization" — that concept does not exist in this system, and reintroducing it
would break the union-view model.

## 4. Agent-friendliness as a design constraint

What actually makes an API fast for an agent to use:

**Fewer round-trips.** Support field expansion so one call answers one question:
`GET /talent/talents/:id?expand=portfolio,availability,reviews`. An agent forced to make
four calls to answer one user question is four chances to go wrong.

**Filter and sort in the query string, consistently across every module.**
`?status=active&skills=react,figma&sort=-updatedAt&limit=20`. Same grammar everywhere —
learned once, applied everywhere.

**A machine-readable capability index.** `GET /api/v1/_catalog` returns every endpoint
with its summary, parameters and required scopes, generated from the same schemas that
validate requests. This is how an agent discovers a surface too large to hold in a prompt.

**Semantic search endpoints where enumeration is wrong.**
`POST /api/v1/talent/talents/search { "query": "senior react dev, fintech, EU timezone" }`
— an agent should not paginate a database to answer a fuzzy question.

**Stable IDs, prefixed by type** (`org_`, `usr_`, `tal_`, `tsk_`). Type-prefixed IDs make
malformed calls fail loudly and immediately rather than silently querying the wrong table.

**Cursor pagination, never offset.** Consistent under concurrent writes.

## 5. One schema, four outputs

Define each endpoint's contract once (Zod), and generate:

1. runtime request validation,
2. the OpenAPI spec,
3. the typed client in `packages/api-client`,
4. the agent tool definition ([03](03-agent-layer.md) §3).

Hand-maintaining these separately guarantees drift. The generated-from-one-source rule is
what keeps the agent's view of the API true as the surface grows.

## 6. Auth & scoping

- `Authorization: Bearer <token>` — Tezzeract Identity session token.
- Org scope is derived **server-side** from `memberships`. Never trust a client-supplied
  org id without verifying membership.
- Scopes are `<module>:<action>` — `contelli:write`, `talent:read`.
- Effective permission = platform standing × org role × entitlement.

## 7. Versioning

`v1` in the path. Additive changes ship in place; breaking changes get `v2` with both
served during a deprecation window. Deprecations announced via a `Sunset` header — which
agents and clients can both act on.

## 8. Gap vs. today

| Convention | Today |
|---|---|
| `/api/v1/<module>/…` | `/api/talent`, `/api/social`, `/api/chat`, `/api/ai` — unversioned, inconsistent |
| Uniform envelope | Ad-hoc per controller: `{organization}`, `{talents}`, `{error}` |
| `organizationId` in every response | Absent |
| Error codes + hints | Bare `{ error: "message" }` strings |
| Cursor pagination | No pagination anywhere |
| Generated OpenAPI / client | Hand-written services in `client/src/shared/services/` |
| Capability catalog | None |
