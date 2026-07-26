# CRM

Client relationships, engagements, and placements.

**Status:** not started. Recommended to **build natively** rather than adapt an
off-the-shelf CRM — this module sits directly adjacent to the talent graph (client ↔
engagement ↔ outcome), and a generic CRM's object model would need heavy reshaping to fit
that, at which point owning it outright is both cheaper and better integrated.

## Deep dives

- **[Substrate Strategy](../architecture/technical/33-substrate-strategy.md)** — §5 covers
  the build-vs-adapt reasoning for CRM specifically
- **[Talent Graph](../architecture/technical/32-talent-graph.md)** — the data CRM needs to
  stay adjacent to rather than fight
