# Carve-Out Readiness

> *"What if I get an acquisition offer for one product?"* A strategic constraint on the
> architecture, not an afterthought. This document states what a carve-out actually costs,
> what we do now to keep it cheap, and what we deliberately decline to pay for.

---

## 1. The tension, stated honestly

**Single sign-on across every product is a core product promise. Clean carve-out
independence is a corporate-development option. They are in direct conflict.**

One Tezzeract account spanning contelli.co, talk.*, and tezzeract.com requires a shared
identity layer. That shared layer is precisely what an acquirer of one product must
untangle. Any design claiming to give both at zero cost is hiding the bill somewhere.

We resolve it as follows:

> Keep SSO — it is a differentiator customers pay for. Accept that a carve-out involves a
> **Transitional Service Agreement**. Engineer the seams so the TSA is **6 months, not 3
> years**.

TSAs are normal in software M&A. Buyers expect entanglement. What kills deals is not
shared infrastructure — it is *undiagnosable* entanglement: not knowing which customers
are whose, or code that will not build without the rest.

## 2. What a buyer actually needs

| # | Requirement | Status | Effort at carve-out |
|---|---|---|---|
| 1 | Builds and runs standalone | ✅ `apps/contelli-web` | none |
| 2 | Identifiable customers & revenue | ✅ entitlements + Stripe | none |
| 3 | Extractable product data | ✅ `pg_dump` one schema | days |
| 4 | Own domain, brand, shell | ✅ already separate | none |
| 5 | Owns its API contract | ✅ `/api/v1/contelli/*` | none |
| 6 | **Identity independence** | ⚠️ shared by design | **TSA, 6–18 months** |
| 7 | **Shared UI/SDK packages** | ⚠️ shared | licence or fork |

Rows 1–5 are free because of decisions already made. Rows 6 and 7 are the actual price,
and both are bounded.

## 3. Row 6 — identity, the real cost

Contelli's customers are `platform.organizations` with a `contelli` entitlement. Their
users are `platform.users`. That data does not belong to the Contelli schema.

**The carve-out path:**

```
1. Export the orgs/users holding a contelli entitlement (a clean query — §5)
2. Buyer stands up their own IdP
3. TSA: we serve auth.tezzeract.com for those orgs during migration
4. Users re-authenticate into the buyer's IdP (email verification, no password transfer)
5. Cut over; delete the exported orgs from our platform schema
```

What makes this 6 months rather than 3 years:

- **Contelli talks to identity through an interface, never to Supabase directly.**
  `@tezzeract/identity` exposes `verifyToken()`, `getOrgContext()`, `getUser()`. A buyer
  swaps the implementation; Contelli's code is untouched. This is
  [ADR-005](10-decisions.md#adr-005)'s seam earning its keep a second time.
- **`OrgContext` is a plain data structure**, not a Tezzeract-specific object. Any IdP can
  produce one.
- **No Tezzeract-specific claims** are required inside module code.

## 4. Row 7 — shared packages

`modules/contelli` depends on `@tezzeract/ui`, `@tezzeract/identity`, `@tezzeract/agent-sdk`.

Three options at sale, in ascending cost to us:

1. **Perpetual licence** — buyer keeps using them as-is. Cheapest, common in carve-outs.
2. **Fork and hand over** — buyer gets a snapshot and owns it thereafter.
3. **Buyer replaces** — most expensive for them; only if they have their own design system.

Because these are versioned npm packages rather than reached-into source, all three are
mechanical. The discipline that makes this true is the CI-enforced rule that
`modules/* → modules/*` imports are rejected ([15 §1](15-api-and-modules.md)) — it is also
what keeps a module's dependency list short enough to licence cleanly.

## 5. The queries that make a carve-out diagnosable

An acquirer's first diligence question is *"which customers and how much revenue?"* We
must answer in one query, not a data project:

```sql
-- Every organization holding the product
select o.*, s.plan, s.status, s.current_period_end
from platform.organizations o
join platform.entitlements  e on e.organization_id = o.id and e.module_id = 'contelli'
left join platform.subscriptions s on s.organization_id = o.id;

-- Contelli-only orgs — the cleanly transferable book of business
select o.id, o.name
from platform.organizations o
join platform.entitlements e on e.organization_id = o.id
group by o.id, o.name
having array_agg(e.module_id) = array['contelli'];
```

That second query is the important one. It separates **pure Contelli customers**
(transferable) from **Tezzeract suite customers who use Contelli** (not transferable — they
bought a bundle). Knowing that split precisely is what lets you price a deal.

## 6. What we deliberately do NOT pay for now

| Option | Would buy | Why we decline |
|---|---|---|
| Separate DB per product | Faster data split | Kills the identity path ([12 §8b](12-data-model.md)); saves days at a cost of permanent latency |
| Duplicate identity per product | True independence | **Destroys SSO** — the product promise |
| No FKs into `platform` | Trivially detachable schemas | Loses referential integrity + GDPR cascade. And `ALTER TABLE … DROP CONSTRAINT` is a one-line migration, so the option is retained for free |
| Separate Stripe accounts | Clean revenue split | Entitlement queries already give the split |

The FK row is the one worth internalising: **an FK is cheap to add and cheap to drop.**
Declining a hard FK today to preserve a hypothetical future option is paying real
correctness cost for something you can obtain later in one statement. Do not confuse
"reversible" with "must be avoided".

## 7. The carve-out drill

Optionality decays silently. Verify it on a schedule — annually, or before any raise:

```
1. Fresh clone → build apps/contelli-web only. Does it succeed?
2. Grep modules/contelli for imports from other modules. Zero?
3. pg_dump --schema=contelli → restore to an empty instance. Clean?
4. Run the §5 queries. Do the numbers reconcile with Stripe?
5. Stub @tezzeract/identity with a fake IdP. Does Contelli still boot?
```

Step 5 is the real test and the one that will fail first. It is also the cheapest to keep
passing: an integration test with a mock identity provider, running in CI.

## 8. What this buys commercially

Carve-out readiness is not only about exits:

- **Valuation.** Diligence that surfaces clean boundaries prices higher than one that finds
  a tangle. Buyers discount for integration risk.
- **Partnerships.** White-labelling or reselling Contelli uses the same seams.
- **Focus.** The discipline that makes a product sellable is the same discipline that keeps
  it independently *buildable* — the daily benefit is a team that can ship Contelli
  without understanding Talk.

The last point is the one that pays every week, whether or not an offer ever arrives.
