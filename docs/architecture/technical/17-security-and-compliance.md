# Security & Compliance

> B2B buyers will run a security review before signing. This is what we need to be able to
> answer, and the controls behind each answer.

---

## 1. Threat model

| Threat | Impact | Control |
|---|---|---|
| **Cross-tenant data leak** | Existential | RLS + OrgContext + org-partitioned vectors |
| **Agent exfiltrates across orgs** | Existential | `organizationId` unrepresentable as a model input |
| Prompt injection via tool results | High | Untrusted-content wrapping + confirm-before-mutate |
| Credential leak | High | Secret manager, scanning, rotation |
| OAuth token theft (Contelli) | High | Encrypted at rest, org-scoped, short-lived |
| Privilege escalation via roles | High | Two-axis check on every write |
| XSS → token theft | Medium | Access token in memory, CSP, httpOnly refresh |

The top two are the ones that end the company. Everything else is recoverable.

## 2. Tenant isolation — defence in depth

Four independent layers. Any one failing is a bug; two failing together is a breach.

```
1. Token      — memberships in signed claims (13 §2)
2. Gateway    — OrgContext, server-derived (ADR-007)
3. Service    — WHERE organization_id = ANY(ctx.orgIds)
4. Database   — RLS policies (12 §8)
```

Plus, for the agent: vector namespaces are **physical partitions**, not filters
([ADR-013](10-decisions.md#adr-013)).

### Continuous verification

A nightly job creates two orgs with known data and asserts that every list endpoint,
every tool, and every vector namespace returns only the caller's rows. It fails loudly.

Isolation is not something you verify once at design time — it is something that breaks
later, quietly, in a query someone added on a Friday.

## 3. Secrets

**Current state is a live incident.** Real Supabase anon **and service_role** keys are
committed in [`SUPABASE_SETUP_GUIDE.md:48`](../../../SUPABASE_SETUP_GUIDE.md) and
[`server/ENV_SETUP.md:16`](../../../server/ENV_SETUP.md) (twice). The service_role key
bypasses RLS entirely — every control in §2 is void for anyone holding it.

Remediation, in order:
1. **Rotate both keys now.** Removal is insufficient; they are in git history.
2. Purge history (`git filter-repo`), force-push, invalidate forks.
3. Replace with placeholders.
4. Add `gitleaks` to pre-commit **and** CI.
5. Audit Supabase logs for use of the exposed key.

Going forward: all secrets in Doppler, none in the repo, service_role key used only by
server-side services that genuinely need to bypass RLS, and rotation every 90 days.

## 4. Application security

- **CSP** with nonces; no `unsafe-inline`. HSTS preload. `X-Frame-Options: DENY`.
- **Input validation** — Zod at every boundary. Reject unknown keys (`.strict()`).
- **SQL** — parameterised only; no string interpolation, ever.
- **File uploads** — type sniffed, size capped, served from R2 on a separate origin.
- **CORS** — explicit allow-list, never reflecting `Origin`, `credentials: true` only for
  known apps.
- **Dependencies** — Dependabot, `pnpm audit` in CI, lockfile committed.

Two fixes owed today: [`App.tsx`](../../../client/src/App.tsx) exposes `/talent` and
`/social` unauthenticated, and
[`oauth-callback.html:59`](../../../client/public/oauth-callback.html) posts
`oauth-success` when neither `success` nor `error` is present — a bare callback reports a
successful connection.

## 5. Compliance posture

**GDPR** is the design target; the controls generalise to SOC 2.

| Obligation | How the architecture satisfies it |
|---|---|
| Right to erasure | `organization_id` on every row → single cascade per org |
| Portability | Per-org logical export ([16 §6](16-infrastructure.md)) |
| Data minimisation | Never log tenant payloads; PII redacted in traces |
| Residency | `organizations.data_region`; EU-first deployment |
| Processor agreements | DPAs with Supabase, Anthropic, Stripe, Vercel, Fly |
| Breach notification | 72h; incident runbook in §6 |
| Audit trail | `platform.audit_log`, append-only, partitioned |

**AI-specific disclosures** buyers now ask for, and our answers:

- *Is our data used to train models?* No — zero-retention API tiers, contractually.
- *Can staff see our data?* Only `tezzeract_admin`, only with explicit intent headers,
  time-boxed and logged with `cross_org = true` ([13 §6](13-identity-and-sso.md)).
- *Can the AI mix our data with another customer's?* No — one org per thread, enforced by a
  database trigger, with org-partitioned retrieval.

That third answer is the one that wins or loses enterprise deals, and it is why control 2
in [14 §7](14-agent-runtime.md) is non-negotiable.

## 6. Incident response

```
Detect → Contain → Assess → Notify → Remediate → Post-mortem
```

- Suspected cross-tenant leak is **automatically Sev1**, whatever the apparent scope.
- Containment may include revoking all sessions and disabling the agent — both need a
  tested one-command path, not an improvised one.
- Assessment uses `audit_log` to establish exactly which orgs and records were touched.
- 72-hour GDPR notification clock starts at *awareness*, not at resolution.
- Blameless post-mortems, published internally within a week.

## 7. Access control

- MFA mandatory for `tezzeract_admin` and `tezzeract_internal`.
- Production access is break-glass: time-boxed, reason-tagged, alerted to the team channel.
- Least privilege on every service account; no shared credentials.
- Quarterly access review — memberships and standings both drift as people change roles.

## 8. Roadmap

| Phase | Deliverable |
|---|---|
| Immediate | Rotate leaked keys, purge history, add `gitleaks` |
| Phase 0 | RLS everywhere, close public routes, audit log |
| Phase 1 | Isolation test suite, CSP, dependency scanning |
| Phase 2 | Pen test, DPAs, security page, SOC 2 readiness assessment |
| Phase 3 | SOC 2 Type II, SAML/SCIM for enterprise |

SOC 2 is not a document exercise — it is mostly evidence that the controls above have been
running continuously for months. Starting the evidence trail early is what makes the audit
cheap later.
