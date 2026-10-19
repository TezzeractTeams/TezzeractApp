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

Use your Render web service URL with **no** trailing slash. The client `build` script generates `vercel.json` rewrites that proxy `/api/*` and `/auth/*` to that origin.

Without `API_PROXY_ORIGIN`, `/auth/login` loads `index.html`, React Router sends you back to `/`, and you never reach `auth.tezzeract.com`.

Ensure Render has `AUTH_*` set and `CLIENT_URL=https://app.tezzeract.com`.

