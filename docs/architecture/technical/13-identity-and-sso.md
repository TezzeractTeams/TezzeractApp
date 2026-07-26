# Identity & SSO — Token Design and Flows

> How one account works across tezzeract.com, contelli.co, talk.* and every future
> property. Implements [ADR-005](10-decisions.md#adr-005).

---

## 1. Topology

```
  contelli.co ──┐
  talk.dev    ──┼──► auth.tezzeract.com ──► Supabase Auth
  tezzeract.com─┘     (Tezzeract Identity)   (credentials, OAuth, MFA)
                            │
                            └─► platform.users + memberships
```

Supabase Auth is the **credential store**. Tezzeract Identity owns the **session** and is
the only issuer of Tezzeract tokens. No module or app talks to Supabase Auth directly —
that indirection is the seam that lets us change IdP later without touching modules.

## 2. Tokens

Three, with different jobs. Conflating them is the classic mistake.

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| **SSO session** | 30d sliding | `httpOnly; Secure; SameSite=Lax` cookie on `.tezzeract.com` | Proves you are logged in; only Identity reads it |
| **Access token** | 10 min | memory (never `localStorage`) | Sent to the gateway |
| **Refresh token** | 30d, rotating | `httpOnly` cookie, path-scoped to the refresh endpoint | Mints access tokens |

**Access tokens are short because they carry memberships.** A revoked membership must
stop working quickly, and 10 minutes is the blast radius we accept in exchange for not
hitting the database on every request.

Storing access tokens in memory rather than `localStorage` is not optional — the current
[`tokenManager.ts`](../../../client/src/shared/utils/tokenManager.ts) uses `localStorage`,
which is readable by any XSS payload.

### Access token claims

```jsonc
{
  "iss": "https://auth.tezzeract.com",
  "sub": "usr_01H…",
  "aud": ["api.tezzeract.com"],
  "exp": 1790000600,
  "email": "sam@abccorp.com",
  "standing": "tezzeract_internal",
  "orgs": [
    { "id": "org_abc", "role": "org_admin",   "src": "org_native" },
    { "id": "org_xyz", "role": "org_manager", "src": "tezzeract_assigned" }
  ],
  "ent": { "org_abc": ["talent","contelli","talk"], "org_xyz": ["contelli"] },
  "sid": "sess_01H…"
}
```

Signed **EdDSA (Ed25519)**, verified against JWKS at
`auth.tezzeract.com/.well-known/jwks.json`, cached 10 minutes at the gateway.

**Cap `orgs` at 50.** Beyond that the token is omitted and the gateway resolves
memberships from Postgres — otherwise a Tezzeract admin in 400 orgs produces a token too
large for a header. Design for your heaviest user, not your median one.

## 3. Login flow (contelli.co, first time)

```
1. User → contelli.co, clicks Sign in
2. Redirect → auth.tezzeract.com/authorize
                ?client_id=contelli-web
                &redirect_uri=https://contelli.co/auth/callback
                &state=<csrf>&code_challenge=<S256>     ← PKCE, mandatory
3. Identity: no SSO cookie → render login (password / Google / magic link)
4. Credentials verified via Supabase Auth
5. Identity sets SSO cookie on .tezzeract.com, mints one-time code
6. Redirect → contelli.co/auth/callback?code=…&state=…
7. contelli-web POSTs code + verifier → /token
8. Identity returns access token (body) + refresh token (httpOnly cookie)
```

Standard OIDC authorization-code + PKCE. We are not inventing a protocol; the value is in
the claims and the single session domain.

## 4. Second property — the SSO payoff

```
1. Same user → talk.dev, clicks Sign in
2. Redirect → auth.tezzeract.com/authorize?client_id=talk-web…
3. Identity: SSO cookie present and valid → NO login prompt
4. Immediate redirect back with a code
5. Token exchange → signed in
```

One redirect round-trip, no interaction. Step 3 is the whole reason Identity exists as a
separate service on its own domain.

## 5. OrgContext resolution

The gateway builds `OrgContext` on every request ([ADR-007](10-decisions.md#adr-007)):

```ts
export interface OrgContext {
  userId: string;
  standing: PlatformStanding;
  orgIds: string[];                          // union — the basis of every read
  roleByOrg: Record<string, OrgRole>;         // authority — the basis of every write
  entitlements: Record<string, string[]>;
  traceId: string;
}
```

```ts
// Reads: union across every org the caller belongs to.
const posts = await db.scheduledPosts.findMany({
  where: { organizationId: { in: ctx.orgIds } },
});

// Writes: the caller names the org; we verify authority over THAT org.
function assertCanWrite(ctx: OrgContext, orgId: string, min: OrgRole) {
  const role = ctx.roleByOrg[orgId];
  if (!role) throw new ForbiddenError('NOT_A_MEMBER');
  if (rank(role) < rank(min)) throw new ForbiddenError('INSUFFICIENT_ROLE');
}
```

Cached in Redis under `ctx:{userId}:{tokenVersion}`, 60s TTL, invalidated on membership or
entitlement change.

## 6. Cross-org access for Tezzeract staff

Only `tezzeract_admin` may act outside their memberships. It is never implicit:

1. The caller passes an explicit `X-Tz-Cross-Org: <orgId>` header — intent must be stated.
2. The gateway verifies `standing === 'tezzeract_admin'`.
3. Access is time-boxed (15 min) and reason-tagged.
4. Written to `audit_log` with `cross_org = true`.

Everyone else — including Tezzeract Internal — reaches other orgs only by holding a real
membership. That keeps the common path auditable through one mechanism rather than two.

## 7. Talent who never log in

Most talent are marketplace records, not users. Resolves Q2:

- `talent.talents` rows exist **without** a `platform.users` row.
- Claiming a profile creates the user and links `talents.user_id`.
- Standing starts `talent_unverified`; approval promotes to `tezzeract_verified`.
- Public profile pages render from `talents`, no auth required.

This keeps the marketplace populated without provisioning dormant accounts.

## 8. Service-to-service

Internal calls use short-lived (5 min) service tokens with `aud` scoped to the callee,
minted from a shared secret in the secret manager. **A service token never carries an
OrgContext** — the calling service passes org scope explicitly and the callee re-validates.
Inheriting tenant scope through service hops is how tenant boundaries quietly disappear.

## 9. Security requirements

- PKCE mandatory on every client; `redirect_uri` allow-listed exactly, no wildcards.
- Refresh tokens rotate on use; reuse detection revokes the whole session family.
- MFA required for `tezzeract_admin` and `tezzeract_internal`.
- Password reset and email change invalidate all sessions.
- Rate limits: 5 login attempts / 15 min / IP+email.
- **No token in a URL, ever** — query strings leak via referrers, logs, and history.

## 10. Gap vs. today

| Target | Today |
|---|---|
| Identity service, cross-domain SSO | Supabase Auth per-origin |
| Access token carries memberships | Token carries `{ userId, email }` |
| Access token in memory | `localStorage` ([`tokenManager.ts`](../../../client/src/shared/utils/tokenManager.ts)) |
| PKCE + allow-listed redirects | Popup `postMessage` bridge ([`oauth-callback.html`](../../../client/public/oauth-callback.html)) |
| Cross-org access audited | No roles, no audit |
| Rotating refresh tokens | None |
