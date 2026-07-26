# Architecture

**The architecture documentation has moved to [`docs/architecture/`](docs/architecture/README.md).**

👉 Start with **[docs/architecture/SUMMARY.md](docs/architecture/SUMMARY.md)** — the whole
architecture on one page.

---

## Why this file changed

The previous contents of this file described a **bespoke JWT access/refresh token scheme**
that the codebase does not implement — authentication uses **Supabase Auth**
([`server/src/middleware/supabase.middleware.ts`](server/src/middleware/supabase.middleware.ts)).
It had drifted far enough to actively mislead anyone onboarding, so it has been replaced
with this pointer. The original is preserved in git history.

Two other documents in this repo have the same problem and are scheduled for the same
treatment:

| File | Claims | Reality |
|---|---|---|
| [`DASHBOARD_GUIDE.md`](DASHBOARD_GUIDE.md) | Clerk auth (`VITE_CLERK_PUBLISHABLE_KEY`), OpenAI GPT-4 | Supabase Auth; Gemini today, provider-agnostic by design |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Clerk auth | Supabase Auth |

Until they're cleaned up, treat [`docs/architecture/`](docs/architecture/README.md) as the
sole authority.

## Quick orientation

| Question | Document |
|---|---|
| What is Tezzeract? | [SUMMARY](docs/architecture/SUMMARY.md) |
| How does multi-org tenancy work? | [02 Identity & Tenancy](docs/architecture/02-identity-and-tenancy.md) |
| What's the database schema? | [12 Data Model](docs/architecture/technical/12-data-model.md) |
| Why was X chosen? | [10 Decisions (ADRs)](docs/architecture/technical/10-decisions.md) |
| What am I building this week? | [40 Revenue-First Plan](docs/architecture/technical/40-revenue-first-plan.md) |
| How do I write code here? | [41 AI-First Codebase](docs/architecture/technical/41-ai-first-codebase.md) |
