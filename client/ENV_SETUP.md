# Client Environment Setup

## Local development

Create a `.env.local` file in the `client` directory with the following content:

```env
VITE_API_URL=http://localhost:5001/api
```

Quick setup:

```bash
echo "VITE_API_URL=http://localhost:5001/api" > .env.local
```

Vite proxies `/api` and `/auth` to the Express server (see `vite.config.ts`).

## Vercel (`app.tezzeract.com`)

OIDC sign-in uses **full-page** navigations to `/auth/login` and `/auth/callback`. Those paths must reach the **Render API**, not the React SPA.

On the Vercel project, set an environment variable (Production + Preview):

```env
API_PROXY_ORIGIN=https://YOUR-SERVICE.onrender.com
```

Use your Render web service URL with **no** trailing slash. Routing is defined in `client/vercel.ts`, which reads `API_PROXY_ORIGIN` when Vercel builds (not the old `vercel.json` generator — that ran too late to take effect).

**Vercel project → Settings → General → Root Directory** should be either:

- `client` (uses `client/vercel.ts`), or
- repository root (uses root `vercel.ts` + `pnpm --filter client build`).

Push the latest code and redeploy. After deploy, verify:

```bash
curl -sI https://app.tezzeract.com/auth/login | head -5
```

You should see **`HTTP/2 302`** (or **307**) to `auth.tezzeract.com`, **not** `200` with `content-type: text/html`.

Without `API_PROXY_ORIGIN`, `/auth/login` loads `index.html`, React Router sends you back to `/`, and you never reach `auth.tezzeract.com`.

Ensure Render has `AUTH_*` set and `CLIENT_URL=https://app.tezzeract.com`.

