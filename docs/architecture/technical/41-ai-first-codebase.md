# AI-First Codebase Conventions

> With 3 developers writing AI-assisted code at speed, the codebase itself is the primary
> control on quality. Review depth is thin; conventions, types and tests carry the load
> instead.

---

## 1. What actually makes a codebase AI-friendly

Coding agents pattern-match. They are excellent at *"do this the way that is already done
here"* and poor at inferring intent from inconsistency. Optimise for that:

| Do | Avoid | Why |
|---|---|---|
| One obvious way to do each thing | Three competing patterns | The agent copies whichever it sees first — pick for it |
| Explicit imports and wiring | DI containers, magic resolution | Agents trace imports; they cannot trace a runtime container |
| Small files, one concern | 600-line controllers | The relevant context has to fit in the window |
| Types as the contract | `any`, loose objects | The compiler catches what review no longer does |
| Colocated vertical slices | Layer-sharded folders | Everything for a feature in one directory |
| Canonical examples to point at | Prose describing the pattern | "Follow `patterns/crud-module`" beats a paragraph |

The DI point is worth dwelling on — it is also part of why
[ADR-016](10-decisions.md#adr-016) defers NestJS. An agent asked to modify a handler can
follow an explicit import chain. It cannot follow a decorator to a container to a provider
registered elsewhere, so it guesses, and the guess compiles.

## 2. Structure — vertical slices

```
modules/talent/
├── teams/
│   ├── teams.schema.ts       Zod — the contract
│   ├── teams.service.ts      business logic, framework-agnostic
│   ├── teams.routes.ts       thin Express transport
│   ├── teams.tools.ts        agent tools
│   └── teams.test.ts         colocated
└── talents/
    └── … same shape
```

Everything for "teams" in one directory. An agent opening `teams.service.ts` sees the
schema and the tests beside it, and does not need to reconstruct a mental model from four
sibling folders.

**`*.service.ts` holds no framework imports.** That is what keeps the NestJS migration
mechanical later, and it is enforceable by lint.

## 3. `AGENTS.md` at the repo root

The single highest-leverage file in an AI-first repo. Drop this in on day one:

````markdown
# Working in this repo

## Stack
Express + TypeScript · React + Vite · Supabase (Postgres, Auth, RLS) · Zod

## Non-negotiables
1. Every tenant-scoped table has `organization_id` and RLS. No exceptions.
2. Reads filter `organization_id = ANY(ctx.orgIds)` — a UNION across the user's orgs.
   Never `= ctx.currentOrg`. There is no "current org" in this system.
3. Writes take an explicit `organizationId` in the body; verify authority via
   `assertCanWrite(ctx, orgId, minRole)`.
4. `organizationId` is never a parameter on an agent tool. It is injected server-side.
5. Business logic lives in `*.service.ts` with no framework imports.
6. Zod schema first, then service, then route. Never hand-write a type a schema can infer.

## Patterns
Follow the canonical examples in `docs/patterns/`:
- `crud-module.ts`      — a standard org-scoped resource
- `agent-tool.ts`       — a tool definition
- `service-test.ts`     — how we test business rules

## Definition of done
- [ ] Zod schema, types inferred (no hand-written duplicates)
- [ ] Service function, framework-free, unit tested
- [ ] `organization_id` on any new table + index + RLS policy
- [ ] Isolation test passes
- [ ] No secrets, no `console.log` of tenant data
````

Every agent session starts by reading it. Keep it under two screens — a file nobody
finishes is a file nobody follows.

## 4. `docs/patterns/` — examples, not prose

Three or four canonical files an agent can be pointed at directly. This is far more
effective than describing the pattern in words, because the agent reproduces structure it
can see.

```
docs/patterns/
├── crud-module.ts     org-scoped resource: schema → service → route → test
├── agent-tool.ts      defineTool with error hints and idempotency
├── service-test.ts    business-rule test with two seeded orgs
└── migration.sql      table + index + RLS policy, together
```

`migration.sql` matters most: a new table without its RLS policy is the most likely
tenancy defect, and bundling them in one visible template is what prevents it.

## 5. Tests carry the weight review used to

With 3 devs, deep code review is not happening. Test what a reviewer would have caught:

| Test | Why |
|---|---|
| **Isolation suite** | Blocking. Enumerates every endpoint, asserts no cross-org leak |
| Domain invariants | Rule 1 (internal member), rule 2 (account manager) — [42 §4](42-talent-operations.md) |
| Billing transitions | Money bugs are the expensive kind |
| Auth boundaries | Every role × every endpoint |

Skip: UI snapshots, trivial CRUD paths, anything the type system already proves.

**Write the test first for business rules.** AI is good at making a described rule pass and
poor at inferring which rule you meant from an implementation.

## 6. CI as the reviewer

```yaml
typecheck        # strict, noUncheckedIndexedAccess
lint             # no framework imports in *.service.ts
gitleaks         # secrets
migration-lint   # every CREATE TABLE has an RLS policy
isolation-suite  # blocking, 100%
```

`migration-lint` is worth writing yourself — it is ~30 lines and it closes the highest-risk
gap in an AI-assisted codebase, where a generated migration looks perfectly plausible while
silently omitting RLS.

## 7. Practices that pay at 3 devs

**Small PRs.** An agent can produce 800 lines in a minute. Nobody reviews 800 lines
properly. Cap at ~300 and split.

**Regenerate rather than patch.** When AI-written code is wrong in shape, rewriting from a
better prompt usually beats patching — patched AI code accumulates incoherence quickly.

**Own the schema by hand.** Let AI write services and components freely; write migrations
and Zod schemas deliberately. They are the contracts everything else derives from, and an
error there propagates everywhere.

**Keep a decisions log.** `docs/architecture/technical/10-decisions.md` is already it.
Pointing an agent at an ADR prevents it re-litigating a settled decision.

## 8. Bus factor

Three devs is a real single-point-of-failure risk, and AI-assisted code is often understood
less deeply by the person who shipped it.

- Every module has a written one-paragraph "what and why" at the top.
- No undocumented tribal knowledge in deploy or ops steps — runbooks in `docs/runbooks/`.
- Rotate who touches which module; avoid permanent single ownership.
- The architecture docs in this folder are the recovery path if someone leaves.

## 9. What not to do

| Anti-pattern | Why it hurts more with AI |
|---|---|
| Clever abstractions | Agents mimic without grasping the constraint, and misapply it |
| Multiple ways to do one thing | The agent picks arbitrarily; the codebase forks stylistically |
| Implicit conventions | Not in the context window means not followed |
| Large files | Truncated context produces confidently wrong edits |
| Generated code committed unreviewed | Plausible and wrong is the dominant AI failure mode |

## 10. The measure

> A new developer — or a fresh agent session — should be able to add a correct, tenant-safe,
> tested endpoint by copying an existing one and changing the nouns.

If that holds, the conventions are working. If it takes reading four files to learn where
the org filter goes, they are not.
