# Current State — Honest Inventory

> Snapshot of `main` @ `82bcdc4`, taken 2026-07-26. Facts about what is in the repo
> today, so vision documents can be read against reality. **Update this when it changes.**

---

## 1. Stack

| Layer | Actual |
|---|---|
| Monorepo | pnpm workspaces — `client/`, `server/`, `shared/` |
| Frontend | React 18, Vite, TypeScript, Tailwind, React Router v6, Zustand |
| Backend | Express + TypeScript, ESM (`.js` import specifiers) |
| Auth | **Supabase Auth** |
| DB | Supabase Postgres |
| AI | Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai` |
| Deploy | Vercel (client, `vercel.json` present) |

> ⚠️ Root `ARCHITECTURE.md` documents a bespoke JWT access/refresh token scheme. **The
> code does not do this** — it uses Supabase Auth (`server/src/middleware/supabase.middleware.ts`).
> Treat that document as historical.

## 2. Branches

`main`, `develop`, `dashboard`, `social-dashboard-feature`, `talent-feature`,
`talk-feature`, `wehan-branch`. Feature-branch-per-module — `talk-feature` suggests Talk
work exists outside `main`.

## 3. Modules present

| Module | Path | State |
|---|---|---|
| Talent | `client/src/features/talent/` | Most complete — AI chat, talent cards, team panel, meeting booking, org onboarding forms |
| Contelli (`social`) | `client/src/features/social/` | Dashboard, calendar, suggestions, settings; real OAuth to Google/Meta/Twitter; scheduled publishing cron |
| Chat | `client/src/features/chat/` | Stub — `chat.controller.ts` is 44 lines of mock channels/messages |
| Home / Auth | `features/home`, `features/auth` | Landing, login, Google OAuth, side panel |

**Contelli is branded but not renamed in code** — `/api/social`, `features/social/`,
`socialService.ts`. Rename early, before more references accumulate.

## 4. API surface (all of it)

```
POST   /api/auth/login | /register
GET    /api/talent/talents            GET /api/talent/talents/:id
POST   /api/talent/talents            PUT|DELETE /api/talent/talents/:id   [auth]
GET    /api/talent/candidates | /jobs                                       (mock)
POST   /api/ai/chat                   GET /api/ai/models
POST   /api/ai/swap                                                         [auth]
GET    /api/organization              POST|PUT /api/organization            [auth]
POST   /api/meeting/book                                                    [auth]
GET    /api/chat/channels | /messages/:channelId                            (mock)
GET    /api/social/dashboard/analytics | /insights                          [auth]
GET    /api/social/platforms          POST /platforms/:platform/connect     [auth]
DELETE /api/social/platforms/:platform/disconnect                           [auth]
GET    /api/social/oauth/{google,meta,twitter}/callback
GET    /api/social/content/calendar   POST /content/schedule                [auth]
PUT|DELETE /api/social/content/schedule/:id
POST   /api/social/content/post/:id   GET /content/suggestions              [auth]
GET|POST /api/social/objectives       DELETE /objectives/:id                [auth]
GET    /api/health
```

Unversioned, no module namespace, no pagination, inconsistent response envelopes.

## 5. Database

Tables referenced from server code: `organizations`, `talents`, `platform_connections`,
`scheduled_posts`, `user_objectives`. Migrations also define `content_suggestions`.

Notable:
- `organizations.user_id` — **direct FK, one org per user**
- `platform_connections.user_id → auth.users` — integrations owned by a *user*, not an org
- `scheduled_posts.organization_id`, `content_suggestions.organization_id` — correctly org-scoped
- **No** `memberships`, **no** roles, **no** entitlements, **no** audit log

## 6. Auth posture

- `optionalAuth` applied **globally** in `server.ts`; `requireAuth` per-route.
- `/talent` and `/social` are **unauthenticated routes** in `App.tsx`; only `/chat` and
  `/settings` sit behind `ProtectedRoute`.
- No RLS policies in the repo.
- No role checks anywhere.

## 7. The agent today

`server/src/controllers/aiTalentSearch.controller.ts` (603 lines):
- One Gemini call with a large few-shot prompt.
- Model instructed to emit `RESPONSE:` / `ROLES:` / `SKILLS:`; server regex-parses it,
  with a **fallback regex** for when the primary format fails.
- Talent search only. No tool calling, no cross-module reach, no org binding.
- Chat history persists to `localStorage` (`use-chat-storage.ts`).

## 8. Ranked gaps

| # | Gap | Blocks | Severity |
|---|---|---|---|
| 1 | No `memberships` — one org per user, hardcoded | Entire multi-org model | 🔴 critical |
| 2 | No role model (7 levels unimplemented) | All permissioning | 🔴 critical |
| 3 | No org isolation for AI | Compliance / data protection | 🔴 critical |
| 4 | Agent is talent-only, no tool calling | The core product thesis | 🔴 critical |
| 5 | Modules are folders, not packages | Standalone sales, independent deploy | 🟠 high |
| 6 | No design system package or tokens | Cross-product uniformity | 🟠 high |
| 7 | API unversioned, no envelope, no catalog | Agent + developer ergonomics | 🟠 high |
| 8 | `platform_connections` user-scoped | Org keeps connections when a user leaves | 🟠 high |
| 9 | Public unauthenticated `/talent`, `/social` | Tenant boundary | 🟠 high |
| 10 | Talk is a mock | A named pillar product | 🟡 medium |
| 11 | `social` → `contelli` rename outstanding | Naming debt, compounding | 🟡 medium |
| 12 | Root `ARCHITECTURE.md` stale | Misleads every new developer | 🟡 medium |
| 13 | Debug `fetch()` to `127.0.0.1:7242` in `PlatformLayout.tsx` | Noise in the future shell | 🟢 low |

## 9. Suggested sequence

The ordering matters — later items are cheap once earlier ones land, and expensive if
done first.

**Phase 0 — foundations.** `memberships` + roles + entitlements; RLS; close public
routes; re-scope `platform_connections` to org. *Everything else assumes this.*

**Phase 1 — contracts.** `/api/v1/<module>/*`, uniform envelope, Zod-generated
OpenAPI + client. Do this before the surface grows.

**Phase 2 — extraction.** `@tezzeract/ui` with tokens; module manifest contract; move
`features/*` into `modules/*`; rename `social` → `contelli`.

**Phase 3 — agent.** Orchestrator service, tool manifests per module, org-bound threads,
native tool calling, audit log.

**Phase 4 — standalone shells.** `contelli-web`, `talk-web`; entitlement-gated rail.
