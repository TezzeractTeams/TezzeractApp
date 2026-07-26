# The Talent Graph — The Compounding Moat

> The one subsystem that gets *better* with use, and therefore the one an acquirer or
> investor can underwrite. Everything else in Tezzeract can be rebuilt by a competent team
> in a year; this cannot, because it requires data only accumulated by operating.

---

## 1. The thesis

Individual talent matching is commodity. LinkedIn, Upwork and Toptal all do
"find me a React developer" adequately, and an LLM over a résumé corpus does it passably.

**Team composition is not commodity.** "Build me a team to ship a fintech mobile app in
Q3, under €40k/month, overlapping CET" is a *constrained set-selection* problem with
complementarity, coverage, availability and budget interacting. Nobody solves it well.

And one signal makes it defensible:

> **The co-work success graph.** LinkedIn knows who worked at the same company. We know
> who *delivered successfully together* — because we placed them, measured the engagement,
> and recorded the outcome.

That edge cannot be scraped, bought, or inferred. It only accrues by operating a
marketplace, and it compounds: every placement sharpens every future recommendation.

**Immediate implication:** instrument outcomes from the *first* placement, twelve months
before there is enough data to train on. The alternative is starting the flywheel a year
late — and at a 12–18 month horizon, that is the difference between a data moat at raise
and a promise of one.

## 2. The flywheel

```
    request ──► match ──► placement ──► engagement ──► outcome
                  ▲                                       │
                  └──── reranker ◄── labels ◄── telemetry ─┘
```

| Stage | Captured |
|---|---|
| Request | Parsed roles, skills, constraints, budget, timezone |
| Match | Candidates surfaced, ranked, and **which were rejected** |
| Placement | Who was chosen, team shape, start date |
| Engagement | Hours, deliverables, Talk/task activity, tenure |
| Outcome | Client rating, renewal, rehire, early termination + reason |

**Negative signals matter as much as positive ones.** A candidate shown and skipped is a
label. Most teams log only what was chosen and lose half their training signal.

## 3. Data model

```sql
create schema graph;

-- Normalised skills. Free text is fatal: "React" / "React.js" / "ReactJS"
-- must resolve to one node or every downstream signal is diluted.
create table graph.skills (
  id          text primary key,              -- 'react'
  label       text not null,
  aliases     text[] not null default '{}',
  category    text,                          -- language | framework | domain | tool | soft
  embedding   vector(1024),
  parent_id   text references graph.skills(id)   -- react → javascript → programming
);

create table graph.talent_skills (
  talent_id     uuid references talent.talents(id) on delete cascade,
  skill_id      text references graph.skills(id),
  proficiency   smallint,                    -- 1-5, evidence-weighted
  years         numeric(3,1),
  evidence      text[],                      -- 'self' | 'portfolio' | 'assessment' | 'outcome'
  confidence    real not null default 0.5,   -- rises with corroborating evidence
  primary key (talent_id, skill_id)
);

-- Multi-vector representation: one embedding cannot carry skills,
-- domain, and working style without collapsing all three.
create table graph.talent_vectors (
  talent_id   uuid primary key references talent.talents(id) on delete cascade,
  v_skills    vector(1024),
  v_domain    vector(1024),
  v_style     vector(512),
  updated_at  timestamptz not null default now()
);

-- ★ The moat ★ — who delivered well together
create table graph.cowork_edges (
  talent_a        uuid not null,
  talent_b        uuid not null,
  engagements     int not null default 1,
  joint_outcome   real,                      -- aggregate success, -1..1
  last_together   date,
  primary key (talent_a, talent_b),
  check (talent_a < talent_b)
);

create table graph.engagement_outcomes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id),
  team_id         uuid not null,
  talent_id       uuid not null,
  started_at      date not null,
  ended_at        date,
  end_reason      text,                      -- completed | renewed | early_term_client | early_term_talent
  client_rating   smallint,
  renewed         boolean,
  rehired         boolean,
  created_at      timestamptz not null default now()
);
```

`graph.cowork_edges` is the table to protect. It is the asset.

## 4. Matching pipeline

Four stages, each cheap enough to precede the next.

```
Request
  │
  ├─ 1. Parse      LLM → structured spec (roles, skills, constraints, budget)
  │                Zod-validated; ambiguity → clarifying question, never a guess
  │
  ├─ 2. Generate   Structured pre-filter → ANN over pgvector
  │                availability × timezone × rate × standing, then vector search
  │                ~10k → ~200 candidates
  │
  ├─ 3. Rank       Gradient-boosted trees over structured features
  │                ~200 → ~40 per role
  │
  └─ 4. Assemble   Constrained set selection over roles
                   → 3 candidate teams + explanation
```

### Stage 2 — filter before you search

Pre-filter structurally, *then* run ANN. Reversing this is the classic vector-search
mistake: ANN over the whole corpus followed by filtering returns too few valid results and
degrades badly as filters tighten.

### Stage 3 — features, not vibes

```
skill_coverage · proficiency_weighted_fit · domain_similarity
timezone_overlap_hours · rate_fit · availability_start_delta
past_outcome_score · rehire_rate · response_latency
tenure_median · early_termination_rate
```

**Cold start is real and must be planned for.** With no outcome data, stage 3 is a
hand-weighted heuristic plus LLM-as-judge on the top ~40. As
`graph.engagement_outcomes` accumulates (~500+ labelled placements), swap in a learned
ranker behind the same interface. Design the interface now; train later.

### Stage 4 — team assembly is the differentiator

Select set *S* maximising

```
  Σ coverage(S, required_skills)          skills actually covered
+ λ₁ · complementarity(S)                 penalise near-duplicate profiles
+ λ₂ · cowork_affinity(S)                 ★ proven joint delivery
+ λ₃ · timezone_overlap(S)
− λ₄ · budget_overrun(S)
```

The objective is **submodular** (each additional member adds diminishing coverage), so
greedy selection gives a `(1 − 1/e)` approximation guarantee at a fraction of the cost of
exact optimisation. For teams of 3–8 from ~40 candidates per role this runs in
milliseconds.

`cowork_affinity` is the term no competitor can compute.

## 5. Serving architecture

```
services/talent-graph
├── embeddings/     batch + incremental; queue-driven on profile change
├── matching/       stages 1-4; p95 < 800ms end to end
├── features/       feature store, point-in-time correct
└── training/       offline; nightly aggregates, periodic reranker retrain
```

Separate service because the workload is different in kind — batch embedding and model
inference should never share a process with request-path CRUD.

**Point-in-time correctness matters.** Training on features as they are *today* rather than
as they were *at decision time* leaks future information and produces a model that looks
excellent offline and fails in production. This is the single most common way ranking
systems go wrong.

## 6. Cold start, honestly

| Phase | Placements | Ranking | Team assembly |
|---|---|---|---|
| 0–6 mo | 0–50 | Heuristic + LLM judge | Coverage + timezone only |
| 6–12 mo | 50–300 | Heuristic + outcome prior | + early cowork edges |
| 12–18 mo | 300–1000 | **Learned reranker** | Full objective |
| 18 mo+ | 1000+ | Reranker + bandit exploration | Tuned λ weights |

Two disciplines from day one, both cheap and both irreversible if skipped:

1. **Log every impression, not just every placement.** Shown-and-rejected is a label.
2. **Reserve ~10% of recommendations for exploration.** A purely greedy system only ever
   learns about talent it already ranks highly — the classic feedback-loop trap that
   quietly caps a marketplace's quality ceiling.

## 7. Agent integration

The graph is exposed as Kernel tools, so the conversational flow in your structural diagram
is the same machinery:

```ts
'talent.parse_requirement'   // NL → structured spec
'talent.find_candidates'     // spec → ranked, per role
'talent.compose_team'        // spec → 3 candidate teams + rationale
'talent.explain_match'       // why this person, grounded in features
'talent.swap_member'         // re-optimise holding the rest fixed
```

`explain_match` matters commercially: a client who understands *why* a team was proposed
converts better than one handed a list. Ground the explanation in actual feature values —
never let the model invent a rationale.

## 8. Privacy

Talent data is personal data, and this is where an otherwise-good system creates legal risk.

- Public profile embeddings live in the `public:talent` namespace; **engagement outcomes
  never do**.
- `cowork_edges` and outcome data are Tezzeract-internal. A client sees *"strong prior
  collaboration"*, never another client's ratings.
- Talent can view and contest their own outcome data.
- No protected characteristics as features — and audit for proxies (postcode, university,
  name-derived signals), which is where discrimination enters ranking systems unnoticed.
- Fairness monitoring on recommendation distribution by geography and demographic proxy.
  EU AI Act obligations plausibly attach to employment-related recommender systems; assume
  they do and instrument accordingly.

## 9. Why this is the IP

| Asset | Replicable by a funded competitor? |
|---|---|
| Skills ontology | Yes — months |
| Matching pipeline | Yes — months |
| **Outcome-labelled placements** | **No — requires operating for years** |
| **Co-work success graph** | **No — unobtainable any other way** |
| Team composition objective tuned on real outcomes | **No — needs the data above** |

The code is worth something. **The graph is worth the valuation.** Which is why the single
most important engineering decision in the next six months is to instrument outcomes before
you can use them.
