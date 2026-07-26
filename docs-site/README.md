# Tezzeract Developer Docs — the viewer

This folder is a **thin, static viewer** over the markdown in [`../docs/`](../docs). It is
not a documentation source — it renders one. There is no build step for the content itself:
[Docsify](https://docsify.js.org) fetches raw `.md` files at request time and renders them
in the browser, so the same files serve:

- **AI tooling** — reads `../docs/**/*.md` directly, as plain markdown
- **This site** — renders the identical files at `developers.tezzeract.com`
- **GitHub** — renders them natively in the repo browser

One source of truth, three readers. Editing a doc means editing the file in `../docs/`,
never anything in this folder.

## Information architecture

The top bar's tabs are Tezzeract's actual modules, not arbitrary site sections — they
mirror the module list in [`../docs/architecture/technical/30-architecture-v2.md`](../docs/architecture/technical/30-architecture-v2.md):

| Tab | Source folder | Status |
|---|---|---|
| Core Architecture | `../docs/architecture/` | Complete — the full ADR/data-model/agent/IP set |
| Talent | `../docs/talent/` | Landing page; deep dives live in Core Architecture |
| Contelli | `../docs/contelli/` | Landing page |
| Talk | `../docs/talk/` | Landing page — not yet built |
| CRM | `../docs/crm/` | Landing page — not yet built |
| App Platform | `../docs/app-platform/` | Landing page — not yet built |

Each module folder has its own `README.md` (the tab's landing page) and its own
`_sidebar.md` (the tab's left nav). Docsify's `loadSidebar: true` auto-discovers the
`_sidebar.md` in whichever directory the current page lives in — so switching tabs
switches the sidebar, automatically, with no JS routing of our own.

**One wrinkle to know about:** Docsify looks for `_sidebar.md` in the *current file's own
directory*, not inherited from a parent. Core Architecture has a nested `technical/`
folder, so it needs **two** copies of the same sidebar —
[`../docs/architecture/_sidebar.md`](../docs/architecture/_sidebar.md) and
[`../docs/architecture/technical/_sidebar.md`](../docs/architecture/technical/_sidebar.md)
— with relative links adjusted for depth. If you add a page to Core Architecture, update
whichever of the two applies; if you add a new top-level module folder with its own nested
subfolder, it needs the same treatment.

### Adding a new module tab

1. `mkdir ../docs/<module>` with a `README.md` (landing page) and a `_sidebar.md` (its nav).
2. Add one `<a>` to `.tz-tabs` in `index.html`, with `data-part="<module>"` matching the
   folder name — that's what drives the active-tab highlight.
3. Nothing else. `build.sh` copies `../docs/*` wholesale.

## Design

Strict grayscale, deliberately. The Tezzeract gradient (`#00A9EE → #00378A`) appears in
exactly two places and nowhere else:

1. The brand mark, top-left (`assets/img/mark.svg`, and the inline copy in `index.html`
   used as a shared `<linearGradient id="tzGradient">` — both **must** stay in sync if the
   gradient stops ever change).
2. The active-tab / active-nav-item accent line.

Everything else — text, borders, table rules, code blocks, blockquote rules, Mermaid
diagrams — is black/white/grey, switching cleanly between light and dark via
`prefers-color-scheme` with a `data-theme` override (the toggle button in the top bar,
persisted to `localStorage`).

**Diagrams follow the same rule.** Mermaid is initialized with a fully grayscale
`themeVariables` palette (see the script block in `index.html`). If a specific diagram
needs to call out one thing — the way `SUMMARY.md`'s Kernel diagram does — give that node's
`classDef` `fill:url(#tzGradient)` rather than a flat hex color. That references the same
`<defs>` block declared once in `index.html`, so it always matches the mark exactly and
never drifts into "another blue."

Font is Figtree, weights 300 and 400 only, self-hosted (`assets/fonts/`, ~31KB total) — no
runtime dependency on Google's CDN.

## Local preview

Docsify fetches files over HTTP, so `file://` will not work — serve it:

```bash
cd docs-site
./build.sh          # assembles ./content from ../docs
npx serve .          # or: python3 -m http.server 3000
```

Open the printed URL. Toggle the theme button to check both modes — the whole point of
`data-theme` is that it shouldn't need a page reload to look right either way.

## Deploying (Vercel)

1. New Vercel project, **Root Directory: `docs-site`**.
2. In Project Settings → General, enable **"Include files outside of the Root Directory
   in the Build Step"** — `build.sh` reads `../docs`, which is outside `docs-site/`.
3. Framework preset: **Other**. Build command and output are already set in
   [`vercel.json`](vercel.json).
4. Point `developers.tezzeract.com` at the project.

No environment variables, no database, no server. Static files behind a CDN.

> Everything here is public once deployed. If any Core Architecture content should stay
> internal, add access control at the Vercel/Cloudflare layer before pointing the domain
> at it — publishing is a one-way door on anything that gets indexed.
