# CI/CD & Repository Strategy

> One repository, many independently deployed targets. How that works, and the named
> triggers at which we'd split.

---

## 1. Decision: monorepo

One repository containing all apps, modules, packages, and services
([ADR-001](10-decisions.md#adr-001)).

**The distinction that resolves most confusion:** a monorepo is a *source* strategy, not a
*deployment* strategy. One repo still produces ~10 independently deployed artifacts, each
shipping on its own cadence.

```
One repo                          Many deployments
├── apps/web                 →    tezzeract.com          (Vercel)
├── apps/tezzeract-app       →    app.tezzeract.com      (Vercel)
├── apps/contelli-web        →    contelli.co            (Vercel)
├── apps/talk-web            →    talk.*                 (Vercel)
├── services/gateway         →    api.tezzeract.com      (Fly)
├── services/identity        →    auth.tezzeract.com     (Fly)
├── services/agent           →    agent.tezzeract.com    (Fly)
├── services/realtime        →    ws.tezzeract.com       (Fly)
├── modules/*                →    libraries, no deploy
└── packages/*               →    libraries, no deploy
```

A change to `modules/contelli` redeploys `contelli-web` and `gateway`. It does not touch
Talk. Deployment independence comes from the build graph, not from repository boundaries.

## 2. Why not polyrepo

| Problem | Monorepo | Polyrepo |
|---|---|---|
| Change `@tezzeract/ui`, update 4 apps | one atomic PR | 5 PRs, version bumps, days of drift |
| Contract change across client & server | one commit, CI verifies both | coordinated release, breakage window |
| Cross-module boundary enforcement | `dependency-cruiser` sees everything | invisible — nothing to check against |
| New developer setup | one clone | 12 clones, matching versions |
| Atomic refactor | possible | not possible |

The second row is decisive for us. [ADR-009](10-decisions.md#adr-009) generates the API
client, OpenAPI spec, and agent tool definitions from one Zod source. **That guarantee is
only enforceable if generator and consumers live in one commit.** Split them and codegen
drift becomes a race between repos — precisely the failure the decision exists to prevent.

## 3. The carve-out concern, resolved

The obvious objection after [20-carve-out-readiness.md](20-carve-out-readiness.md): *if I
might sell Contelli, shouldn't it have its own repo?*

No — because **extracting a subdirectory with its full history is a scripted operation**:

```bash
git clone --no-local tezzeract contelli-standalone
cd contelli-standalone
git filter-repo \
  --path modules/contelli --path apps/contelli-web \
  --path packages/ui --path packages/identity
```

Minutes, with commit history, blame, and authorship intact. Splitting *pre-emptively* pays
polyrepo costs every day for years to save an afternoon once — and only if the sale ever
happens.

## 4. When we would actually split

Named triggers, not preferences:

| Trigger | Action |
|---|---|
| CI > 20 min with warm cache and affected-only | Extract the slowest target |
| Merge queue blocking > 10 PRs/day | Split by team ownership |
| A product is actually sold | `git filter-repo` at close |
| External contributors need scoped access | Extract that module |
| A module needs a non-JS toolchain | Own repo, own pipeline |

None apply at 3–4 engineers. Row 2 typically starts biting around 15–20 engineers.

## 4b. Developer workflow — do I clone everything?

**Default: yes, and that is fine.** Only source is committed (`node_modules`, build output
and binaries are excluded), so the repo should stay in the low hundreds of MB including
history for years — a one-off ~30 second clone.

The clone is rarely the cost anyway; `pnpm install` usually is, and that scopes:

```bash
git clone git@github.com:TezzeractTeams/tezzeract.git
cd tezzeract
pnpm install --filter contelli...     # Contelli and its dependencies only
pnpm dev --filter contelli-web
```

A developer working on Contelli never installs, builds, or runs Talent.

### If the working tree gets too large

```bash
git clone --filter=blob:none --sparse git@github.com:TezzeractTeams/tezzeract.git
cd tezzeract
git sparse-checkout set packages modules/contelli apps/contelli-web
```

| Flag | Effect |
|---|---|
| `--filter=blob:none` | Commits and trees only; file contents fetched on demand |
| `--sparse` + `sparse-checkout set` | Only these directories materialise in the working tree |

Full git functionality is retained — `log`, `blame`, `branch`, `commit`, `push` all behave
normally. Avoid `--depth=1` for developers: it breaks `log` and `blame`. It is fine in CI.

### What sparse checkout does not give you

Independent git operations per module. One repo, one history, one set of branches — a
commit may span directories, which is precisely what the codegen guarantee
([ADR-009](10-decisions.md#adr-009)) depends on. Sparse checkout solves *"my working tree
is too big"*, not *"I want separate repos."*

### Keeping the repo small

The thing that actually makes monorepos painful is **binaries in history** — design files,
videos, screenshots, sample data. They are effectively unremovable and inflate every clone
forever.

- No binaries in git: assets → R2, design files → Figma
- Git LFS only if a large file genuinely must be versioned
- CI check rejecting any committed file over ~5MB
- Review `git count-objects -vH` quarterly

Get this right and nobody ever needs sparse checkout.

## 5. Pipeline

```
┌─ PR ────────────────────────────────────────────────────┐
│ guards (always, never affected-filtered)                │
│   gitleaks · dependency-cruiser · codegen-drift         │
│   migration-lint                                        │
│ affected: lint · typecheck · unit                       │
│ build affected                                          │
│ preview deploy + ephemeral DB branch + seed             │
│ e2e smoke · tenant isolation suite                      │
└─────────────────────────────────────────────────────────┘
        │ merge
┌─ main ──────────────────────────────────────────────────┐
│ deploy staging (affected) · integration tests           │
└─────────────────────────────────────────────────────────┘
        │ tag
┌─ production ────────────────────────────────────────────┐
│ migrate (expand only) → canary 10% → soak 15m → 100%    │
│ auto-rollback on error-budget breach                    │
└─────────────────────────────────────────────────────────┘
```

### The four guards that never get affected-filtered

Everything else runs only on changed packages. These run on **every** PR, because each
protects an invariant that a scoped diff can silently violate:

1. **`gitleaks`** — a secret can be committed in any file. (We have already paid for
   skipping this: see [17 §3](17-security-and-compliance.md).)
2. **`dependency-cruiser`** — one `modules/* → modules/*` import erodes standalone
   sellability, and it will arrive as a one-line diff on a Friday.
3. **`codegen-drift`** — regenerate from Zod, fail if output differs. Without it the
   agent's view of the API silently diverges from reality.
4. **`migration-lint`** — reject destructive DDL without an explicit
   `-- contract:approved` marker. Expand/contract discipline ([16 §4](16-infrastructure.md))
   is unenforceable by convention alone.

## 6. Concrete workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push: { branches: [main] }

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}   # remote cache
  TURBO_TEAM:  ${{ vars.TURBO_TEAM }}

jobs:
  guards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }          # full history: gitleaks + turbo diffing
      - uses: gitleaks/gitleaks-action@v2
      - uses: ./.github/actions/setup     # pnpm + node + cache
      - run: pnpm dependency-cruiser --config .dependency-cruiser.cjs modules apps packages
      - run: pnpm codegen && git diff --exit-code -- '**/generated/**'
      - run: pnpm migration-lint

  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: ./.github/actions/setup
      - run: pnpm turbo run lint typecheck test --filter='...[origin/main]'

  preview:
    needs: [guards, verify]
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - id: db
        run: echo "url=$(pnpm db:branch create pr-${{ github.event.number }})" >> $GITHUB_OUTPUT
      - run: pnpm db:migrate && pnpm db:seed
        env: { DATABASE_URL: '${{ steps.db.outputs.url }}' }
      - run: pnpm turbo run deploy:preview --filter='...[origin/main]'
      - run: pnpm test:e2e --grep @smoke
      - run: pnpm test:isolation        # ← see §7
```

`--filter='...[origin/main]'` selects packages changed since `main` **and everything that
depends on them** — so touching `@tezzeract/ui` correctly rebuilds all four apps, while
touching `modules/talk` rebuilds only Talk.

Remote caching means a second CI run on an unchanged package is a cache restore, not a
rebuild. On a repo this size that is the difference between a 4-minute and a 20-minute PR.

## 7. The isolation suite is a release gate

```ts
// tests/isolation.spec.ts — runs on every PR, blocks merge
test('list endpoints never leak across orgs', async () => {
  const { orgA, orgB, userA } = await seedTwoOrgs();
  for (const endpoint of await catalog.listEndpoints()) {
    const res = await api.get(endpoint).as(userA);
    expect(res.data.every(r => r.organizationId === orgA.id)).toBe(true);
  }
});

test('agent tools cannot reach another org', async () => { /* … */ });
test('vector namespaces are physically partitioned', async () => { /* … */ });
```

This enumerates endpoints from the generated catalog ([15 §7](15-api-and-modules.md)), so a
**new endpoint is covered the day it is added** — no one has to remember to write the test.
That property is the whole point; isolation regressions arrive in code nobody thought was
tenancy-related.

Pass rate must be 100%. There is no "known failure" state for this suite.

## 8. Migrations

Migrations deploy **separately from and before** application code.

```
tag → migrate (expand only) → deploy canary → soak → full
```

- One runner discovers migrations across all modules; `platform` always runs first.
- Every migration is forward-only and idempotent. Rollback = deploy previous code, which
  works because expand-phase schemas are backwards compatible.
- Destructive DDL requires `-- contract:approved` plus a human approval gate, and may never
  ship in the same release as the expand that preceded it.

Never expand and contract in one release. It is the most common way a deploy becomes
irreversible.

## 9. Ownership without splitting the repo

```
# CODEOWNERS
/packages/ui/           @tezzeract/design
/modules/contelli/      @tezzeract/contelli-team
/modules/talk/          @tezzeract/talk-team
/services/identity/     @tezzeract/platform
/services/agent/        @tezzeract/ai
/docs/architecture/     @shanilka
```

Team autonomy comes from ownership rules and the dependency graph, not from repository
boundaries. Most polyrepo migrations are attempts to solve an ownership problem with a
tooling change — CODEOWNERS solves it directly and reversibly.

## 10. Deployment per target

| Target | Trigger | Strategy |
|---|---|---|
| Vercel apps | affected on main | Atomic, instant rollback |
| Fly services | affected on tag | Rolling, health-gated |
| `services/realtime` | affected on tag | Drain connections, then rolling |
| Migrations | pre-deploy | Forward-only, gated |

`realtime` needs its own care: it is stateful, so a naive rolling deploy drops live
WebSocket connections. Drain, then roll.

## 11. Metrics

| Metric | Target |
|---|---|
| PR CI (warm cache) | < 8 min |
| Cache hit rate | > 70% |
| Deploy frequency | daily+ |
| Lead time, commit → prod | < 1 day |
| Change failure rate | < 15% |
| Isolation suite | **100%, always** |

If CI exceeds 20 minutes with a warm cache, that is the signal in §4 — and the response is
to extract the slowest target, not to weaken the guards.
