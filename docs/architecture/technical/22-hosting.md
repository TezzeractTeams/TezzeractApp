# Hosting — How It Actually Runs

> The operational map: which domain points where, how a request travels, and the
> cross-origin details that are easy to get wrong. Cost model is in
> [16 §7](16-infrastructure.md).

---

## 1. The map

| Domain | Platform | What it is | Why there |
|---|---|---|---|
| `tezzeract.com` | Vercel | Next.js — marketing, blog, portfolios, talent profiles | ISR + edge CDN for SEO |
| `app.tezzeract.com` | Vercel | Vite SPA — the suite shell | Static + CDN |
| `contelli.co` | Vercel | Vite SPA — standalone Contelli | Static + CDN |
| `talk.*` | Vercel | Vite SPA — standalone Talk | Static + CDN |
| `api.tezzeract.com` | Fly.io | NestJS gateway | Long-lived process, DB pooling |
| `auth.tezzeract.com` | Fly.io | Identity service | Always warm — on every login path |
| `agent.tezzeract.com` | Fly.io | Agent orchestrator | Long SSE streams |
| `ws.tezzeract.com` | Fly.io | Realtime (Talk) | Stateful WebSockets |
| — | Supabase | Postgres + pgvector | Managed, PITR, branching |
| — | Upstash | Redis | Cache, OrgContext, event streams |
| — | Cloudflare R2 | Object storage | No egress fees |

**The split is about workload shape, not preference.** Vercel serves static assets and
server-rendered pages from the edge — perfect for SEO pages, useless for a process holding
5 000 WebSocket connections. Fly runs long-lived containers close to the database, which is
what every service here needs.

## 2. DNS and proxying — gotcha #1

Cloudflare hosts DNS for all domains, but **the proxy setting differs by target**:

```
tezzeract.com        CNAME → vercel     🔘 DNS only  (grey cloud)
app.tezzeract.com    CNAME → vercel     🔘 DNS only
contelli.co          CNAME → vercel     🔘 DNS only
api.tezzeract.com    CNAME → fly        🟠 Proxied   (orange cloud)
auth.tezzeract.com   CNAME → fly        🟠 Proxied
agent.tezzeract.com  CNAME → fly        🟠 Proxied
ws.tezzeract.com     CNAME → fly        🟠 Proxied
```

**Do not proxy Vercel through Cloudflare.** Two CDNs stacked cause certificate
provisioning failures, cache-invalidation conflicts, and redirect loops. Vercel already
provides its own edge network, DDoS protection, and TLS.

Fly services *do* get proxied — that is where Cloudflare's WAF, rate limiting, and bot
management earn their place, in front of our own compute.

## 3. Request flow

```
Browser → app.tezzeract.com
   └─► Vercel edge — cached SPA shell, ~20ms

SPA → api.tezzeract.com/api/v1/contelli/scheduled-posts
   └─► Cloudflare (WAF, rate limit)
        └─► Fly load balancer → nearest healthy gateway instance
             ├─ verify JWT (JWKS cached in memory)
             ├─ OrgContext ──► Upstash Redis  (~0.8ms hit)
             ├─ route to the Contelli module handler
             └─ query ──► Supabase Postgres via Supavisor pooler
        ◄── JSON envelope
```

Agent turns take the same path to `agent.tezzeract.com` and hold an SSE stream open for
the duration of the turn — which is why the orchestrator runs on Fly rather than a
serverless platform with execution timeouts.

## 4. Cookies across domains — gotcha #2

This is the subtlest part of the whole setup, and it follows from having genuinely
different registrable domains (`tezzeract.com` vs `contelli.co`).

| Token | Where it lives | Scope |
|---|---|---|
| SSO session | `auth.tezzeract.com` | Only ever sent to Identity |
| Refresh token | **per app origin** — one on `contelli.co`, one on `app.tezzeract.com` | Path-scoped to that app's refresh endpoint |
| Access token | memory (JS variable) | Sent as `Authorization: Bearer` |

**A cookie set on `.tezzeract.com` will never be sent from `contelli.co`.** They are
different sites; no `SameSite` value changes that. So each app receives *its own* refresh
token during its OIDC callback ([13 §3](13-identity-and-sso.md)), while the shared SSO
session lives only on the Identity domain — which is exactly what makes the silent
re-login in [13 §4](13-identity-and-sso.md) work.

The access token sidesteps the problem entirely by being a header, not a cookie. That is
also why it must live in memory rather than `localStorage` — see
[17 §4](17-security-and-compliance.md).

CORS on the gateway is an explicit allow-list:

```ts
origin: ['https://app.tezzeract.com', 'https://contelli.co', 'https://talk.tezzeract.com'],
credentials: true,
```

Never reflect `Origin`. Never use a wildcard with credentials.

## 5. Environments

| Env | Web | Services | Database |
|---|---|---|---|
| Preview (per PR) | Vercel preview URL | Fly ephemeral app | Supabase branch |
| Staging | `staging.tezzeract.com` | `*-staging` Fly apps | Separate project |
| Production | live domains | `*-prod` Fly apps | Production project |

Vercel creates preview deployments automatically per PR. Fly ephemeral apps and Supabase
branches are created and destroyed by the CI workflow in
[21 §6](21-ci-cd.md).

**No production data below production** ([16 §5](16-infrastructure.md)) — this is the line
most often crossed under delivery pressure.

## 6. Deploys

```
Vercel     git integration + turbo-ignore
           → only rebuilds when that app's dependency graph changed
           → atomic swap, instant rollback to any prior deployment

Fly        GitHub Actions → docker build → flyctl deploy
           → rolling, health-checked
           → `fly releases rollback` for instant revert

Supabase   migrations run from CI before the Fly deploy
           → expand-only, forward-only ([21 §8](21-ci-cd.md))
```

`services/realtime` needs special handling: a naive rolling deploy drops live WebSocket
connections. Drain first, then roll — clients reconnect with backoff.

## 7. Regions and residency

EU-first, matching `organizations.data_region` defaulting to `eu`:

- Fly: `fra` primary, `iad` secondary when US traffic justifies it
- Supabase: `eu-central-1`
- R2: automatic, EU jurisdiction restriction enabled
- Vercel: static assets global; Next.js functions pinned to `fra`

Keep compute in the same region as the database. A gateway in `iad` querying Postgres in
`eu-central-1` adds ~90ms to *every query* — enough to make a fast application feel broken.
When US expansion comes, it means read replicas plus regional routing, not simply another
app instance.

## 8. Scaling knobs

| Service | Config | Notes |
|---|---|---|
| `gateway` | 2–10 instances, autoscale on CPU | Stateless |
| `identity` | min 2, always warm | Cold start on the login path is felt by everyone |
| `agent` | 2–8, scale on concurrent streams | Long-lived SSE |
| `realtime` | min 2, sticky, shard by channel | Stateful — the hard one |
| Vercel | automatic | No configuration |
| Supabase | vertical, then read replicas | See [19 §4.2](19-scale-model.md) |

## 9. What you actually buy

```
Cloudflare   domains + DNS + WAF          (free tier → Pro)
Vercel       Pro, one team, 4 projects
Fly.io       one org, 4 apps × 3 envs
Supabase     Pro × 2 projects (staging, prod)
Upstash      Redis, pay-per-request
Doppler      secrets, per-seat
Sentry + Axiom  errors + logs
```

Roughly $1.1k–2.7k/month at 50 orgs / 500 users — but see
[19 §4.1](19-scale-model.md): **inference dwarfs all of this** at any real scale.

## 10. Why not one VPS, or full AWS?

**One VPS** — cheaper and simpler until the first incident. No managed failover, no PITR,
no autoscale, and every hour spent on `apt upgrade` is an hour not spent on Contelli.
Wrong trade for a 3–4 person team.

**Full AWS (ECS/RDS/ElastiCache)** — where we end up, but not where we start. It is
strictly more capable and roughly 3× the operational surface: VPCs, security groups, IAM,
ALBs, Terraform. Adopt it when compliance requires VPC-level control or when spend makes
the reserved-instance discount real.

The migration path is deliberately short: services are already containers with health
checks and 12-factor config. Moving Fly → ECS is a deployment-target change, not a rewrite.
That property is worth more than the platform choice itself.
