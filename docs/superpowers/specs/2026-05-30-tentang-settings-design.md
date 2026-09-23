# Halaman Tentang — Dashboard Settings

**Date:** 2026-05-30  
**Route:** `/dashboard/pages/tentang`  
**Affects:** `/tentang` public page

---

## Summary

Add a settings page that lets `humas` (PP only) and `root` users manage the visual assets for the `/tentang` public route: hero background, per-prinsip background images (×6), per-paradigma photo images (×4), and the kredo section background.

---

## Architecture

### Data layer

One new key `tentang` in the existing `site_settings` table (key + organizationId composite PK already in schema).

```ts
// src/db/query/site-settings.ts (additions)
export type TentangSettings = {
  heroImageUrl: string // background for the hero viewport
  prinsipImages: string[] // length 6, index matches PRINSIP_ITEMS order
  paradigmaImages: string[] // length 4, index matches PARADIGMA_ITEMS order
  kredoImageUrl: string // background image behind the kredo parchment
}
```

Default values: empty strings (components fall back to existing CSS gradients when URL is empty).

Add `getCachedTentangSettings(orgId)` to `_data/settings.ts` — same `'use cache'` / `cacheLife('days')` / `cacheTag` pattern as other cached getters.

### Settings page (`/dashboard/pages/tentang/page.tsx`)

Server component. Auth + redirect guards identical to `home/page.tsx` (root or humas). Fetches `tentangSettings`, renders 4 `<Card>` sections using the shared layout pattern.

### Forms

All forms are `'use client'` components using `useActionState`. Pattern mirrors `HeroForm`. Image fields use the existing `<ImageUpload>` component.

| Component       | Fields                       | Upload folder                     |
| --------------- | ---------------------------- | --------------------------------- |
| `HeroBgForm`    | `heroImageUrl` (×1)          | `site-settings/tentang/hero`      |
| `PrinsipForm`   | `prinsipImages[0..5]` (×6)   | `site-settings/tentang/prinsip`   |
| `ParadigmaForm` | `paradigmaImages[0..3]` (×4) | `site-settings/tentang/paradigma` |
| `KredoForm`     | `kredoImageUrl` (×1)         | `site-settings/tentang/kredo`     |

Multi-image fields (prinsip, paradigma) are serialized as JSON via a hidden input, the same technique used in `ActionsForm`.

### Server action (`_components/action.ts`)

One `'use server'` file with 4 actions:

- `saveTentangHeroAction`
- `saveTentangPrinsipAction`
- `saveTentangParadigmaAction`
- `saveTentangKredoAction`

Each follows the existing `checkAccess → zod parse → upsertSiteSettings → revalidatePath('/tentang') → updateTag` pattern. Cache tag: `site-settings-tentang-{orgId}`.

### Sidebar

Add "Halaman Tentang" entry to the "Halaman Publik" group in `app-sidebar.tsx`:

```tsx
{
  title: 'Halaman Tentang',
  url: '/dashboard/pages/tentang',
  icon: <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
}
```

### Public page (`/tentang`) updates

`tentang/page.tsx` becomes an async server component that fetches `tentangSettings` and passes them to `TentangScene`.

`TentangScene` accepts a `settings: TentangSettings` prop. Internally:

- **Hero**: Apply `heroImageUrl` as CSS `backgroundImage` on the hero `<section>` when non-empty (overlay with existing texture on top via absolute positioning).
- **Prinsip**: Replace the CSS `linear-gradient` in `.prinsip-photo-{i}` with the corresponding `prinsipImages[i]` URL when non-empty; keep gradient as fallback.
- **Paradigma**: Replace the CSS `linear-gradient` in the `paradigma-photo-{i}` `<figure>` inner div with the corresponding `paradigmaImages[i]` URL when non-empty; keep gradient as fallback.
- **Kredo**: Apply `kredoImageUrl` as a background layer behind the parchment colour when non-empty.

---

## Access control

Same as existing pages settings: `root` or `humas` with `connectedOrganization.type === 'pp'`.

---

## Cache invalidation

On save: `revalidatePath('/tentang')` + `updateTag('site-settings-tentang-{orgId}')`.

---

## Out of scope

- Text content editing for Prinsip / Paradigma / Kredo (hardcoded in component constants for now).
- Drag-to-reorder prinsip/paradigma items.
- Alt-text fields for the new images (can be added later).
