import { routes, type VercelConfig } from '@vercel/config/v1';

const apiOrigin = (process.env.API_PROXY_ORIGIN || process.env.VITE_API_PROXY_ORIGIN || '')
  .trim()
  .replace(/\/$/, '');

const rewrites = [];

if (apiOrigin) {
  rewrites.push(
    routes.rewrite('/api/:path*', `${apiOrigin}/api/:path*`),
    routes.rewrite('/auth/:path*', `${apiOrigin}/auth/:path*`),
  );
} else {
  console.warn(
    '[vercel.ts] API_PROXY_ORIGIN is unset — /auth/login will serve the SPA (OIDC will not work).',
  );
}

// SPA fallback (must be last)
rewrites.push(routes.rewrite('/(.*)', '/index.html'));

export const config: VercelConfig = {
  framework: 'vite',
  outputDirectory: 'dist',
  rewrites,
};
