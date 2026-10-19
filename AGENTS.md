# Working in this repo

## Stack

Express + TypeScript · React + Vite · Supabase (Postgres, Auth, RLS) · Zod · pnpm + Turborepo

## Repository layout

```
apps/tezzeract-app/     Vite + React SPA shell (@tezzeract/tezzeract-app)
services/gateway/       Express API — single service for now (@tezzeract/gateway)
packages/shared/        Shared TypeScript types (@tezzeract/shared)
modules/                Placeholders — extraction in Stage 2
```

## Non-negotiables

1. Every tenant-scoped table has `organization_id` and RLS. No exceptions.
2. Business logic belongs in `*.service.ts` files with **no framework imports** (no Express, no React). Routes/controllers stay thin.
3. Modules must not import other modules (enforced in Stage 2 via `dependency-cruiser`).
4. Shared types live in `packages/shared` — import via `@shared/*` path alias or `@tezzeract/shared`.

## Commands

```bash
pnpm install          # install all workspace packages
pnpm dev              # run app + gateway in parallel (turbo)
pnpm dev:app          # frontend only (:3000)
pnpm dev:gateway      # API only (:5001)
pnpm build            # build all packages
```

## Where to add code (Stage 1)

| Change | Location |
|---|---|
| New page / UI | `apps/tezzeract-app/src/features/<feature>/` |
| New route (shell) | `apps/tezzeract-app/src/App.tsx` |
| New API route | `services/gateway/src/routes/` |
| New API logic | `services/gateway/src/controllers/` or `*.service.ts` |
| Shared types | `packages/shared/types/` |

## Deployment note

- **Vercel** root directory: `apps/tezzeract-app`
- **API** start command: `node services/gateway/dist/server.js` (after build)

## Out of scope (Stage 2+)

- NestJS migration (stay on Express per ADR-016)
- `modules/*` package extraction
- `@tezzeract/ui` design system package
- Additional apps (`apps/web` Next.js marketing site)

See `docs/architecture/` for full platform architecture.
