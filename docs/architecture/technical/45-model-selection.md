# Model Selection — The Whole Market

> Choosing across Anthropic, OpenAI, Google, Chinese labs, and open weights.
> Extends [44-token-economics.md](44-token-economics.md).
>
> ⚠️ **Only the Anthropic prices here are verified (2026-07-26). Everything else is
> approximate and moves fast — treat the framework as durable and the numbers as a starting
> point to re-verify.**

---

## 1. The constraint that decides this — and it isn't cost

Before comparing a single price, classify the data:

| Class | Examples | Eligible providers |
|---|---|---|
| **A — Public** | Marketplace search queries, public talent profiles, blog content | **Anyone.** Optimise purely on cost and latency |
| **B — Tenant data** | Org messages, tasks, CRM records, engagement outcomes | Named in a DPA, in-jurisdiction, no-training guarantee |
| **C — Moat data** | `cowork_edges`, engagement outcomes, matching features | Class B **plus** the smallest possible surface |

> **Data classification determines the eligible provider set. Cost determines the choice
> within it.** Not the other way round.

This is not caution for its own sake — it is a procurement reality. Your mixed
self-serve→enterprise GTM means security questionnaires asking *"list every subprocessor
that touches our data, and where it runs."* An answer that includes a jurisdiction with no
EU adequacy decision loses deals, and it undermines the compliance posture in
[17](17-security-and-compliance.md). It also affects diligence: your IP thesis
([31](31-ip-strategy.md)) rests on the co-work graph, and routing it through a third party
weakens that story.

**The good news is that Class A is where the money is** — the public marketplace is your
highest-volume path and carries no tenant data at all.

## 2. The landscape

Approximate $/M input–output. **Verify before committing.**

### Frontier — tool-calling reliability
| Model | ~$/M in | ~$/M out | Notes |
|---|---|---|---|
| **Claude Opus 4.8** | **$5** | **$25** | ✅ verified |
| **Claude Sonnet 5** | **$3** | **$15** | ✅ verified (intro $2/$10 to 2026-08-31) |
| GPT-5 class (OpenAI) | ~$1–3 | ~$8–15 | Strong tool use; verify current tier names |
| Gemini 3 Pro (Google) | ~$1–3 | ~$8–15 | Long context; competitive batch pricing |

### Mid / cheap — classification, extraction
| Model | ~$/M in | ~$/M out | Notes |
|---|---|---|---|
| **Claude Haiku 4.5** | **$1** | **$5** | ✅ verified |
| Gemini Flash / Flash-Lite | ~$0.10–0.40 | ~$0.40–1.50 | Very strong price/perf at this tier |
| GPT-5 mini/nano class | ~$0.10–0.50 | ~$0.40–2 | |

### Chinese labs — the price floor
| Model | ~$/M in | ~$/M out | Notes |
|---|---|---|---|
| **DeepSeek V3/R1** | ~$0.15–0.30 | ~$0.30–1.20 | Off-peak discounts; **open weights** |
| **Qwen 3 (Alibaba)** | ~$0.10–0.50 | ~$0.30–1.50 | Excellent multilingual; **open weights** |
| **Kimi K2 (Moonshot)** | ~$0.15–0.60 | ~$0.60–2.50 | Strong agentic/coding; **open weights** |
| GLM (Zhipu), MiniMax | ~$0.10–0.60 | ~$0.30–2 | |

**10–30× cheaper than frontier at the sticker.** That is real and worth engineering for.

### Open weights via Western/EU inference hosts
Together · Fireworks · Groq · Cerebras · DeepInfra · Baseten · Scaleway (EU) · OVH (EU)

Llama, Mistral, **and the Chinese open-weight models above** — served from infrastructure
you choose.

## 3. 🔑 The unlock: open weights, hosted in your jurisdiction

This is the finding that matters most, and it dissolves the apparent trade-off.

DeepSeek, Qwen, and Kimi publish **open weights**. You do not have to call their hosted API
to get their economics:

```
❌  Your data ──► api.deepseek.com          cheap, but a data-transfer problem
✅  Your data ──► Together / Groq / Scaleway ──► DeepSeek weights
                  (US or EU infrastructure, DPA-able, no-training terms)
```

Roughly 1.5–3× the raw Chinese API price — still **5–15× cheaper than frontier** — while
keeping a subprocessor you can name in a security questionnaire and a region you can
attest to.

**This is the recommended path for cost-sensitive Class B workloads.** You get most of the
saving without the procurement and compliance cost.

## 4. Routing policy

| Workload | Class | Recommendation | Why |
|---|---|---|---|
| **Public marketplace parse** | A | **Cheapest capable** — Gemini Flash-Lite, hosted Qwen/DeepSeek, or Haiku | Highest volume, zero tenant data. Optimise hard here |
| **Embeddings** | A/B | Cheapest quality-adequate; **self-hostable for Class C** | Volume workload; open embedding models are excellent |
| **Titling, summarising, classification** | B | Cheap tier, in-jurisdiction | Small output space, low stakes |
| **Agent tool-calling** | B | **Frontier — Sonnet 5 or equivalent** | Reliability dominates cost (§5) |
| **Team composition, matching** | C | Frontier, in-jurisdiction, minimal surface | Touches the moat |
| **Batch aggregation, digests** | B | Cheap tier + Batch API (~50% off) | No user waiting |

The consistent shape: **be aggressive on Class A and on non-agentic Class B; be
conservative where tool calls must land and where the moat lives.**

## 5. Why frontier still wins for tool calling

Sticker price is the wrong metric for agentic work. What matters is **cost per successful
task**:

```
effective cost = (price/turn) × (attempts to succeed) + (cost of a wrong action)
```

A model that is 10× cheaper but needs 3 attempts is only ~3× cheaper — and every failed
tool call is latency the user feels plus, potentially, a wrong action taken in a customer's
account. In an agentic loop, tool-selection and argument-formatting errors compound across
hops, so a small per-hop reliability gap becomes a large end-to-end one.

Cheap models close this gap steadily. **Re-measure quarterly** — that is why ADR-010 exists.

## 6. Measure, don't guess

Never choose a model from a price table or a public leaderboard. Build a small harness
before switching anything:

```
tests/model-eval/
├── talent-parse.jsonl        200 real queries → expected roles/skills
├── tool-selection.jsonl      100 turns → expected tool + arguments
└── team-compose.jsonl         50 requests → constraint satisfaction
```

Score each candidate on: **task success rate · cost per *successful* task · p95 latency ·
format-failure rate**. Then rank on the second column — not the sticker.

Two days of work, and it makes every future model decision evidence-based rather than
vibes-based. It also gives you a real answer for investors on model strategy.

## 7. Architecture

Nothing here changes the design. `ModelProvider` ([ADR-010](10-decisions.md#adr-010))
already abstracts the vendor; this adds a **routing policy** in front of it:

```ts
interface ModelRoute {
  workload: 'public_parse' | 'classify' | 'agent_tools' | 'compose' | 'batch';
  dataClass: 'A' | 'B' | 'C';
  provider: string;
  model: string;
  region: 'eu' | 'us';
  fallback?: { provider: string; model: string };
}
```

Three properties to preserve:

1. **Data class is enforced in code, not convention.** A Class B workload cannot be routed
   to a provider not on its allow-list — make it a type error, not a code review.
2. **Every route has a fallback** on a different provider. Outages are routine.
3. **Routes are configuration**, changeable without a deploy, and every change is audited.

**OpenRouter** is worth using during evaluation — one API across many providers makes the
§6 harness cheap to run. For production Class B traffic, prefer a direct contract with a
named subprocessor.

## 8. What I'd actually do

| Phase | Action |
|---|---|
| **Now** | Public marketplace on the cheapest capable model — it is Class A, zero compliance cost, highest volume |
| **Now** | Precomputed lookup + semantic cache ([44 §4](44-token-economics.md)) — beats *any* model choice |
| **Q3** | Build the eval harness (§6). Two days |
| **Q3** | Agent tool-calling on frontier. Revisit with data, not opinion |
| **Q4** | Evaluate hosted open weights (§3) for Class B classification |
| **Ongoing** | Re-run the harness quarterly. Prices drop ~2–4× per year |

**The single biggest cost lever is still not calling a model at all** ([44 §4](44-token-economics.md)).
A cache hit is cheaper than the cheapest model in this document, and no provider comparison
beats a lookup table.
