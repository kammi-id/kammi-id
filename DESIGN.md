---
name: KAMMI-ID
description: The Single Source of Truth for KAMMI Organization
colors:
  primary: 'oklch(0.52 0.20 17)'
  foreground: 'oklch(0.141 0.005 285.823)'
  background: 'oklch(1 0 0)'
  muted: 'oklch(0.967 0.001 286.375)'
  muted-foreground: 'oklch(0.552 0.016 285.938)'
  destructive: 'oklch(0.577 0.245 27.325)'
  border: 'oklch(0.92 0.004 286.32)'
  ring: 'oklch(0.7 0.012 17)'
  status-success: 'oklch(0.44 0.14 152)'
  status-warning: 'oklch(0.48 0.12 75)'
  chart-ab1: 'oklch(0.65 0.18 145)'
  chart-ab2: 'oklch(0.58 0.20 25)'
  chart-ab3: 'oklch(0.55 0.18 265)'
  chart-ikhwan: 'oklch(0.72 0.14 225)'
  chart-akhwat: 'oklch(0.74 0.14 350)'
  chart-pemandu: 'oklch(0.55 0.16 150)'
  chart-instruktur: 'oklch(0.55 0.16 280)'
typography:
  display:
    fontFamily: 'var(--font-heading)'
    fontWeight: 700
    lineHeight: 1.05
  headline:
    fontFamily: 'var(--font-heading)'
    fontWeight: 700
  title:
    fontFamily: 'var(--font-heading)'
    fontWeight: 500
  body:
    fontFamily: 'var(--font-sans)'
    fontWeight: 400
  label:
    fontFamily: 'var(--font-geist-mono)'
    fontWeight: 500
  accent:
    fontFamily: 'var(--font-handwriting)'
    fontWeight: 400
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  '2xl': '18px'
  '3xl': '22px'
  '4xl': '26px'
spacing:
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-default:
    backgroundColor: '{colors.primary}'
    textColor: 'oklch(0.98 0.008 17)'
    rounded: '{rounded.4xl}'
    padding: '0 12px'
    height: '36px'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    rounded: '{rounded.4xl}'
    padding: '0 12px'
    height: '36px'
  input:
    backgroundColor: 'oklch(0.92 0.004 286.32 / 0.5)'
    textColor: '{colors.foreground}'
    rounded: '{rounded.3xl}'
    padding: '4px 12px'
    height: '36px'
  badge-default:
    backgroundColor: '{colors.primary}'
    textColor: 'oklch(0.98 0.008 17)'
    rounded: '{rounded.3xl}'
    padding: '2px 8px'
    height: '20px'
  card:
    backgroundColor: 'oklch(1 0 0)'
    textColor: '{colors.foreground}'
    rounded: '{rounded.4xl}'
    padding: '24px'
---

# Design System: KAMMI-ID

## Overview

**Creative North Star: "The Kindly Ledger"**

KAMMI ID keeps the national record of a youth organization: who its cadres are, what they've earned, which structures they belong to. A ledger has to be exact — but this one refuses to feel like an interrogation. Every surface that touches data leans on precise, monospace-coded numbers and IDs; every surface the user touches directly (buttons, inputs, badges) is soft-edged, almost capsule-shaped, with no border standing guard until the user actually needs one. The result reads as rigorous without being cold: an archive that keeps its promises about accuracy while refusing the visual language of a government form.

This system explicitly rejects the "Government App" aesthetic — rigid rectangles, defensive borders on every field, blue-grey monotony, and interfaces that make the user prove their intentions before they're allowed to act. The Kindly Ledger trusts first: surfaces stay quiet and unbordered until interaction actually calls for structure.

**Key Characteristics:**

- **Soft-edged, unguarded:** buttons and badges round all the way to a capsule; inputs and cards carry no visible border at rest, only a whisper of shadow and ring.
- **Precision where it counts:** IDs, dates, and counts are set in a distinct label/mono voice, separate from the conversational body text.
- **One human accent:** a handwritten typeface appears exactly once, on the public "tentang" (about) page — a deliberate, rationed warmth, not a system-wide habit.
- **One loud color:** Ledger Crimson is the system's only high-chroma accent for actions and identity; everything else is neutral or semantically coded (status, jenjang, gender).

## Colors

A mostly neutral, high-contrast palette that reserves saturation for two jobs: the primary accent, and a deliberate semantic system that lets a reader identify a Kader's Jenjang, gender, or Struktur type at a glance without reading the label.

### Primary

- **Ledger Crimson** (oklch(0.52 0.2 17), light / oklch(0.58 0.2 17), dark): The system's one loud color. Used for primary actions, focus rings (as a muted tint, oklch(0.7 0.012 17)), and brand identity. Its rarity is what gives it authority — introduce a second saturated accent color into the primary UI and the rule breaks.

### Neutral

- **Paper White** (oklch(1 0 0)): Base background and card surface in light mode.
- **Deep Slate** (oklch(0.141 0.005 285.823)): Primary text; also the light-mode-inverse background in dark mode.
- **Soft Grey** (oklch(0.967 0.001 286.375)): Muted/secondary surface — the resting color for inputs (at 50% opacity) and secondary buttons.
- **Mist Border** (oklch(0.92 0.004 286.32)): The one border color the system permits, used sparingly (outline-button stroke, dividers) — never as an input or card default.

### Alert

- **Siren Red** (oklch(0.577 0.245 27.325), light / oklch(0.704 0.191 22.216), dark): Destructive actions and validation errors only.

**The Rare Accent Rule.** Ledger Crimson appears on primary actions, active states, and identity marks — nowhere else. If a screen needs a second strong color, reach for the semantic system below instead of a second shade of crimson.

### Semantic system (categorical, not decorative)

Each of these families exists to let a reader identify a category at a glance — Jenjang Kekaderan, gender, Struktur type, or a Kader's Keadaan — never as arbitrary decoration. All are defined with a `-bg`/`-border`/`-text`/`-solid` quartet (soft tint for badges, solid for charts/dots) and each has its own light/dark pairing in `globals.css`.

- **Jenjang Kekaderan** — AB1 `--status-ab1-solid` (oklch(0.65 0.18 145), green), AB2 `--status-ab2-solid` (oklch(0.58 0.2 25), orange-red), AB3 `--status-ab3-solid` (oklch(0.55 0.18 265), purple). Three distinct hues, deliberately non-sequential in lightness so the eye can't mistake "later letter" for "later hue."
- **Gender** — Ikhwan `--gender-ikhwan-solid` (oklch(0.72 0.14 225), blue), Akhwat `--gender-akhwat-solid` (oklch(0.74 0.14 350), rose).
- **Perangkat role** — Pemandu (oklch(0.55 0.16 150), green), Instruktur (oklch(0.55 0.16 280), purple) — distinct from the Jenjang and gender hues so the three systems never collide on-screen together.
- **Struktur Jenjang** (org-type tags: `--org-pw-*`, `--org-pd-*`, `--org-pk-*`, `--org-pp-*`) — PW green (hue 145), PD blue (hue 240), PK crimson-tied (hue 17, shares the primary's hue), PP neutral slate (hue 285, near-foreground).
- **Keadaan Kader** — Sanksi/suspended uses the primary's crimson hue at low chroma (`--status-suspended-*`, hue 17), Non-Aktif uses neutral slate (`--status-nonactive-*`, hue 285), Alumni reuses the AB3 purple (`--status-alumn-*`, hue 265) since both mean "completed this stage."
- **Status feedback** — Success (oklch(0.44 0.14 152), green) and Warning (oklch(0.48 0.12 75), amber) follow the same `-text`/`-bg`/`-border` triplet, used for training-approval and validation states.

**The One Family, One Hue Rule.** A given semantic family (Jenjang, gender, Struktur type, Keadaan) never reuses a hue within itself, but hues **do** repeat across families (AB3 purple = Alumni purple = Instruktur purple) when the underlying meaning is genuinely related ("completed" / "senior"). Don't invent a new hue for a new category without checking whether an existing family already owns the meaning.

## Typography

**Display / Headline / Title Font:** Lora (`var(--font-heading)`) — a serif, loaded via `next/font/google`.
**Body Font:** Public Sans (`var(--font-sans)`) — a humanist sans-serif, loaded via `next/font/google`.
**Accent Font:** Caveat (`var(--font-handwriting)`) — a handwritten script, loaded via `next/font/google`, used exactly once (the public "tentang" page scene). Do not extend it to a second surface without a specific reason; its rarity is the point.
**Label/Mono Font (intent, currently unwired):** Geist Mono, referenced as `var(--font-geist-mono)` and applied via the `font-geist-mono` / `font-mono` utility across ~80+ dashboard locations (IDs, dates, table cells, stat numbers, badges). **Implementation gap:** `--font-geist-mono` is never bound to an actual typeface — `layout.tsx` loads only Lora, Public Sans, and Caveat via `next/font`; there is no `Geist_Mono` import and no `@font-face` fallback anywhere in the codebase. As an inherited CSS custom property, this most likely means every `.font-geist-mono` element silently renders in the surrounding Public Sans/Lora rather than a monospace face. Treat "Label" below as the system's *intended* voice, not a confirmed rendering — wiring `Geist_Mono` (or an equivalent mono face) into `layout.tsx` closes the gap; this file does not decide whether to fix it.

**Character:** A serif/sans pairing — Lora's editorial authority for anything that reads as a heading, Public Sans's plain legibility for everything the user actually has to read at length. Geist Mono is meant to add a third, data-specific register (IDs, counts, timestamps) that visually separates "record" from "prose," but currently cannot, per the gap above.

### Hierarchy

- **Display** (700, `clamp(2.6rem, 6vw, 4.5rem)`, leading 1.05, Lora): the public site's hero headline only.
- **Headline** (700, 1.5rem/24px, tracking-tight, Lora): dashboard page titles (`<h1>`).
- **Title** (500, 1rem/16px, Lora): card titles.
- **Stat number** (700, 1.875–2.25rem/30–36px, tracking-tight, tabular-nums, intended mono): the large counters in dashboard stat cards and bento tiles — the system's most distinctive numeric display.
- **Body** (400, 0.875rem/14px, Public Sans): the workhorse font for prose, form labels, and table content.
- **Label** (500, 0.6875–0.75rem/11–12px, tracking-wide to tracking-widest, uppercase, intended mono): section eyebrows, badges, IDs, and status codes.
- **Accent** (400, Caveat, size varies by placement): the single handwritten flourish on the "tentang" page.

## Layout

No custom breakpoint or container tokens are defined; the system runs on Tailwind's default breakpoint scale directly. Two distinct layout grammars coexist under one token system:

- **Dashboard (Operate):** dense, table- and card-driven, comfortable padding (cards default to 24px horizontal / 24px vertical, compact variant drops to 16px). Optimized for scanning rows of Kader/Struktur/Daurah data quickly.
- **Public site (Persuade/Read):** looser, section-based marketing layout (hero, about, alumni, network, publications) with generous vertical rhythm and scroll-triggered reveal animation (`.scroll-reveal`, driven by `animation-timeline: view()`, with an explicit `prefers-reduced-motion` fallback to a static, fully-visible state).

## Elevation & Depth

**Soft-lifted, quiet by default.** Cards do not wait for interaction to justify a shadow: `shadow-md` (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) plus a near-invisible `ring-1 ring-foreground/5` (dark: `/10`) sits under every card at rest. This is deliberately different from a flat/bordered system: the ring reads as ambient softness, not a state signal, and it is present whether or not the user is touching anything.

Inputs and buttons take the opposite approach: **no border at rest** (`border-transparent`, background carries the shape instead), and a visible `ring-3 ring-ring/30` with a shifted border appears only on `:focus-visible` or `aria-invalid`. Structure is earned by the moment that needs it, not asserted by default.

### Shadow Vocabulary

- **Card rest** (`shadow-md` + `ring-1 ring-foreground/5`): the system's only default elevation; every card, everywhere, at rest.
- **Focus ring** (`ring-3 ring-ring/30` + border shift to `ring`): interactive elements on keyboard focus.
- **Invalid ring** (`ring-3 ring-destructive/20`, dark `/40`): form fields failing validation.

### Named Rules

**The Unguarded Rule.** No interactive element (button, input, badge) carries a visible border at rest. A border or heavy ring appearing on an unfocused, valid, non-hovered element is a bug, not a style choice.

## Shapes

**The Capsule Rule.** The radius scale (`--radius: 0.625rem` / 10px base, scaled 0.6×–2.6×) is deliberately used at its top end for anything the user touches directly: buttons and badges use `rounded-4xl` (26px) against a 36px/20px height, which clamps them into true capsules; inputs use `rounded-3xl` (22px). Cards use `rounded-4xl` too, but at a much larger box, so the effect reads as "generously softened corners," not literal roundness. Nothing in the interactive layer uses a sharp or barely-rounded corner — that visual language is reserved for the "Government App" anti-reference this system is defined against.

| Token | Value | Used by |
|---|---|---|
| `--radius-sm` | 6px | small chips, inline elements |
| `--radius-md` | 8px | — |
| `--radius-lg` | 10px | — |
| `--radius-xl` | 14px | — |
| `--radius-2xl` | 18px | — |
| `--radius-3xl` | 22px | inputs, badges |
| `--radius-4xl` | 26px | buttons, cards |

## Components

**Soft-edged and unguarded.** Every primitive below shares the same posture: rounded to the top of the scale, no border until focus, shadow (if any) applied quietly rather than as feedback.

### Buttons
- **Shape:** `rounded-4xl` (26px on a 36px-tall default button) — a true capsule.
- **Default:** Ledger Crimson background, near-white text (`oklch(0.98 0.008 17)`), `hover:bg-primary/80`.
- **Outline:** transparent background, `border-border` (Mist Border) stroke — the one button variant that keeps a border at rest, because "outline" is its whole job.
- **Secondary / Ghost:** Soft Grey background (secondary) or fully transparent until hover (ghost).
- **Destructive:** low-opacity Siren Red background + Siren Red text, not a solid red fill — softer than a typical danger button, consistent with the system's "don't alarm by default" posture.
- **Hover / Focus:** default and secondary drop to 80% opacity on hover; all variants get the focus ring on `:focus-visible`; a subtle `translate-y-px` press effect on `:active`.
- **Sizes:** `xs` (24px) through `lg` (40px), plus icon-only squares at matching heights.

### Badges
- **Shape:** `rounded-3xl` (22px on a 20px-tall badge) — capsule.
- **Style:** same variant set as buttons (default/secondary/destructive/outline/ghost), always `text-xs font-medium`.

### Cards / Containers
- **Corner Style:** `rounded-4xl` (26px).
- **Background:** Paper White (light) / Deep Slate-tinted surface (dark).
- **Shadow Strategy:** `shadow-md` + `ring-1 ring-foreground/5` at rest — see Elevation & Depth. No border.
- **Internal Padding:** 24px default (`py-6 px-6`), 16px compact variant (`data-size="sm"`).

### Inputs / Fields
- **Style:** no border at rest; background is Soft Grey/Mist Border at 50% opacity (`bg-input/50`); `rounded-3xl`.
- **Focus:** border shifts to Ledger Crimson-tinted ring color, plus `ring-3 ring-ring/30`.
- **Error:** border shifts to Siren Red, `ring-3 ring-destructive/20`.

### Stat Displays (signature component)
The large counters in dashboard bento/stat cards (`text-3xl`–`text-4xl`, `font-bold`, `tracking-tight`, `tabular-nums`, intended mono per the Typography gap above) are the system's most distinctive numeric treatment — the closest thing to a "brand moment" inside the dashboard. Keep them tabular and bold; don't reuse this exact scale for anything that isn't a headline count.

### Dialog vs. Sheet
Both are legitimate and both are used heavily (Dialog: 16 dashboard call sites, Sheet: 11) — this system does **not** avoid modals. The real split by observed usage: **Dialog** for confirmations and short, bounded actions (delete confirmation, logout, reset password, bulk upload, category management). **Sheet** for the primary create/edit flow of a larger entity (branch management). Choose by task shape, not by a blanket preference for one over the other.

### Navigation
Sidebar-driven dashboard nav (`--sidebar-*` token family, same crimson-tinted primary and neutral roles as the main palette, just with its own background step). Public-site nav sits in the marketing layout grammar, not the dashboard one.

## Do's and Don'ts

### Do:
- **Do** reserve Ledger Crimson for actions and identity — semantic color (Jenjang, gender, Struktur type, Keadaan) carries everything else.
- **Do** keep interactive elements borderless at rest; let focus/error states be the only time a border or heavy ring appears.
- **Do** use the top of the radius scale (`3xl`/`4xl`) for anything the user directly touches (buttons, badges, inputs, cards).
- **Do** treat the handwritten accent (Caveat) as a single, rationed flourish — not a typeface to reach for generally.
- **Do** pick Dialog for confirmations/short actions and Sheet for a primary create/edit flow, per the observed split above.

### Don't:
- **Don't** use the "Government App" aesthetic: sharp rectangular corners, defensive borders on every field, monotonous blue-grey neutrals, or interfaces that force the user to justify an action before they can take it.
- **Don't** introduce a second high-chroma accent color into primary UI — route it through the semantic system instead.
- **Don't** assume `font-geist-mono` is rendering as monospace until the implementation gap above is closed; don't design new UI that depends on it looking different from body text.
- **Don't** invent a new hue for a new categorical badge without checking whether an existing semantic family (Jenjang, gender, Struktur type, Keadaan) already owns that meaning.
- **Don't** use gradient text or fills inside the dashboard/data surfaces — gradients exist on the public marketing site's hero-adjacent sections only, and that's a Persuade-mode choice, not a system-wide one.
