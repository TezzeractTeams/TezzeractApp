# Agent Runtime

> Concrete design for `services/agent`. Implements [ADR-008](10-decisions.md#adr-008) and
> [ADR-010](10-decisions.md#adr-010); the principles are in
> [03-agent-layer.md](../03-agent-layer.md).

---

## 1. Turn lifecycle

```
POST /api/v1/agent/threads/:threadId/messages   { content, activeModule? }
  │
  ├─ 1. Load thread; assert ctx.orgIds includes thread.organization_id
  ├─ 2. Build ToolContext  ← organizationId injected HERE
  ├─ 3. Resolve tool catalog (entitlement × standing × role × module)
  ├─ 4. Retrieve context, org-filtered at the query layer
  ├─ 5. ModelProvider.complete({ system, messages, tools })
  ├─ 6. Loop: dispatch tool calls → feed results back (max 12 hops)
  ├─ 7. Persist messages + tool calls; audit each
  └─ 8. Stream SSE to client
```

Step 2 is the security boundary. Everything downstream inherits an org it cannot change.

## 2. ToolContext

```ts
export interface ToolContext {
  readonly organizationId: string;   // server-injected; never a model argument
  readonly userId: string;
  readonly standing: PlatformStanding;
  readonly orgRole: OrgRole;
  readonly entitlements: ReadonlySet<string>;
  readonly threadId: string;
  readonly traceId: string;
  readonly db: ScopedDb;             // pre-bound to organizationId
}
```

`ScopedDb` is a thin wrapper that injects `organization_id` into every query. A tool
handler that wants to reach another org has no API through which to express the wish —
which is the point. **Make the unsafe thing unrepresentable rather than forbidden.**

## 3. Defining a tool

```ts
export const scheduleePost = defineTool({
  name: 'contelli.schedule_post',
  summary:
    'Schedule a post to publish on a connected social platform at a future time. ' +
    'Use contelli.list_connections first if unsure which platforms are connected.',
  module: 'contelli',
  scopes: ['contelli:write'],
  minOrgRole: 'org_manager',
  mutating: true,
  input: z.object({
    platform: z.enum(['linkedin', 'x', 'instagram', 'facebook'])
      .describe('Must already be connected for this organization.'),
    content: z.string().max(3000),
    scheduledFor: z.string().datetime()
      .describe('ISO 8601, UTC, must be in the future.'),
    idempotencyKey: z.string().uuid(),
  }),
  output: z.object({ postId: z.string(), scheduledFor: z.string() }),

  async handler(input, ctx) {
    const conn = await ctx.db.platformConnections.findFirst({
      where: { platform: input.platform },
    });
    if (!conn) {
      throw new ToolError('PLATFORM_NOT_CONNECTED', {
        message: `${input.platform} is not connected for this organization.`,
        hint: 'Call contelli.list_connections to see connected platforms.',
      });
    }
    return ctx.db.scheduledPosts.create({ data: { ...input } });
  },
});
```

Note what is **not** in the input schema: `organizationId`. It cannot be, by construction.

### Rules

1. **Business actions, not CRUD.** One tool per thing a user would ask for.
2. **`summary` is prompt text.** It decides whether the tool gets called correctly. Review
   it like production code, because it is.
3. **`.describe()` on every non-obvious field.** Cheaper than a retry loop.
4. **Errors teach.** `code` + `hint` turns a failure into a correct retry rather than a
   dead end.
5. **`idempotencyKey` on every mutating tool.** Agents retry; users should not get two posts.
6. **Read tools are cheap and wide; write tools are narrow and guarded.**

## 4. Catalog scaling

Hundreds of tools will not fit in one prompt. Tiered exposure from day one:

| Tier | Always present | Contents |
|---|---|---|
| 0 | ✅ | `search_capabilities`, `describe_tool`, `switch_module` |
| 1 | ✅ | Platform-wide reads: tasks, orgs, people |
| 2 | active module only | That module's full tool set |
| 3 | on demand | Everything else, discovered via tier 0 |

Filtering happens **before** the model sees anything: an org without Contelli never sees
`contelli.*`. Cheaper than refusing later, and it prevents the model proposing actions the
user cannot take.

## 5. Retrieval

```ts
const hits = await vectorSearch({
  namespace: `org:${ctx.organizationId}`,   // hard partition, not a filter
  query: embedding,
  topK: 12,
});
```

Namespaces are physical partitions ([ADR-013](10-decisions.md#adr-013)), not `WHERE`
clauses applied after the fact. Public talent-profile embeddings live in
`public:talent`, the only namespace readable across orgs — and it contains solely
data that is already public on the marketing site.

## 6. Model provider interface

```ts
export interface ModelProvider {
  complete(req: {
    system: string;
    messages: Message[];
    tools: ToolDefinition[];
    maxTokens: number;
    temperature?: number;
  }): AsyncIterable<CompletionChunk>;
}
```

| Workload | Model | Why |
|---|---|---|
| Tool-calling turns | `claude-sonnet-5` | Best tool-call reliability per unit cost |
| Classification, extraction, titling | `claude-haiku-4-5-20251001` | ~10× cheaper, sufficient |
| Long multi-step planning | `claude-opus-4-8` | Only when depth demonstrably pays |

Configured per workload, not globally. **Prompt-cache the system prompt and tool catalog**
— they are large and near-constant, and this is the single biggest cost lever in the
system.

## 7. Isolation controls — the audit checklist

| # | Control | Enforced at |
|---|---|---|
| 1 | Thread bound to one org, immutable | DB trigger ([12 §7](12-data-model.md)) |
| 2 | `organizationId` never a model input | `defineTool` type system |
| 3 | Retrieval org-partitioned | Vector namespace |
| 4 | Per-org agent memory | Namespace |
| 5 | Tool catalog filtered pre-prompt | Orchestrator |
| 6 | Every tool call audited | `platform.audit_log` |
| 7 | Cross-org ambiguity → ask, never guess | Orchestrator policy |

Control 2 is the one to defend hardest. **A model that can name the org it wants can
exfiltrate across tenants** — so the schema must make naming one impossible.

## 8. Prompt injection

Tool results carry untrusted content: social comments, Talk messages, talent bios.

- Wrap all tool output in `<tool_result>` and instruct the model to treat it as data.
- **Mutating tools always require user confirmation when the turn touched untrusted
  content** — the model's judgement is not a security control.
- Never let retrieved content change `organizationId`, scopes, or the tool catalog.
- Log turns where retrieved content contains imperative language directed at the assistant.

## 9. Observability

Per turn: `tokens_in/out`, `cache_hit_rate`, `tool_calls`, `hops`, `latency_p50/p95`,
`disambiguation_rate`, `tool_error_rate`.

`disambiguation_rate` is the health metric for the union-view model. If it climbs, users
are working across orgs more than we assumed and the UX needs a better org hint — a
product signal we would otherwise never see.

## 10. Migration from today

[`aiTalentSearch.controller.ts`](../../../server/src/controllers/aiTalentSearch.controller.ts)
is 603 lines built around regex-parsing `RESPONSE:/ROLES:/SKILLS:` out of free text, with
a fallback parser for when the primary format fails. That fallback is the tell.

1. Wrap the existing Gemini call behind `ModelProvider` — no behaviour change.
2. Re-express talent search as `talent.search_talents` with a Zod schema.
3. Delete both parsers; use native tool calling.
4. Move the chat panel from `TalentPage` into the shell layout.
5. Replace `localStorage` history with `platform.agent_threads`.
6. Add tool manifests to Contelli, then Talk.

Steps 1–3 are self-contained and independently shippable.
