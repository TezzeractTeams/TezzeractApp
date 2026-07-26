# Frontend Framework — Re-evaluation

> React was inherited, not chosen. This tests it against Tezzeract's real constraints, and
> answers the question underneath: **what would force a rebuild at 10–24 months?**

---

## 1. Performance, answered directly

| | Runtime (gzip) | Render perf | Notes |
|---|---|---|---|
| **Solid** | ~7KB | fastest | Fine-grained reactivity, no VDOM |
| **Svelte 5** | ~2–5KB compiled | fastest | Scales with app size |
| **Vue 3** | ~34KB | close behind | |
| **React 18/19** | ~45KB | ~1.3–2× slower on heavy list ops | VDOM + reconciliation |

**Solid and Svelte are genuinely faster.** That is not in dispute.

What is in dispute is whether it matters here. That gap is 1–2× on operations measured in
single-digit milliseconds, behind API calls measured in hundreds. Perceived performance in a
B2B SaaS app is dominated by:

1. **Network/API latency** — 100–300ms per request
2. **List virtualisation** — 10k unvirtualised rows are slow in *every* framework
3. **Update isolation** — a badly-scoped store re-renders everything, in every framework
4. Framework overhead — last, and by a distance

### Where it would actually show up for Tezzeract

| Surface | Risk | Fix (framework-independent) |
|---|---|---|
| Agent panel, SSE streaming | 🔴 High-frequency updates | Isolated store subscription, never lifted `useState` |
| Talk message lists | 🟠 Long lists, frequent appends | Virtualise |
| Talent browse | 🟠 Thousands of cards | Virtualise + paginate |
| Dashboards | 🟡 Chart re-renders | Memoise data transforms |

Every mitigation is an implementation pattern required in Svelte too. **A well-built React
app and a well-built Svelte app feel identical to your users.**

**When I would choose differently:** a 60fps canvas tool, a 50k-row data grid, or a
constrained-device target. None describe Tezzeract.

## 2. The constraints that decide it

| # | Constraint | Weight |
|---|---|---|
| 1 | ~40% of the revenue MVP already exists in React | 🔴 Dominant |
| 2 | AI-assisted coding is the delivery strategy | 🔴 High |
| 3 | Hiring 3 → 7–9 engineers in 18 months | 🔴 High |
| 4 | Design-system maturity across 4 surfaces | 🟠 Medium |
| 5 | Runtime performance | 🟡 Low — no measured bottleneck |

**On AI codegen:** LLMs have substantially more React training data than any alternative,
and generated-code reliability reflects it. Svelte 5's runes and Solid's reactivity are
recent enough that generated code is measurably more error-prone. Choosing the framework
with the weakest model support while betting on AI-assisted delivery works against the plan.

**Verdict: keep React.** Not preference — arithmetic. A ~3-month rewrite with five months
of runway to first revenue, to gain performance on a metric that is not the bottleneck, is
a bad trade at any reasonable discount rate.

## 3. Public surface: Next.js (revised)

An earlier draft of this document recommended Astro. **Withdrawn.**

The reasoning was to spare a 3-dev engineering team the App Router's learning curve. Once
marketing owns that surface and works in Next.js with AI assistance, the premise is gone —
and it inverts: models know Next.js far better than Astro, so for AI-assisted non-engineers
Next.js is the *safer* choice. Two frameworks is also worse than one.

```
tezzeract.com        Next.js       ← marketing owns, vibecoded
app.tezzeract.com    Vite + React SPA
contelli.co, talk.*  Vite + React SPA
shared               @tezzeract/ui (React)
```

### ⚠️ Platform requirement: isolate the marketing app

Non-engineers shipping to a public domain is fine. Non-engineers shipping to a public domain
*with platform credentials in scope* is not.

| Control | Requirement |
|---|---|
| Deployment | Separate Vercel project, separate domain |
| Secrets | **Zero platform env vars.** No `SUPABASE_*`, no service tokens |
| Data access | Public read-only API only — never a direct DB connection |
| Repo | **Its own repo.** Marketing's commit velocity must not touch engineering CI |
| API routes | Disallowed by convention; static/ISR only |

The separate repo matters more than it looks: it also keeps the marketing site out of
`git filter-repo` extraction for carve-out ([20](20-carve-out-readiness.md)), and out of the
Kernel boundary audit ([31 §5](31-ip-strategy.md)).

## 4. What actually forces a rebuild

The real question. From experience, ranked by frequency:

| Rank | Cause | Incrementally fixable? | Cost if wrong |
|---|---|---|---|
| 1 | **Tenancy / schema model** | ❌ No | Migration + downtime on live customers |
| 2 | **No API contracts or versioning** | ❌ Hard | Every client breaks at once |
| 3 | **Coupling, no boundaries** | ❌ Hard | Cannot extract or parallelise a team |
| 4 | Auth / identity model | ⚠️ Painful | SSO retrofit across every surface |
| 5 | Backend framework | ✅ Yes | Mechanical if logic is framework-free |
| 6 | **Frontend framework** | ✅ **Yes** | Route-by-route migration |

**Frontend is the most reversible decision in the stack**, and this architecture makes it
more so: each module mounts independently in the shell viewport, so a single module could be
built in another framework as an experiment without touching the rest.

Rows 1–3 are where the rebuild risk actually lives, and all three are **pre-funding**
decisions:

| Guard | Cost at month 0 | Cost at month 12 |
|---|---|---|
| `memberships` table, no `organizations.user_id` | 2 days | Weeks, with downtime |
| `organization_id` on every tenant table | Hours | Every query and index retrofitted |
| Zod contracts + `/api/v1/<module>/*` | Ongoing, small | Every client breaks |
| Module folders + `dependency-cruiser` | 1 day | Untangling months of coupling |
| Business logic in framework-free `*.service.ts` | Free — a convention | Full backend rewrite |

That is where the "I don't want to rebuild" budget should be spent. It is roughly a week of
work total, and it is the difference between evolving the platform and restarting it.

## 5. The escape hatch, concretely

If React ever becomes a genuine problem — measured, not suspected:

1. Build **one module** in the candidate framework; mount it in the same shell viewport.
2. Measure against the React equivalent on real data.
3. Migrate module by module if it wins. The Kernel, API and data model are untouched.

That path exists because of decisions in rows 1–4 above, not because of the frontend choice.
**Get the foundations right and the view layer stays cheap to change forever.**
