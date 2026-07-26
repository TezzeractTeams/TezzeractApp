# Design System — Unified, With Distinct Identities

> "Just like Uber and Uber Eats." One system, recognisably one family, each product
> keeping its own face.

---

## 1. The model

Three layers. A module may only touch the top one.

```
┌───────────────────────────────────────────────┐
│ 3. Module surface                             │  Contelli's dashboards,
│    composed from layer 2, no bespoke CSS      │  Talent's cards, Talk's threads
├───────────────────────────────────────────────┤
│ 2. @tezzeract/ui — primitives                 │  Button, Card, Input, Table,
│    brand-agnostic, consume layer 1 tokens     │  Modal, Tabs, Toast…
├───────────────────────────────────────────────┤
│ 1. Tokens — core + per-brand overlay          │  color, type, space, radius,
│    the ONLY place brand differs               │  elevation, motion
└───────────────────────────────────────────────┘
```

**A module never hardcodes a colour.** If Contelli needs to look like Contelli, that
happens by swapping a token overlay, not by writing `#00A9EE` into a component. This is
the rule that makes "unified but distinct" hold at scale — and the rule that will be
broken first if it isn't enforced in review.

## 2. Tokens

Core (shared, never overridden): spacing scale, radii, elevation, motion curves,
typographic scale, semantic states (success / error / warning / info).

Per-brand overlay: `brand.primary`, `brand.accent`, `brand.gradient`, logo, wordmark, and
optionally a display typeface.

```ts
export const tezzeract: BrandTokens = {
  id: 'tezzeract',
  primary: '#00378A',
  accent: '#00A9EE',
  gradient: 'linear-gradient(135deg, #00378A 0%, #00A9EE 100%)',
};
export const contelli: BrandTokens = { id: 'contelli', /* … */ };
```

Applied as CSS custom properties at the shell root; module subtrees may scope their own
overlay. Same component, same code, different face in each shell.

Existing brand facts worth preserving: the `#00378A → #00A9EE` gradient is already the
Tezzeract signature (it's in `VerticalSidebar.tsx` and `ARCHITECTURE.md`), and **Figtree**
is the typeface.

## 3. Primitive rules

- **Composition over configuration.** `<Card><Card.Header/><Card.Body/></Card>` beats a
  component with fourteen boolean props. Boolean-prop explosion is how design systems
  die.
- **No business logic in `@tezzeract/ui`.** No API calls, no store access, no routing. A
  primitive that fetches cannot be reused.
- **Accessible by default** — focus rings, keyboard nav, ARIA, contrast. Not a later pass.
- **Dark mode via tokens** from the start. Retrofitting is far more expensive.
- **One primitive per job.** The current `Button.tsx` / `TezzeractButton.tsx` /
  `TezzeractSendButton.tsx` split is exactly the fragmentation to avoid: one `Button` with
  variants, and `SendButton` composed from it.

## 4. Developer experience

The goal is that reaching for the shared component is *easier* than writing a new one.

- Storybook, one instance, every primitive, browsable per brand.
- Copy-pasteable usage docs on every component.
- An ESLint rule banning raw hex colours and arbitrary Tailwind values in `modules/*`.
- Contribution path: propose in Storybook → review → land in `@tezzeract/ui`.

The lint rule matters more than it looks — it's what converts "we agreed to use tokens"
into something that survives a deadline.

## 5. Layout conventions

The shell owns the frame; modules own only the viewport:

```
┌──────┬─────────────────┬───────────────────────────┐
│ Rail │  Agent panel    │   Module viewport         │
│ 80px │  resizable      │   ← the module owns ONLY  │
│      │  persistent     │      this region          │
└──────┴─────────────────┴───────────────────────────┘
```

Standalone shells (contelli.co) render the same viewport without the rail, and with the
agent panel optional — which is why the module must not assume the panel exists.

## 6. Gap vs. today

| Target | Today |
|---|---|
| `@tezzeract/ui` package | `client/src/shared/components/ui/` — not extractable |
| Token layer | Hardcoded hex throughout; gradient inline in `VerticalSidebar.tsx` |
| Per-brand overlays | None |
| One `Button` with variants | `Button`, `TezzeractButton`, `TezzeractSendButton` |
| Storybook | None |
| Dark mode | Not considered |
| Modules can't hardcode colour | Unenforced |

Also note: `PlatformLayout.tsx` currently contains debug `fetch()` calls to
`127.0.0.1:7242` inside `// #region agent log` blocks, firing on scroll and document
click for `/social` routes. Instrumentation left in a layout component — should be
removed before this layout becomes the shell.
