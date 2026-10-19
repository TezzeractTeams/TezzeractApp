/**
 * Writes client/vercel.json at build time so /api and /auth hit the Express API
 * (Render) instead of the SPA. Required for OIDC login + HttpOnly cookies on app.tezzeract.com.
 *
 * Set on Vercel: API_PROXY_ORIGIN=https://your-service.onrender.com
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const origin = (process.env.API_PROXY_ORIGIN || process.env.VITE_API_PROXY_ORIGIN || '')
  .trim()
  .replace(/\/$/, '');

const rewrites = [];

if (origin) {
  rewrites.push(
    { source: '/api/:path*', destination: `${origin}/api/:path*` },
    { source: '/auth/:path*', destination: `${origin}/auth/:path*` },
  );
  console.log(`[generate-vercel-config] Proxy /api and /auth → ${origin}`);
} else {
  console.warn(
    '[generate-vercel-config] API_PROXY_ORIGIN is unset — /auth/login will load the SPA only (OIDC will not work in production).',
  );
}

rewrites.push({ source: '/(.*)', destination: '/index.html' });

const config = { rewrites };
writeFileSync(path.join(clientRoot, 'vercel.json'), `${JSON.stringify(config, null, 2)}\n`);
