# Infrastructure & Delivery

> Where it runs, how it ships, what it costs.

---

## 1. Platform choices

| Concern | Choice | Why |
|---|---|---|
| Web apps | Vercel | Next.js ISR for public SEO pages; preview per PR |
| Services | Fly.io → AWS ECS | Fly gives multi-region and cheap ops now; ECS when compliance demands VPC control |
| Postgres | Supabase (managed) | Already in use; PITR, branching, pgvector, RLS |
| Redis | Upstash → Elasticache | Serverless pricing early; managed when throughput justifies |
| Object storage | Cloudflare R2 | No egress fees — matters for talent portfolio media |
| Email | Resend | Transactional + React email templates |
| Secrets | Doppler → AWS Secrets Manager | Central rotation, per-env scoping |
| CDN/WAF | Cloudflare | DDoS, bot management, edge rules |

**We stay on managed services deliberately.** A team this size running its own Postgres HA
is a team not building Contelli.

## 2. Topology

```
Cloudflare (WAF, CDN)
   ├── tezzeract.com          Vercel — Next.js
   ├── app.tezzeract.com      Vercel — Vite SPA
   ├── contelli.co            Vercel — Vite SPA
   ├── auth.tezzeract.com     Fly — identity        (2+ instances, always warm)
   ├── api.tezzeract.com      Fly — gateway          (autoscale 2-10)
   ├── agent.tezzeract.com    Fly — orchestrator     (autoscale 2-8)
   └── ws.tezzeract.com       Fly — realtime         (sticky, 2+)
                                      │
                        Supabase Postgres + pgvector
                        Upstash Redis · R2
```

Identity and realtime are always warm. A cold start on the login path is felt by every
user of every property.

## 3. CI/CD

```
PR  → lint · typecheck · unit · dependency-cruiser · codegen-drift · migration-lint
    → preview deploy (ephemeral DB branch) · e2e smoke
main→ staging · integration · load (k6)
tag → production: migrate → canary 10% → 15min soak → full
```

Two gates that matter more than they look:

- **`dependency-cruiser`** fails the build on a `modules/* → modules/*` import. Without it,
  standalone sellability erodes one "just this once" import at a time.
- **`codegen-drift`** regenerates from Zod and fails if output differs. Without it, the
  agent's view of the API silently diverges from reality.

## 4. Migrations

Expand/contract, always:

```
1. Expand   — add nullable column / new table        (deploy, backwards compatible)
2. Backfill — batched, idempotent, resumable job
3. Migrate  — code reads new path, dual-writes
4. Contract — drop old column                        (separate release)
```

Never expand and contract in one release. Rollback must not require a down-migration —
down-migrations that touch data are usually a fiction.

## 5. Environments

| Env | Data | Access |
|---|---|---|
| local | seeded fixtures | all devs |
| preview | ephemeral branch | all devs |
| staging | synthetic | all devs |
| production | real | break-glass, audited |

**No production data below production.** Not anonymised, not "just to reproduce a bug".
This is the line most often crossed under delivery pressure, and crossing it turns a bug
into a breach.

## 6. Backup & recovery

- Postgres PITR, 30-day window; **restore rehearsed quarterly** — an untested backup is a
  hypothesis, not a backup.
- R2 versioning, 90 days.
- Targets: RPO 5 min, RTO 1 hour.
- Per-org logical export for GDPR portability and enterprise offboarding.

## 7. Cost model (order of magnitude, 50 orgs / 500 users)

| Item | Monthly |
|---|---|
| Vercel (4 apps, Pro) | ~$100 |
| Fly (4 services) | ~$250 |
| Supabase Pro + compute | ~$150 |
| Upstash, R2, Resend, Cloudflare | ~$100 |
| **Model inference** | **$400 – $2 000** |
| Observability | ~$100 |
| **Total** | **~$1 100 – $2 700** |

Inference is the only line that scales with usage rather than headcount, and the only one
that can surprise you by an order of magnitude. Controls: prompt-cache the system prompt
and tool catalog (the largest, most constant tokens), route classification to Haiku, cap
tool hops at 12, and alert on tokens-per-turn regression as a **release gate** — a prompt
change that doubles cost should fail CI, not appear on the invoice.

## 8. Scaling path

| Signal | Move |
|---|---|
| DB CPU > 70% sustained | Read replicas; route analytics reads |
| One module dominates load | Extract to its own service (package already self-contained) |
| Vector search p95 > 200ms | Dedicated vector store ([ADR-013](10-decisions.md#adr-013)) |
| Talk fan-out saturates | Shard realtime by channel hash |
| Event replay needed | Redis Streams → NATS JetStream ([ADR-011](10-decisions.md#adr-011)) |

Each is a named trigger, not a date. We move when the signal fires, not when someone feels
the system looks small.

## 9. On-call

Sev1 (auth down, data loss risk, cross-tenant leak) → page immediately, 15-min response.
Sev2 (a module down, agent unavailable) → business hours.

**Any suspected cross-tenant leak is automatically Sev1** regardless of blast radius, and
triggers the incident process in [17 §6](17-security-and-compliance.md).
