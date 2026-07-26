# The Agent Layer

> The agent is the primary way work gets done in Tezzeract. It must reach every module,
> run actions, and never cross an organization boundary.

---

## 1. What it must do

- Persistently visible across the whole app; survives module switching.
- Talks to **all** modules — reads state, runs actions, creates tasks.
- Fast, accurate retrieval across a very large API surface.
- Structurally incapable of leaking one org's data into another's context.

## 2. Architecture

```
        ┌──────────────────────────────────────────────┐
        │  Agent panel (shell-level, never unmounts)   │
        └────────────────────┬─────────────────────────┘
                             │ thread bound to ONE org
        ┌────────────────────▼─────────────────────────┐
        │            Agent Orchestrator                │
        │  session → { user, org, standing, org_role,  │
        │              entitlements }                  │
        │  ├─ tool catalog (filtered by the above)     │
        │  ├─ retrieval (org-namespaced)               │
        │  └─ audit log                                │
        └────────────────────┬─────────────────────────┘
                             │ server-side dispatch
        ┌─────────┬──────────┴──────────┬──────────────┐
     Talent    Contelli               Talk          Platform
     tools      tools                 tools      (tasks, org, people)
```

The orchestrator is a **gateway service**, not client code. The browser never chooses
which tools exist or which org a call runs against.

## 3. Tools, not endpoints

Modules expose agent capability as a **tool manifest**, declared alongside the module:

```ts
defineTool({
  name: 'contelli.schedule_post',
  summary: 'Schedule a post on a connected social platform.',
  scopes: ['contelli:write'],
  orgRoles: ['org_admin', 'org_manager'],
  input: z.object({
    platform: z.enum(['linkedin', 'x', 'instagram', 'facebook']),
    content: z.string().max(3000),
    scheduledFor: z.string().datetime(),
  }),
  // NOTE: organizationId is NOT an input. See §5.
  handler: async (input, ctx) => { /* ctx.organizationId is injected */ },
});
```

Design rules, learned from where this usually goes wrong:

1. **Tools are business actions, not CRUD.** `contelli.schedule_post`, not
   `POST /scheduled_posts`. The agent should not have to compose four calls to do one
   obvious thing.
2. **Descriptions are written for the model.** The `summary` is prompt text — it is the
   thing that determines whether the tool gets called correctly. Treat it as product
   copy, review it like code.
3. **Typed schemas, always.** Zod at the boundary; the same schema generates the JSON
   Schema the model sees and the runtime validation. One source of truth.
4. **Errors are instructive.** `"platform 'tiktok' is not connected for this org — call
   contelli.list_connections first"` beats `400 Bad Request`. The model reads the error
   and retries correctly.
5. **Idempotency keys** on every mutating tool. Agents retry.

## 4. Managing tool sprawl

With many modules this becomes hundreds of tools — far past what fits usefully in one
prompt. Plan for it now:

- **Tiered exposure.** The model always sees a small set of meta-tools
  (`search_capabilities`, `describe_tool`) plus the tools for the *active* module. It
  discovers the rest on demand. This is the same pattern as deferred tool loading.
- **Namespacing by module** (`contelli.*`, `talent.*`, `talk.*`) so retrieval and
  permission filtering are trivial.
- **Filter by entitlement and role before the model ever sees a tool.** An org without
  Contelli never sees `contelli.*`. Cheaper and safer than refusing later.
- **Read-heavy aggregate tools.** `platform.my_pending_tasks` returning a labelled union
  across orgs beats making the agent fan out per-org.

## 5. Org isolation in the agent — enforcement points

This is the compliance-critical section. Six structural controls:

1. **A thread is bound to one `organization_id` at creation.** It cannot change; a
   different org means a new thread.
2. **`organizationId` is never a tool input.** It is injected into the handler context
   server-side from the authenticated session. A model that can *name* the org it wants
   can exfiltrate across tenants — so it must not be able to name one. This is the single
   most important rule on this page.
3. **Retrieval is filtered at the query layer**, before results reach the model. Never
   retrieve broadly and instruct the model to ignore what it shouldn't use.
4. **Per-org vector namespaces.** No shared embedding index.
5. **Per-org agent memory.** What the agent learned working for Org A is not available
   when working for Org B.
6. **Audit every tool call**: `(thread, user, org, tool, input digest, result status)`.

Note the tension with the union-view UX ([02](02-identity-and-tenancy.md) §4): the *human*
sees all their orgs at once, the *agent* works in one at a time. When a user's request is
ambiguous across orgs, the agent asks which org — it does not guess, and it does not
straddle.

## 6. Model choice

Current code uses Gemini 2.5 Flash via `@google/generative-ai`, with the model asked to
emit `RESPONSE:/ROLES:/SKILLS:` and the server regex-parsing the result
(`aiTalentSearch.controller.ts`). That approach should be retired:

- Regex-parsing free text is brittle — the file already carries a fallback parser for
  when the primary format fails, which is the smell.
- It cannot express multi-step tool use, which is the whole requirement here.

Move to **native tool calling with structured outputs**. Whichever provider is chosen,
the orchestrator should be model-agnostic behind one interface, because the tool manifest
— not the model — is the durable asset.

## 7. Gap vs. today

| Target | Today |
|---|---|
| Shell-level persistent agent | Chat panel lives inside `TalentPage` |
| Cross-module tool calling | One Gemini call, talent search only |
| Typed tool manifests | None |
| Structured output | Regex over `RESPONSE:/ROLES:/SKILLS:` + fallback parser |
| Org-bound threads | No org binding; chat history in `localStorage` (`use-chat-storage.ts`) |
| Server-injected org context | No org context at all |
| Audit log | None |
