# SEO & Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Level-B SEO across kammi.id — consistent metadata, OG images via `ImageResponse`, JSON-LD structured data, `robots.ts`, `sitemap.ts`, and a complete `manifest.ts`.

**Architecture:** A centralized `src/lib/seo/` utility layer provides JSON-LD builders used by the root layout. A shared `src/components/og-image/` template is imported by per-segment `opengraph-image.tsx` files. All `(dashboard)` and `login` routes inherit `noindex` from the group layout.

**Tech Stack:** Next.js App Router (manifest/robots/sitemap conventions), `next/og` (`ImageResponse`), Schema.org JSON-LD, `bun:test` for unit tests.

---

## File Map

| Action | File                                         |
| ------ | -------------------------------------------- |
| Create | `src/lib/seo/json-ld.ts`                     |
| Create | `src/lib/seo/index.ts`                       |
| Create | `tests/lib/seo/json-ld.test.ts`              |
| Create | `src/components/og-image/og-image.tsx`       |
| Create | `src/components/og-image/index.ts`           |
| Create | `src/app/manifest.ts`                        |
| Create | `src/app/robots.ts`                          |
| Create | `src/app/sitemap.ts`                         |
| Create | `src/app/opengraph-image.tsx`                |
| Create | `src/app/(main)/opengraph-image.tsx`         |
| Create | `src/app/(main)/berita/opengraph-image.tsx`  |
| Create | `src/app/(main)/event/opengraph-image.tsx`   |
| Create | `src/app/(main)/tentang/opengraph-image.tsx` |
| Modify | `src/app/layout.tsx`                         |
| Modify | `src/app/(dashboard)/layout.tsx`             |
| Modify | `src/app/(dashboard)/login/page.tsx`         |
| Modify | `src/app/(dashboard)/dashboard/page.tsx`     |
| Modify | `src/app/(main)/page.tsx`                    |
| Modify | `src/app/(main)/berita/page.tsx`             |
| Modify | `src/app/(main)/event/page.tsx`              |
| Modify | `src/app/(main)/tentang/page.tsx`            |
| Modify | `src/app/(main)/tentang/pengurus/page.tsx`   |
| Delete | `src/app/manifest.json`                      |

---

## Task 1: JSON-LD Builder Utilities

**Files:**

- Create: `src/lib/seo/json-ld.ts`
- Create: `src/lib/seo/index.ts`
- Create: `tests/lib/seo/json-ld.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/seo/json-ld.test.ts`:

```ts
import { describe, it, expect } from 'bun:test'
import {
  buildWebSite,
  buildOrganization,
  buildBreadcrumb
} from '~/lib/seo/json-ld'

describe('buildWebSite', () => {
  it('returns WebSite @type with correct url', () => {
    const result = buildWebSite()
    expect(result['@type']).toBe('WebSite')
    expect(result.url).toBe('https://kammi.id')
    expect(result.name).toBe('KAMMI.id')
  })

  it('includes SearchAction potentialAction targeting /berita', () => {
    const result = buildWebSite()
    expect(result.potentialAction['@type']).toBe('SearchAction')
    expect(result.potentialAction.target).toContain('kammi.id/berita')
    expect(result.potentialAction['query-input']).toBe(
      'required name=search_term_string'
    )
  })
})

describe('buildOrganization', () => {
  it('returns Organization @type with full name and alternateName', () => {
    const result = buildOrganization()
    expect(result['@type']).toBe('Organization')
    expect(result.name).toBe('Kesatuan Aksi Mahasiswa Muslim Indonesia')
    expect(result.alternateName).toBe('KAMMI')
    expect(result.logo).toBe('https://kammi.id/icon1.png')
  })

  it('includes all 6 social media sameAs entries', () => {
    const result = buildOrganization()
    expect(result.sameAs).toHaveLength(6)
    expect(result.sameAs).toContain('https://twitter.com/KAMMIPusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.pusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.connect')
    expect(result.sameAs).toContain(
      'https://www.facebook.com/kammipusat.official'
    )
    expect(result.sameAs).toContain('https://www.youtube.com/@kammitv8247')
    expect(result.sameAs).toContain('https://www.tiktok.com/@kammi.pusat')
  })
})

describe('buildBreadcrumb', () => {
  it('builds BreadcrumbList with correct positions and absolute item URLs', () => {
    const result = buildBreadcrumb([
      { name: 'Beranda', url: '/' },
      { name: 'Tentang', url: '/tentang' }
    ])
    expect(result['@type']).toBe('BreadcrumbList')
    expect(result.itemListElement).toHaveLength(2)
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[0].name).toBe('Beranda')
    expect(result.itemListElement[0].item).toBe('https://kammi.id/')
    expect(result.itemListElement[1].position).toBe(2)
    expect(result.itemListElement[1].item).toBe('https://kammi.id/tentang')
  })

  it('handles a single-item breadcrumb', () => {
    const result = buildBreadcrumb([{ name: 'Beranda', url: '/' }])
    expect(result.itemListElement).toHaveLength(1)
    expect(result.itemListElement[0].position).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test tests/lib/seo/json-ld.test.ts
```

Expected: FAIL — `Cannot find module '~/lib/seo/json-ld'`

- [ ] **Step 3: Implement the JSON-LD builders**

Create `src/lib/seo/json-ld.ts`:

```ts
export type BreadcrumbItem = { name: string; url: string }

export const buildWebSite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KAMMI.id',
  url: 'https://kammi.id',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://kammi.id/berita?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
})

export const buildOrganization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kesatuan Aksi Mahasiswa Muslim Indonesia',
  alternateName: 'KAMMI',
  url: 'https://kammi.id',
  logo: 'https://kammi.id/icon1.png',
  sameAs: [
    'https://twitter.com/KAMMIPusat',
    'https://www.instagram.com/kammi.pusat',
    'https://www.instagram.com/kammi.connect',
    'https://www.facebook.com/kammipusat.official',
    'https://www.youtube.com/@kammitv8247',
    'https://www.tiktok.com/@kammi.pusat'
  ]
})

export const buildBreadcrumb = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://kammi.id${item.url}`
  }))
})
```

Create `src/lib/seo/index.ts`:

```ts
export * from './json-ld'
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test tests/lib/seo/json-ld.test.ts
```

Expected: 7 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo/ tests/lib/seo/
git commit -m "feat: add JSON-LD builder utilities for WebSite, Organization, BreadcrumbList"
```

---

## Task 2: Shared OG Image Template

**Files:**

- Create: `src/components/og-image/og-image.tsx`
- Create: `src/components/og-image/index.ts`

No unit tests — `ImageResponse` is a server-only construct verified visually at runtime.

- [ ] **Step 1: Create the shared OG image template**

Create `src/components/og-image/og-image.tsx`:

```tsx
import { ImageResponse } from 'next/og'

export const ogImageConfig = {
  size: { width: 1200, height: 630 },
  contentType: 'image/png' as const
}

type OgImageProps = {
  title: string
  subtitle?: string
}

// Fetches Public Sans 700 woff2 from Google Fonts CDN.
// The font is cached by Next.js after the first generation.
// If this URL becomes stale, get the current one by fetching:
//   https://fonts.googleapis.com/css2?family=Public+Sans:wght@700&display=swap
// with a Chrome User-Agent and copying the woff2 src URL.
const fetchFont = async () => {
  const res = await fetch(
    'https://fonts.gstatic.com/s/publicsans/v15/ijwRs572Xtc6ZYQws9YVglDOSVB9qQ.woff2'
  )
  if (!res.ok) throw new Error(`Failed to fetch OG font: ${res.status}`)
  return res.arrayBuffer()
}

export const ogImage = async ({ title, subtitle }: OgImageProps) => {
  const fontData = await fetchFont()

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1b3f6e 0%, #0c2340 100%)',
        padding: '64px 80px',
        justifyContent: 'flex-end'
      }}
    >
      <div
        style={{
          display: 'flex',
          color: 'rgba(255,255,255,0.45)',
          fontSize: '18px',
          fontFamily: 'Public Sans',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          marginBottom: '28px'
        }}
      >
        KAMMI.id
      </div>
      <div
        style={{
          color: '#ffffff',
          fontSize: '80px',
          fontFamily: 'Public Sans',
          fontWeight: 700,
          lineHeight: 1.05,
          marginBottom: subtitle ? '20px' : '0'
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '30px',
            fontFamily: 'Public Sans',
            fontWeight: 400
          }}
        >
          {subtitle}
        </div>
      )}
    </div>,
    {
      ...ogImageConfig.size,
      fonts: [
        {
          name: 'Public Sans',
          data: fontData,
          weight: 700,
          style: 'normal'
        }
      ]
    }
  )
}
```

- [ ] **Step 2: Create barrel export**

Create `src/components/og-image/index.ts`:

```ts
export * from './og-image'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/og-image/
git commit -m "feat: add shared branded OG image template using ImageResponse"
```

---

## Task 3: Root Layout — metadataBase + JSON-LD Injection

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Open `src/app/layout.tsx`. Replace the existing `metadata` export and add JSON-LD `<script>` tags. The full updated file:

```tsx
import './globals.css'

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Public_Sans, Lora, Caveat } from 'next/font/google'
import { cn } from '~/lib/shadcn/utils'
import { buildWebSite, buildOrganization } from '~/lib/seo'

const loraHeading = Lora({ subsets: ['latin'], variable: '--font-heading' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })
const caveatHand = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://kammi.id'),
  title: {
    default: 'KAMMI.id',
    template: '%s — KAMMI.id'
  },
  description: 'Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    siteName: 'KAMMI.id',
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@KAMMIPusat'
  },
  robots: { index: true, follow: true }
}

const RootLayout = ({
  children
}: Readonly<{
  children: ReactNode
}>) => {
  return (
    <html
      lang='id'
      className={cn(
        'font-sans antialiased',
        publicSans.variable,
        loraHeading.variable,
        caveatHand.variable
      )}
    >
      <head>
        <meta name='apple-mobile-web-app-title' content='KAMMI.id' />
      </head>
      <body className='flex min-h-full flex-col'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSite()) }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganization())
          }}
        />
        {children}
        <div id='portal-root' aria-hidden='true' />
      </body>
    </html>
  )
}

export default RootLayout
```

- [ ] **Step 2: Verify in dev server**

Start the dev server if not running (`bun dev`), then:

```bash
curl -s http://localhost:3000 | grep -A2 'application/ld+json'
```

Expected output: two `<script type="application/ld+json">` blocks — one containing `"@type":"WebSite"`, one containing `"@type":"Organization"`.

Also check:

```bash
curl -s http://localhost:3000 | grep 'meta name="twitter:card"'
```

Expected: `<meta name="twitter:card" content="summary_large_image"/>`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add metadataBase, default metadata, and JSON-LD to root layout"
```

---

## Task 4: manifest.ts — Replace Static manifest.json

**Files:**

- Create: `src/app/manifest.ts`
- Delete: `src/app/manifest.json`

- [ ] **Step 1: Create manifest.ts**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'

const manifest = (): MetadataRoute.Manifest => ({
  name: 'KAMMI.id',
  short_name: 'KAMMI',
  description: 'Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia',
  start_url: '/',
  id: 'kammi-id',
  lang: 'id',
  dir: 'ltr',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  categories: ['education', 'social'],
  icons: [
    {
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    }
  ]
})

export default manifest
```

- [ ] **Step 2: Delete the static file**

```bash
rm src/app/manifest.json
```

- [ ] **Step 3: Verify**

```bash
curl -s http://localhost:3000/manifest.webmanifest | python3 -m json.tool | grep -E '"start_url|"id|"lang|"categories'
```

Expected: `"start_url": "/"`, `"id": "kammi-id"`, `"lang": "id"`, `"categories": ["education", "social"]`

- [ ] **Step 4: Commit**

```bash
git add src/app/manifest.ts
git rm src/app/manifest.json
git commit -m "feat: convert manifest.json to dynamic manifest.ts with full PWA fields"
```

---

## Task 5: robots.ts

**Files:**

- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots.ts**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/login', '/api/']
    }
  ],
  sitemap: 'https://kammi.id/sitemap.xml'
})

export default robots
```

- [ ] **Step 2: Verify**

```bash
curl -s http://localhost:3000/robots.txt
```

Expected:

```
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /api/

Sitemap: https://kammi.id/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.ts — disallow dashboard, login, and api routes"
```

---

## Task 6: sitemap.ts

**Files:**

- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create sitemap.ts**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'

type SitemapEntry = MetadataRoute.Sitemap[number]

const BASE_URL = 'https://kammi.id'

export const getStaticRoutes = (): SitemapEntry[] => [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0
  },
  {
    url: `${BASE_URL}/berita`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8
  },
  {
    url: `${BASE_URL}/event`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8
  },
  {
    url: `${BASE_URL}/tentang`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7
  },
  {
    url: `${BASE_URL}/tentang/pengurus`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6
  }
]

// To add dynamic routes in future: merge with getStaticRoutes() in the default export.
// Example: const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
//   ...getStaticRoutes(),
//   ...await getDynamicBeritaRoutes(),
// ]

const sitemap = (): MetadataRoute.Sitemap => getStaticRoutes()

export default sitemap
```

- [ ] **Step 2: Verify**

```bash
curl -s http://localhost:3000/sitemap.xml | grep '<loc>'
```

Expected: 5 `<loc>` entries — `https://kammi.id`, `/berita`, `/event`, `/tentang`, `/tentang/pengurus`.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add sitemap.ts with 5 static public routes and modular structure"
```

---

## Task 7: Per-Segment OG Image Files

**Files:**

- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/(main)/opengraph-image.tsx`
- Create: `src/app/(main)/berita/opengraph-image.tsx`
- Create: `src/app/(main)/event/opengraph-image.tsx`
- Create: `src/app/(main)/tentang/opengraph-image.tsx`

- [ ] **Step 1: Create root fallback OG image**

Create `src/app/opengraph-image.tsx`:

```tsx
import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'KAMMI.id',
    subtitle: 'Kesatuan Aksi Mahasiswa Muslim Indonesia'
  })

export default Image
```

- [ ] **Step 2: Create (main) group fallback OG image**

Create `src/app/(main)/opengraph-image.tsx`:

```tsx
import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'KAMMI.id',
    subtitle: 'Kesatuan Aksi Mahasiswa Muslim Indonesia'
  })

export default Image
```

- [ ] **Step 3: Create berita OG image**

Create `src/app/(main)/berita/opengraph-image.tsx`:

```tsx
import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({ title: 'Berita', subtitle: 'Kabar terkini dari KAMMI' })

export default Image
```

- [ ] **Step 4: Create event OG image**

Create `src/app/(main)/event/opengraph-image.tsx`:

```tsx
import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'Event & Agenda',
    subtitle: 'Pelatihan, seminar, dan kongres KAMMI'
  })

export default Image
```

- [ ] **Step 5: Create tentang OG image**

Create `src/app/(main)/tentang/opengraph-image.tsx`:

```tsx
import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'Tentang KAMMI',
    subtitle: 'Sejarah, visi, misi, dan nilai gerakan'
  })

export default Image
```

- [ ] **Step 6: Verify OG images are served**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/opengraph-image
```

Expected: `200`

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/berita/opengraph-image
```

Expected: `200`

Open `http://localhost:3000/berita/opengraph-image` in a browser to confirm the branded image renders correctly.

- [ ] **Step 7: Commit**

```bash
git add src/app/opengraph-image.tsx \
        "src/app/(main)/opengraph-image.tsx" \
        "src/app/(main)/berita/opengraph-image.tsx" \
        "src/app/(main)/event/opengraph-image.tsx" \
        "src/app/(main)/tentang/opengraph-image.tsx"
git commit -m "feat: add per-segment opengraph-image.tsx files for all public routes"
```

---

## Task 8: Dashboard & Login — noindex + Proper Metadata

**Files:**

- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/login/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Add noindex to dashboard group layout**

Open `src/app/(dashboard)/layout.tsx`. Add `Metadata` import and export:

```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Toaster } from '~/components/shadcn/ui/sonner'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true }
}

const RootDashboardLayout = ({
  children
}: Readonly<{
  children: ReactNode
}>) => {
  return (
    <>
      {children}
      <Toaster position='top-right' />
    </>
  )
}

export default RootDashboardLayout
```

- [ ] **Step 2: Add metadata to login page**

Open `src/app/(dashboard)/login/page.tsx`. Add a `metadata` export at the top of the file (after existing imports):

```ts
export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke dashboard pengelola KAMMI.id.'
}
```

Also add the import at the top:

```ts
import type { Metadata } from 'next'
```

- [ ] **Step 3: Add metadata to dashboard home page**

Open `src/app/(dashboard)/dashboard/page.tsx`. Add:

```ts
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Panel pengelolaan data dan konten KAMMI.id.'
}
```

- [ ] **Step 4: Verify noindex is applied**

```bash
curl -s http://localhost:3000/login | grep 'robots'
```

Expected: `<meta name="robots" content="noindex,nofollow,nocache"/>`

```bash
curl -s http://localhost:3000/dashboard | grep 'robots'
```

Expected: same `noindex` meta tag.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/layout.tsx" \
        "src/app/(dashboard)/login/page.tsx" \
        "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: add noindex to dashboard group and proper metadata for login/dashboard pages"
```

---

## Task 9: Public Page Metadata Consistency Pass

**Files:**

- Modify: `src/app/(main)/page.tsx`
- Modify: `src/app/(main)/berita/page.tsx`
- Modify: `src/app/(main)/event/page.tsx`
- Modify: `src/app/(main)/tentang/page.tsx`
- Modify: `src/app/(main)/tentang/pengurus/page.tsx`

**Context:** The root `title.template` is `'%s — KAMMI.id'`. Any page title that already includes `— KAMMI.id` will double-append it. This task also adds `openGraph` fields and injects `BreadcrumbList` JSON-LD as a Server Component `<script>` tag on each page.

- [ ] **Step 1: Update berita/page.tsx**

Open `src/app/(main)/berita/page.tsx`. Replace the existing `metadata` export:

```ts
import type { Metadata } from 'next'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Berita',
  description:
    'Kabar terkini dan informasi resmi dari Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    title: 'Berita',
    description:
      'Kabar terkini dan informasi resmi dari Kesatuan Aksi Mahasiswa Muslim Indonesia.'
  }
}
```

Add the BreadcrumbList `<script>` inside the page component's returned JSX, as the first child of the outermost element:

```tsx
<script
  type='application/ld+json'
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      buildBreadcrumb([
        { name: 'Beranda', url: '/' },
        { name: 'Berita', url: '/berita' }
      ])
    )
  }}
/>
```

- [ ] **Step 2: Update event/page.tsx**

Open `src/app/(main)/event/page.tsx`. The current title `'Event & Agenda — KAMMI.id'` will double-suffix — fix it. Replace the `metadata` export:

```ts
import type { Metadata } from 'next'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Event & Agenda',
  description:
    'Ikuti berbagai agenda pelatihan kaderisasi, seminar nasional, diskusi publik, dan kongres Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    title: 'Event & Agenda',
    description:
      'Ikuti berbagai agenda pelatihan kaderisasi, seminar nasional, diskusi publik, dan kongres Kesatuan Aksi Mahasiswa Muslim Indonesia.'
  }
}
```

Add BreadcrumbList `<script>` inside the page component's outermost element:

```tsx
<script
  type='application/ld+json'
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      buildBreadcrumb([
        { name: 'Beranda', url: '/' },
        { name: 'Event & Agenda', url: '/event' }
      ])
    )
  }}
/>
```

- [ ] **Step 3: Update tentang/page.tsx**

Open `src/app/(main)/tentang/page.tsx`. Replace the `metadata` export:

```ts
import type { Metadata } from 'next'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.',
  openGraph: {
    title: 'Tentang',
    description:
      'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
  }
}
```

Add BreadcrumbList `<script>` inside the page's outermost element:

```tsx
<script
  type='application/ld+json'
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      buildBreadcrumb([
        { name: 'Beranda', url: '/' },
        { name: 'Tentang', url: '/tentang' }
      ])
    )
  }}
/>
```

- [ ] **Step 4: Update tentang/pengurus/page.tsx**

Open `src/app/(main)/tentang/pengurus/page.tsx`. The current title `'Pengurus Pusat — KAMMI.id'` will double-suffix — fix it. Replace the `metadata` export:

```ts
import type { Metadata } from 'next'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Pengurus Pusat',
  description:
    'Mengenal Ketua Umum, Sekretaris Jenderal, Bendahara Umum, dan seluruh jajaran Pengurus Pusat KAMMI.',
  openGraph: {
    title: 'Pengurus Pusat',
    description:
      'Mengenal Ketua Umum, Sekretaris Jenderal, Bendahara Umum, dan seluruh jajaran Pengurus Pusat KAMMI.'
  }
}
```

Add BreadcrumbList `<script>` inside the page's outermost element:

```tsx
<script
  type='application/ld+json'
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      buildBreadcrumb([
        { name: 'Beranda', url: '/' },
        { name: 'Tentang', url: '/tentang' },
        { name: 'Pengurus Pusat', url: '/tentang/pengurus' }
      ])
    )
  }}
/>
```

- [ ] **Step 5: Update (main)/page.tsx — add Twitter card fields**

Open `src/app/(main)/page.tsx`. The `generateMetadata` function already sets OG fields from CMS. Add Twitter card data to the returned object:

```ts
return {
  title: meta.pageTitle,
  description: meta.metaDescription,
  openGraph: {
    title: meta.pageTitle,
    description: meta.metaDescription,
    images: [
      {
        url: meta.ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'KAMMI.id'
      }
    ]
  },
  twitter: {
    title: meta.pageTitle,
    description: meta.metaDescription,
    images: [meta.ogImageUrl]
  }
}
```

- [ ] **Step 6: Verify title template is working**

```bash
curl -s http://localhost:3000/tentang | grep '<title>'
```

Expected: `<title>Tentang — KAMMI.id</title>` (not `Tentang KAMMI — KAMMI.id`)

```bash
curl -s http://localhost:3000/event | grep '<title>'
```

Expected: `<title>Event &amp; Agenda — KAMMI.id</title>`

```bash
curl -s http://localhost:3000/tentang | grep 'BreadcrumbList'
```

Expected: JSON-LD block with `"@type":"BreadcrumbList"`.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(main)/page.tsx" \
        "src/app/(main)/berita/page.tsx" \
        "src/app/(main)/event/page.tsx" \
        "src/app/(main)/tentang/page.tsx" \
        "src/app/(main)/tentang/pengurus/page.tsx"
git commit -m "feat: consistent metadata, OG fields, and BreadcrumbList JSON-LD on all public pages"
```

---

## Done

After all 9 tasks complete, verify the full implementation with:

```bash
# Run unit tests
bun test tests/lib/seo/

# Check all key SEO endpoints
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/manifest.webmanifest

# Confirm noindex on protected routes
curl -s http://localhost:3000/login | grep robots
curl -s http://localhost:3000/dashboard | grep robots

# Confirm JSON-LD on root
curl -s http://localhost:3000 | grep 'application/ld+json'
```

Test social sharing locally using [https://www.opengraph.xyz](https://www.opengraph.xyz) or Meta's Sharing Debugger by pointing to the production URL after deploy.
