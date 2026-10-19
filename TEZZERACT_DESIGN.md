# Tezzeract Design Reference

Portable design spec for Tezzeract UI — colors, typography, buttons, and component patterns. Copy this file into any project to keep the same company look.

---

## Brand identity

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `#00378A` | Headings, links, active states, gradient start |
| **Accent** | `#00A9EE` | Highlights, hover links, gradient end |
| **Accent alt** | `#009BE9` | Radial gradients, send button, talent UI |
| **Accent light** | `#20C8F9` | Send button gradient highlight |
| **Accent border** | `#409AFF` | Icon button borders |
| **Accent hover** | `#5CC8F5` | Link hover (dark mode) |
| **Primary hover** | `#002A6B` | Pressed / hover gradient start |
| **Accent pressed** | `#0091D1` | Pressed / hover gradient end |

**Signature gradient (linear, 135°)**

```css
linear-gradient(135deg, #00378A 0%, #00A9EE 100%)
```

**Signature gradient (hover)**

```css
linear-gradient(135deg, #002A6B 0%, #0091D1 100%)
```

**Radial gradient (primary CTA buttons)**

```css
radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%)
```

**Radial gradient (hover / selected pill border)**

```css
radial-gradient(93.12% 100% at 50.53% 0%, #009BE9 0%, #00378A 100%)
```

---

## Typography

### Font family

```css
font-family: 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Google Fonts import**

```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
```

### Weights in use

| Weight | Tailwind | Usage |
|--------|----------|-------|
| 300 | `font-thin` / `font-light` | Tezzeract CTA buttons, talent card names, skill pills |
| 400 | `font-normal` | Body text, sidebar labels |
| 500 | `font-medium` | Buttons, form labels, tabs |
| 600 | `font-semibold` | Page headings, card titles |

### Letter spacing

```css
letter-spacing: -0.04em; /* -4% kerning — docs / marketing */
```

### Type scale (app)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `text-3xl` (30px) | semibold | `#111827` (gray-900) |
| Card title | `text-2xl` (24px) | semibold | gray-900 |
| Body | `text-sm`–`text-base` (14–16px) | normal | gray-600 / gray-700 |
| Caption / label | `text-xs` (12px) | normal / light | gray-500 |
| Sidebar nav | `text-xs` (12px) | normal | black / white |

### Monospace (code)

```css
font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
```

---

## Color palette

### Brand blues

| Name | Hex |
|------|-----|
| Primary | `#00378A` |
| Accent | `#00A9EE` |
| Accent alt | `#009BE9` |
| Accent light | `#20C8F9` |
| Accent border | `#409AFF` |
| Primary hover | `#002A6B` |
| Accent pressed | `#0091D1` |
| Pill hover border | `#B2DDEE` |

### Neutrals — app shell

| Name | Hex | Usage |
|------|-----|-------|
| Global background | `#F2F2F2` | Sidebar, page canvas |
| White | `#FFFFFF` | Cards, inputs, modals |
| Gray 50 | `#F9FAFB` | Main content background |
| Gray 200 | `#E5E7EB` | Card borders, dividers |
| Gray 300 | `#D1D5DB` | Input borders |
| Gray 400 | `#9CA3AF` | Placeholders, muted icons |
| Gray 500 | `#6B7280` | Secondary text |
| Gray 600 | `#4B5563` | Body text |
| Gray 700 | `#374151` | Labels |
| Gray 800 | `#1F2937` | Avatars, hover backgrounds |
| Gray 900 | `#111827` | Primary text |
| Muted pill text | `#A1A1AA` | Unselected skill chips |

### Neutrals — docs / editorial (optional)

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#191919` |
| Background inset | `#F7F7F5` | `#232323` |
| Background hover | `#EFEFED` | `#2A2A2A` |
| Background active | `#E8E8E5` | `#333333` |
| Text | `#191919` | `#E7E7E5` |
| Text dim | `#6B6B68` | `#999996` |
| Text faint | `#9B9B97` | `#6E6E6B` |
| Border | `#EDEDEB` | `#2A2A2A` |
| Border strong | `#D9D9D6` | `#3A3A3A` |

### Semantic colors

| State | Text | Background |
|-------|------|------------|
| Success | `#16A34A` (green-600) | `#F0FDF4` (green-50) |
| Error | `#DC2626` (red-600) | — |
| Error (form) | `#EF4444` (red-500) | — |
| Trend up | `#16A34A` | — |
| Trend down | `#DC2626` | — |
| Trend stable | `#6B7280` | — |

---

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| Small | `6px` / `rounded-md` | Inputs, default buttons |
| Medium | `8px` / `rounded-lg` | Cards, avatars |
| Large | `10px` | Send button |
| XL | `12px` / `rounded-xl` | Tezzeract CTA, sidebar nav items |
| 2XL | `16px` / `rounded-2xl` | Login card, skill pills |
| Pill | `9999px` / `rounded-full` | Skill tags, add buttons |
| Talent card | `30px` / `rounded-[30px]` | Talent portrait cards |

---

## Buttons

### 1. Standard `Button` variants

Base styles shared by all variants:

```
inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
```

| Variant | Styles |
|---------|--------|
| **default** | `bg-blue-600 text-white hover:bg-blue-700` |
| **gradient** | Brand linear gradient + white text; hover uses darker gradient |
| **destructive** | `bg-red-600 text-white hover:bg-red-700` |
| **outline** | `border border-gray-300 bg-white hover:bg-gray-50` |
| **secondary** | `bg-gray-200 text-gray-900 hover:bg-gray-300` |
| **ghost** | `hover:bg-gray-100 hover:text-gray-900` |
| **link** | `text-blue-600 underline-offset-4 hover:underline` |

**Sizes**

| Size | Height | Padding |
|------|--------|---------|
| sm | `h-9` (36px) | `px-3` |
| default | `h-10` (40px) | `px-4 py-2` |
| lg | `h-11` (44px) | `px-8` |
| icon | `40×40px` | — |

**Auth / primary CTA override**

```
h-12 w-full text-base font-medium
bg-gradient-to-b from-blue-600 to-blue-500
hover:from-blue-700 hover:to-blue-600
text-white shadow-md hover:shadow-lg
```

---

### 2. Tezzeract CTA button (brand signature)

Used for high-emphasis actions (e.g. "Create Meeting").

```
Height:     max 40px (max-h-10)
Padding:    px-6 py-3
Radius:     12px (rounded-xl)
Font:       14px, weight 300 (font-thin)
Text:       white
Border:     1px solid rgba(255,255,255,0.4)
Background: radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%)
Hover:      radial overlay + box-shadow: 0 0 10px rgba(0,169,238,0.40)
Transition: shadow 400ms ease-in-out
```

---

### 3. Tezzeract send button (icon)

```
Size:       42×42px
Radius:     10px
Border:     1px solid #409AFF
Background: linear-gradient(209.1deg, #20C8F9 10.41%, #00378A 89.59%)
```

---

### 4. Outline gradient button

```css
border: 2px solid transparent;
background:
  linear-gradient(white, white) padding-box,
  linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%) border-box;
color: #1E40AF;
```

Hover: fill with brand gradient, white text.

---

### 5. Skill / filter pill button

**Unselected**

```
rounded-2xl px-6 py-2 font-thin text-[#A1A1AA] bg-white
hover:border-[#B2DDEE] hover:text-[#00378A]
```

**Selected** — gradient border wrapper + white inner button:

```
Outer: radial-gradient(93.12% 100% at 50.53% 0%, #009BE9 0%, #00378A 100%)
Inner: rounded-2xl px-6 py-2 font-thin text-[#00378A] bg-white
```

---

### 6. Talent card action button

```css
/* Default: white/translucent circle */
background: rgba(255,255,255,0.9);
border-radius: 9999px;

/* Hover */
background: linear-gradient(135deg, #00378A 0%, #009BE9 100%);
```

---

## Form controls

### Input / Select

```
Height:      40px (h-10) — auth forms use 48px (h-12)
Radius:      6px (rounded-md)
Border:      1px solid #D1D5DB (gray-300)
Background:  white
Padding:     px-3 py-2
Font:        text-sm
Placeholder: #9CA3AF (gray-400)
Focus:       no ring (ring-0) — app style
Disabled:    opacity 50%, not-allowed cursor
```

### Form field label

```
text-sm font-medium text-gray-700
Required asterisk: text-red-500
Error text: text-sm text-red-600
```

---

## Cards

### Standard card

```
rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm
Header padding: p-6
Content padding: p-6 pt-0
Title: text-2xl font-semibold leading-none tracking-tight
Description: text-sm text-gray-500
```

### Login / auth card

```
p-6 rounded-2xl border border-gray-200 bg-gray-50/50
```

### Talent portrait card

```
Aspect ratio: 3:4
Radius: 30px
Bottom overlay: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.90) 100%)
Skill tags: text-xs px-2 py-1 rounded-full bg-white/20 text-white font-light backdrop-blur-sm
Name: text-lg–xl text-white font-light tracking-tight
```

### Metric card

Uses standard card + trend colors (green-600 up, red-600 down, gray-500 stable).

---

## Navigation

### Vertical sidebar

```
Width:       80px
Background:  #F2F2F2
Nav item:    70px wide, rounded-xl, flex-col, icon + label
Label:       text-xs, Figtree, font-normal

Inactive:    text-black, hover:bg-gray-800 hover:text-white
Active:      bg-blue-600 text-white
Brand active: linear-gradient(135deg, #00378A 0%, #00A9EE 100%)
```

### Horizontal tabs

```
Border bottom: 1px gray-200
Tab padding: py-4 px-1
Font: text-sm font-medium

Active:   border-b-2 border-blue-600 text-blue-600
Inactive: border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
```

---

## Shadows & effects

| Effect | Value |
|--------|-------|
| Card | `shadow-sm` |
| Card hover | `shadow-lg` + `translate-y-[-4px]` |
| Modal panel | `shadow-2xl` |
| CTA hover glow | `0 0 10px rgba(0,169,238,0.40)` |
| Auth button | `shadow-md` → `shadow-lg` on hover |
| Modal backdrop | `bg-black/30` |

### Focus ring

```css
focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2
```

### Gradient text

```css
background: linear-gradient(to right, #1E40AF, #60A5FA);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Gradient border

```css
border: 1px solid transparent;
background:
  linear-gradient(white, white) padding-box,
  linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%) border-box;
```

---

## Motion

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade in | 300ms | ease-in-out |
| Slide up | 300ms | ease-out |
| Scale in | 200ms | ease-out |
| Slide in right | 300ms | ease-out |
| Card hover | 200ms | default |
| Talent button hover | 500ms | ease-in-out |
| Auth panel slide | 500ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Tezzeract CTA hover | 300–400ms | ease-in-out |

**Keyframe: fade in**

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Keyframe: slide up**

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Scrollbar (gradient)

```css
.scrollbar-gradient::-webkit-scrollbar { width: 6px; }
.scrollbar-gradient::-webkit-scrollbar-track { background: transparent; }
.scrollbar-gradient::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%);
  border-radius: 3px;
}
```

---

## CSS custom properties (copy-paste)

Drop into `:root` for framework-agnostic use:

```css
:root {
  /* Brand */
  --tz-primary: #00378A;
  --tz-accent: #00A9EE;
  --tz-accent-alt: #009BE9;
  --tz-gradient: linear-gradient(135deg, #00378A 0%, #00A9EE 100%);
  --tz-gradient-hover: linear-gradient(135deg, #002A6B 0%, #0091D1 100%);
  --tz-gradient-radial: radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%);

  /* Surfaces */
  --tz-bg-app: #F2F2F2;
  --tz-bg-page: #F9FAFB;
  --tz-bg-card: #FFFFFF;
  --tz-bg-inset: #F7F7F5;

  /* Text */
  --tz-text: #111827;
  --tz-text-secondary: #6B7280;
  --tz-text-muted: #9CA3AF;

  /* Borders */
  --tz-border: #E5E7EB;
  --tz-border-input: #D1D5DB;

  /* Typography */
  --tz-font: 'Figtree', system-ui, sans-serif;
  --tz-font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --tz-letter-spacing: -0.04em;

  /* Radius */
  --tz-radius-sm: 6px;
  --tz-radius-md: 8px;
  --tz-radius-lg: 12px;
  --tz-radius-xl: 16px;
  --tz-radius-card: 30px;

  /* Focus */
  --tz-focus-ring: #1E40AF;
}
```

---

## Tailwind config snippet

```js
// tailwind.config.js — extend theme
{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00378A 0%, #00A9EE 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #002A6B 0%, #0091D1 100%)',
      },
      colors: {
        'global-bg-white': '#F2F2F2',
        brand: {
          primary: '#00378A',
          accent: '#00A9EE',
          'accent-alt': '#009BE9',
        },
      },
    },
  },
}
```

---

## Utility classes (from app CSS)

```css
.gradient-primary {
  background: linear-gradient(to bottom right, #1E40AF, #60A5FA);
  color: white;
}
.gradient-primary:hover {
  background: linear-gradient(to bottom right, #1E3A8A, #3B82F6);
}
.text-gradient {
  background: linear-gradient(to right, #1E40AF, #60A5FA);
  -webkit-background-clip: text;
  color: transparent;
}
.btn-gradient {
  background: linear-gradient(to bottom right, #1E40AF, #60A5FA);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: white;
  transition: all 200ms;
}
.btn-gradient:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.card-hover {
  transition: all 200ms;
}
.card-hover:hover {
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transform: translateY(-4px);
}
.bg-global-bg-white { background-color: #F2F2F2; }
```

---

## Design rules

1. **Brand gradient** — use for primary CTAs, active nav, and brand moments. Do not overuse on every surface.
2. **Figtree everywhere** — no mixing in secondary typefaces for UI text.
3. **Light weight for brand buttons** — Tezzeract CTAs use `font-thin` (300) at 14px for a refined look.
4. **Soft neutrals** — app shell is `#F2F2F2`, not pure white.
5. **Rounded corners** — prefer `rounded-xl` (12px) for branded elements; `rounded-md` (6px) for form controls.
6. **White text on gradients** — always pair brand gradients with white text and optional `border-white/40`.
7. **Subtle motion** — 200–500ms transitions; avoid flashy animations.

---

## Source of truth in this repo

| Asset | Location |
|-------|----------|
| Global styles & utilities | `apps/tezzeract-app/src/index.css` |
| Tailwind tokens | `apps/tezzeract-app/tailwind.config.js` |
| Button components | `apps/tezzeract-app/src/shared/components/ui/` |
| Docs theme (dark mode tokens) | `docs-site/assets/css/tezzeract-docs.css` |
| Architecture notes | `docs/architecture/05-design-system.md` |

---

*Generated from the Tezzeract app codebase. Copy freely — no runtime dependency required.*
