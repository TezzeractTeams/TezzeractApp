# Talent module (Stage 2 placeholder)

Code for the Talent module still lives in the monorepo scaffold locations:

- **Frontend:** `apps/tezzeract-app/src/features/talent/`
- **Backend:** `services/gateway/src/routes/talent.routes.ts`, `services/gateway/src/controllers/talent.controller.ts`, and related AI search routes

Stage 2 will extract this into `modules/talent` as `@tezzeract/talent` (client + server + contracts + migrations in one package).
