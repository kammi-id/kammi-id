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
typography:
  display:
    fontFamily: 'var(--font-heading)'
    fontWeight: 700
  body:
    fontFamily: 'var(--font-sans)'
    fontWeight: 400
  label:
    fontFamily: 'var(--font-geist-mono)'
    fontWeight: 500
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
spacing:
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: 'oklch(0.98 0.008 17)'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
---

# Design System: KAMMI-ID

## 1. Overview

**Creative North Star: "The Vanguard Archive"**

The Vanguard Archive is a digital manifestation of youthful idealism meeting professional execution. It rejects the sterile, rigid nature of traditional administrative tools in favor of a high-velocity, high-clarity environment. The system feels like a modern command center: efficient, authoritative, and energetic, yet grounded in a structured archive that ensures no piece of organizational data is lost.

This system explicitly rejects the "Government App" aesthetic—avoiding monotonous grids, outdated blue-grey palettes, and confusing, multi-step navigation. Instead, it embraces the precision of Linear and the flexibility of Notion.

**Key Characteristics:**

- **High-Velocity**: Interactions are snappy, reducing friction for data-heavy operations.
- **Structured Precision**: Information is densified but organized, favoring clarity over whitespace.
- **Inclusive Boldness**: Bold accents and strong typography are used to guide the eye, while explicit tooltips support users of all digital skill levels.

## 2. Colors: The Vanguard Palette

A high-contrast palette that balances the energy of youth with the stability of a professional organization.

### Primary

- **Vanguard Crimson** (oklch(0.52 0.20 17)): The heartbeat of the system. Used for primary actions, active states, and brand identity. It represents courage, energy, and the organization's core identity.

### Neutral

- **Deep Slate** (oklch(0.141 0.005 285.823)): Used for primary text and high-contrast elements. Provides the "Archive" feeling of stability and authority.
- **Soft Grey** (oklch(0.967 0.001 286.375)): The foundational surface color for muted backgrounds and secondary containers.
- **Mist Border** (oklch(0.92 0.004 286.32)): A subtle, clean divider that organizes content without adding visual noise.

### Alert

- **Siren Red** (oklch(0.577 0.245 27.325)): Reserved strictly for destructive actions and critical errors.

**The Rare Accent Rule.** Vanguard Crimson is the sole high-chroma accent. Its usage is focused on intent; when a user sees Crimson, they know it is the primary path forward.

## 3. Typography

**Display Font:** var(--font-heading)
**Body Font:** var(--font-sans)
**Label/Mono Font:** var(--font-geist-mono)

**Character:** A pairing of a bold, authoritative heading font with a highly legible, modern sans-serif. The inclusion of mono for labels adds a "data-driven" precision to the archive.

### Hierarchy

- **Display** (700, clamp(2rem, 5vw, 3rem), 1.2): Used for page titles and high-level section headers.
- **Headline** (600, 1.25rem, 1.3): Used for card titles and modal headers.
- **Title** (500, 1rem, 1.4): Used for table headers and sub-sections.
- **Body** (400, 0.875rem, 1.5): The workhorse font. Max line length 75ch for optimal readability.
- **Label** (500, 0.75rem, 1, uppercase): Used for badges, tags, and metadata.

## 4. Elevation

The system employs a **Hybrid** elevation strategy. By default, surfaces are flat and layered using tonal shifts (Notion-style), creating a clean, organized feel. Elevation (shadows) is introduced as a dynamic response to interaction—elements "lift" when hovered or focused, providing tactile confirmation of activity.

### Shadow Vocabulary

- **Ambient Lift** (`box-shadow: 0 2px 8px rgba(0,0,0,0.05)`): Subtle lift for cards and inputs at rest.
- **Active Lift** (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`): Pronounced lift for modals and active dropdowns.

**The Response Rule.** Shadows are not decorative; they are functional. A shadow always indicates that an element is now "above" the main archive and ready for interaction.

## 5. Components

The components follow a **Refined and Restrained** philosophy: precise, minimal, and avoiding unnecessary ornamentation.

### Buttons

- **Shape:** Gently rounded (8px radius).
- **Primary:** Vanguard Green background with high-contrast light text. Padding is tight (8px 16px) to maintain a professional, tool-like density.
- **Hover / Focus:** Subtle shift in lightness and a slight scale-up (1.02x) to provide a responsive, "kinetic" feel.
- **Ghost:** Transparent background with a thin border, transitioning to a light Vanguard Green tint on hover.

### Inputs / Fields

- **Style:** Minimalist stroke (Mist Border) with a white background. Radius is matched to buttons (8px).
- **Focus:** The border shifts to Vanguard Crimson with a very subtle outer glow (ring) to clearly indicate focus.
- **Interactive:** Focus is paired with an explicit tooltip if the field requires specific formatting (e.g., NIK).

### Cards / Containers

- **Corner Style:** Rounded (10px radius).
- **Background:** Pure white or Soft Grey depending on the layer.
- **Shadow Strategy:** Flat by default, using a 1px Mist Border for definition.
- **Internal Padding:** Standardized at 16px (md) to ensure a breathable yet dense layout.

### Tooltips

- **Style:** High-contrast (Deep Slate background, white text) to ensure they are impossible to miss.
- **Behavior:** Immediate appearance on hover for "gaptek" users, providing clear, human-language guidance.

## 6. Do's and Don'ts

Concrete guardrails to ensure the Vanguard Archive doesn't drift into "Government App" territory.

### Do:

- **Do** use a high-contrast ratio for all text, ensuring accessibility for users with varying visual needs.
- **Do** implement inline editing and keyboard shortcuts for data-heavy tables to achieve "Linear-level" velocity.
- **Do** provide a tooltip for every non-obvious label or action.
- **Do** use the Mono font for IDs, NIKs, and status codes to emphasize the "Archive" precision.

### Don't:

- **Don't** use the "Government App" aesthetic: avoid monotonous blue-grey palettes, rigid 90-degree corners, and confusing, deep nesting of menus.
- **Don't** use side-stripe borders as colored accents.
- **Don't** use gradient text; keep typography solid and authoritative.
- **Don't** use modals as the first thought for data entry; prefer inline rows or slide-over sheets to keep the user in their current context.
