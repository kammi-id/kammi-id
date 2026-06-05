# SEO & Metadata Implementation — KAMMI.id

**Date:** 2026-06-05  
**Scope:** Level B (Proper SEO) — metadata, OG images, JSON-LD, sitemap, robots, manifest  
**Branch:** dev-20260104

---

## Goals

- Make all public pages crawlable and social-share-ready with consistent OG + Twitter card metadata
- Block `/dashboard` and `/login` from indexing while keeping their metadata presentable
- Generate branded OG images automatically via Next.js `ImageResponse`
- Provide structured data (JSON-LD) for search engine comprehension
- Complete `robots.ts`, `sitemap.ts`, and a fully-spec'd `manifest.ts`

---

## Architecture

### Centralized SEO Layer

All shared SEO utilities live in `src/lib/seo/`. Route segments own their own metadata and OG image files. Inheritance flows through Next.js App Router's layout hierarchy — no global state, no prop drilling.

```
src/
  lib/
    seo/
      json-ld.ts       ← typed builder functions for JSON-LD schemas
      index.ts         ← barrel export
  components/
    og-image/
      og-image.tsx     ← shared branded ImageResponse template
      index.ts
  app/
    layout.tsx          ← metadataBase, default metadata, WebSite + Organization JSON-LD
    manifest.ts         ← replaces manifest.json (deleted)
    robots.ts           ← new
    sitemap.ts          ← new
    opengraph-image.tsx ← root-level fallback OG
    (main)/
      opengraph-image.tsx          ← generic KAMMI branded fallback
      berita/opengraph-image.tsx
      event/opengraph-image.tsx
      tentang/opengraph-image.tsx
    (dashboard)/
      layout.tsx        ← noindex inherited by all dashboard + login routes
```

---

## Section 1: Root Layer

### `src/app/layout.tsx`

Add `metadataBase` and expand the default `metadata` export. This is the foundation — without `metadataBase`, all OG image URLs are relative and broken on social platforms.

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://kammi.id'),
  title: {
    default: 'KAMMI.id',
    template: '%s — KAMMI.id',
  },
  description: 'Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    siteName: 'KAMMI.id',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@KAMMIPusat',
  },
  robots: { index: true, follow: true },
}
```

Also inject `WebSite` + `Organization` JSON-LD as a `<script type="application/ld+json">` RSC in the layout body — zero JS overhead.

### `src/app/manifest.ts` (replaces `manifest.json`)

Convert static JSON to dynamic `manifest.ts`. Delete `src/app/manifest.json`.

Added fields over the current file:

| Field | Value |
|---|---|
| `start_url` | `/` |
| `id` | `kammi-id` |
| `lang` | `id` |
| `dir` | `ltr` |
| `description` | `Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia` |
| `categories` | `["education", "social"]` |
| `orientation` | `portrait-primary` |
| icons `purpose: "any"` | Added alongside existing `maskable` entries |

### `src/app/robots.ts`

```ts
// Allow all crawlers on public routes
// Disallow: /dashboard, /dashboard/*, /login, /api/*
// Sitemap: https://kammi.id/sitemap.xml
```

### `src/app/sitemap.ts`

Hybrid design — static routes now, modular for dynamic routes later.

Static routes included at launch:

| URL | changeFrequency | priority |
|---|---|---|
| `/` | `weekly` | `1.0` |
| `/berita` | `daily` | `0.8` |
| `/event` | `weekly` | `0.8` |
| `/tentang` | `monthly` | `0.7` |
| `/tentang/pengurus` | `monthly` | `0.6` |

Export a `getStaticRoutes()` helper so future dynamic routes (e.g. `/berita/[slug]`) can be merged in without rewriting the file.

---

## Section 2: OG Image Generation

### `src/components/og-image/og-image.tsx`

Shared `ImageResponse` template. Props:

```ts
type OgImageProps = {
  title: string
  subtitle?: string
}
```

Spec:
- Size: 1200×630
- Font: Public Sans fetched from Google Fonts at render time (cannot use CSS variables in ImageResponse)
- Branding: KAMMI logo, brand color background, white text
- Layout: logo top-left, title centered large, optional subtitle below

```ts
export const ogImageConfig = {
  size: { width: 1200, height: 630 },
  contentType: 'image/png',
}
```

### Per-Segment `opengraph-image.tsx` Files

Each is a thin wrapper around the shared template:

| File | title | subtitle |
|---|---|---|
| `src/app/opengraph-image.tsx` | `KAMMI.id` | `Kesatuan Aksi Mahasiswa Muslim Indonesia` |
| `src/app/(main)/opengraph-image.tsx` | `KAMMI.id` | `Kesatuan Aksi Mahasiswa Muslim Indonesia` |
| `(main)/berita/opengraph-image.tsx` | `Berita` | `Kabar terkini dari KAMMI` |
| `(main)/event/opengraph-image.tsx` | `Event & Agenda` | `Pelatihan, seminar, dan kongres KAMMI` |
| `(main)/tentang/opengraph-image.tsx` | `Tentang KAMMI` | `Sejarah, visi, misi, dan nilai gerakan` |

Home page (`/`) keeps its existing `generateMetadata` with CMS OG image — it is more specific and overrides the segment-level file automatically.

Dashboard and login have no `opengraph-image.tsx` — they fall back to root, which is acceptable since they are `noindex`.

---

## Section 3: JSON-LD Structured Data

### `src/lib/seo/json-ld.ts`

Typed builder functions returning plain objects, injected as RSC `<script>` tags.

#### `buildWebSite()`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KAMMI.id",
  "url": "https://kammi.id",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kammi.id/berita?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

#### `buildOrganization()`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kesatuan Aksi Mahasiswa Muslim Indonesia",
  "alternateName": "KAMMI",
  "url": "https://kammi.id",
  "logo": "https://kammi.id/icon1.png",
  "sameAs": [
    "https://twitter.com/KAMMIPusat",
    "https://www.instagram.com/kammi.pusat",
    "https://www.instagram.com/kammi.connect",
    "https://www.facebook.com/kammipusat.official",
    "https://www.youtube.com/@kammitv8247",
    "https://www.tiktok.com/@kammi.pusat"
  ]
}
```

#### `buildBreadcrumb(items: { name, url }[])`

Returns a `BreadcrumbList` schema. Called per-page, not in layout.

**Breadcrumb injection per page:**

| Page | Breadcrumb |
|---|---|
| `/tentang` | Home > Tentang |
| `/tentang/pengurus` | Home > Tentang > Pengurus |
| `/berita` | Home > Berita |
| `/event` | Home > Event & Agenda |

---

## Section 4: Dashboard & Login — Noindex Strategy

### `src/app/(dashboard)/layout.tsx`

Add a single metadata export that all child routes inherit automatically:

```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}
```

This covers `/login`, `/dashboard`, and all `/dashboard/**` routes without touching individual page files.

Each dashboard/login page still gets proper `title` + `description`:

| Route | title | description |
|---|---|---|
| `/login` | `Masuk` | `Masuk ke dashboard pengelola KAMMI.id` |
| `/dashboard` | `Dashboard` | `Panel pengelolaan data dan konten KAMMI.id` |

---

## Files Changed

### New Files

- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/manifest.ts`
- `src/app/opengraph-image.tsx`
- `src/app/(main)/opengraph-image.tsx`
- `src/app/(main)/berita/opengraph-image.tsx`
- `src/app/(main)/event/opengraph-image.tsx`
- `src/app/(main)/tentang/opengraph-image.tsx`
- `src/components/og-image/og-image.tsx`
- `src/components/og-image/index.ts`
- `src/lib/seo/json-ld.ts`
- `src/lib/seo/index.ts`

### Modified Files

- `src/app/layout.tsx` — metadataBase, expanded metadata, JSON-LD injection
- `src/app/(dashboard)/layout.tsx` — noindex metadata
- `src/app/(main)/page.tsx` — Twitter card, verify OG
- `src/app/(main)/tentang/page.tsx` — OG fields, BreadcrumbList
- `src/app/(main)/tentang/pengurus/page.tsx` — metadata + BreadcrumbList
- `src/app/(main)/event/page.tsx` — OG fields, BreadcrumbList
- `src/app/(main)/berita/page.tsx` — OG fields, BreadcrumbList
- `src/app/(dashboard)/login/page.tsx` — proper title + description
- `src/app/(dashboard)/dashboard/page.tsx` — proper title + description

### Deleted Files

- `src/app/manifest.json` — replaced by `manifest.ts`

---

## Out of Scope (Future)

- Dynamic sitemap entries for `/berita/[slug]` and `/event/[slug]` (no detail pages yet)
- `Article` JSON-LD for individual berita posts
- `Event` JSON-LD for individual event posts
- `hreflang` for multi-language support
- CMS-controlled metadata for static pages (Level C)
