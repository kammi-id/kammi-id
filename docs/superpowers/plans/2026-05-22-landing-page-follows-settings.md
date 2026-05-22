# Landing Page Follows Site Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all `(main)` landing page components to read content from `site_settings` DB (via `readSiteSettings` + `use cache`) instead of hardcoded values.

**Architecture:** Each server component fetches its own settings independently using a collocated data layer at `src/app/(main)/_data/site-settings.ts`. The functions mirror those in the dashboard settings page but are colocated to the landing page route for clarity. S3-stored images are handled via a utility that distinguishes public URLs from S3 paths and returns the correct access URL.

**Tech Stack:** Next.js 16 (RSC, `use cache`, `cacheLife`, `cacheTag`), Drizzle ORM, Bun S3 (MinIO), `@hugeicons/react`, existing `~/db/query/site-settings` types and defaults.

---

## Context: What Already Exists

The following were built in the previous session and must NOT be recreated:

- `src/db/schema/site-settings.sql.ts` — Drizzle table `site_settings { key TEXT PK, data JSONB, updatedAt }`
- `src/db/query/site-settings.ts` — exports `readSiteSettings<T>(key, fallback)`, `upsertSiteSettings(key, data)`, and all type definitions: `HeroSettings`, `AboutSettings`, `LeadershipSettings`, `ActionsSettings`, `NavSettings`, `FooterSettings`, `MetadataSettings`, and `SETTINGS_DEFAULTS`
- `src/app/(dashboard)/dashboard/pages/home/_components/action.ts` — server actions that call `upsertSiteSettings` and `revalidatePath('/')`
- `src/app/(dashboard)/dashboard/pages/home/_data/settings.ts` — cached getters used by the dashboard settings page (do not import from `(main)` — that would be wrong coupling)
- `src/lib/api/storage.ts` — exports `storage.getSignedUrl(key): Promise<string>`
- `src/lib/actions/storage.ts` — exports `getSignedUrlAction(path)`

**Current hardcoded data to replace** (all currently inline in each component):
- `hero-section.tsx`: title, subtitle, badge, image, quote, CTA labels/hrefs
- `about-section.tsx`: 2 paragraphs, mini strategi title/description/link
- `leadership-section.tsx`: `LEADERS` array with name/role/seed
- `actions-section.tsx`: `ACTIONS` array with label/sublabel/description/seed/featured
- `navbar.tsx`: `NAV_LINKS` array, CTA label/href
- `footer.tsx`: social links, footer nav groups
- `(main)/page.tsx`: `metadata` export with pageTitle/description/ogImage

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/(main)/_data/site-settings.ts` | **CREATE** | Cached getters for landing page — one function per settings key |
| `src/lib/utils/site-image.ts` | **CREATE** | `resolveSiteImage(path)` — returns public URL directly or signed URL for S3 paths |
| `src/app/(main)/_components/hero-section/hero-section.tsx` | **MODIFY** | Fetch hero settings, pass to template |
| `src/app/(main)/_components/about-section/about-section.tsx` | **MODIFY** | Fetch about settings, pass to template |
| `src/app/(main)/_components/leadership-section/leadership-section.tsx` | **MODIFY** | Fetch leadership settings, resolve photo URLs |
| `src/app/(main)/_components/actions-section/actions-section.tsx` | **MODIFY** | Fetch actions settings, resolve image URLs |
| `src/app/(main)/_components/navbar/navbar.tsx` | **MODIFY** | Fetch nav settings, replace NAV_LINKS constant |
| `src/app/(main)/_components/footer/footer.tsx` | **MODIFY** | Fetch footer settings, replace hardcoded nav groups and social links |
| `src/app/(main)/page.tsx` | **MODIFY** | Dynamic `generateMetadata` using MetadataSettings |

---

## Task 1: Create Landing Page Data Layer

**Files:**
- Create: `src/app/(main)/_data/site-settings.ts`

- [ ] **Step 1: Write the file**

```typescript
// src/app/(main)/_data/site-settings.ts
import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HeroSettings,
  type AboutSettings,
  type LeadershipSettings,
  type ActionsSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings
} from '~/db/query/site-settings'

export const getHeroSettings = async (): Promise<HeroSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-hero')
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero)
}

export const getAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-about')
  return readSiteSettings<AboutSettings>('about', SETTINGS_DEFAULTS.about)
}

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-leadership')
  return readSiteSettings<LeadershipSettings>('leadership', SETTINGS_DEFAULTS.leadership)
}

export const getActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-actions')
  return readSiteSettings<ActionsSettings>('actions', SETTINGS_DEFAULTS.actions)
}

export const getNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-nav')
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav)
}

export const getFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-footer')
  return readSiteSettings<FooterSettings>('footer', SETTINGS_DEFAULTS.footer)
}

export const getMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-metadata')
  return readSiteSettings<MetadataSettings>('metadata', SETTINGS_DEFAULTS.metadata)
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104
bun tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_data/site-settings.ts
git commit -m "feat: add landing page site-settings data layer"
```

---

## Task 2: Create Site Image URL Resolver

**Files:**
- Create: `src/lib/utils/site-image.ts`

Images stored via `ImageUpload` are S3 paths (e.g. `site-settings/hero/uuid_file.jpg`). Public URLs (e.g. `https://picsum.photos/...`) can be used directly. This utility resolves the correct URL for each case. On the landing page, we generate a long-lived signed URL (24h) so cached RSC output stays valid.

- [ ] **Step 1: Write the file**

```typescript
// src/lib/utils/site-image.ts
import { storage } from '~/lib/api/storage'

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 // 24 hours

/**
 * Resolves a site image value to a usable URL.
 * - If already a full URL (http/https) or root-relative (/), returns as-is.
 * - Otherwise treats it as an S3 key and returns a 24-hour signed URL.
 */
export const resolveSiteImage = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path
  }
  try {
    return await storage.client.file(path).presign({ expiresIn: SIGNED_URL_EXPIRY_SECONDS })
  } catch {
    return ''
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
bun tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/site-image.ts
git commit -m "feat: add resolveSiteImage utility for S3/public URL handling"
```

---

## Task 3: Update HeroSection

**Files:**
- Modify: `src/app/(main)/_components/hero-section/hero-section.tsx`

Replace all hardcoded values with data from `getHeroSettings()`.

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/hero-section/hero-section.tsx
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getHeroSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const HeroSection = async () => {
  const hero = await getHeroSettings()
  const heroImageSrc = await resolveSiteImage(hero.heroImageUrl)

  return (
    <section className='relative bg-background pt-10 pb-12 lg:pt-20 lg:pb-0' aria-labelledby='hero-heading'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]'>

          {/* Left: Copy */}
          <div className='pb-0 lg:pb-24'>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5'>
              <span className='size-1.5 rounded-full bg-primary' aria-hidden='true' />
              <span className='font-sans text-xs font-semibold tracking-widest text-primary uppercase'>
                {hero.badgeText}
              </span>
            </div>

            <h1
              id='hero-heading'
              className='font-heading text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground'
            >
              {hero.title}{' '}
              <em className='not-italic text-primary'>{hero.titleAccent}</em>
              <br />
              Indonesia
            </h1>

            <p className='mt-6 max-w-xl font-sans text-base leading-relaxed text-muted-foreground md:text-lg'>
              {hero.subtitle}
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href={hero.cta1Href} className={cn(buttonVariants({ size: 'lg' }))}>
                {hero.cta1Label}
              </Link>
              <Link href={hero.cta2Href} className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>
                {hero.cta2Label}
              </Link>
            </div>
          </div>

          {/* Right: Photo + floating quote */}
          <div className='relative lg:block'>
            <div className='relative overflow-hidden rounded-tl-3xl rounded-tr-3xl'>
              {heroImageSrc && (
                <Image
                  src={heroImageSrc}
                  alt={hero.heroImageAlt}
                  width={480}
                  height={580}
                  className='h-auto w-full object-cover'
                  priority
                  unoptimized={heroImageSrc.includes('?')}
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent' aria-hidden='true' />
            </div>

            {/* Floating quote card */}
            <div className='absolute -bottom-6 left-4 max-w-[240px] rounded-2xl bg-primary px-5 py-4 shadow-xl lg:-left-12'>
              <svg
                className='mb-2 size-5 text-primary-foreground/60'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z' />
              </svg>
              <p className='font-heading text-sm font-bold leading-snug text-primary-foreground'>
                &ldquo;{hero.quoteText}&rdquo;
              </p>
              <p className='mt-2 font-sans text-xs text-primary-foreground/70'>
                {hero.quoteAttribution}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background accent */}
      <div
        className='pointer-events-none absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl'
        aria-hidden='true'
      />
    </section>
  )
}
```

> **Note on `unoptimized`:** Signed S3 URLs contain `?` query params. Next.js Image optimization doesn't support external URLs with query strings unless the domain is configured in `next.config.ts`. Using `unoptimized` for signed URLs is the correct escape hatch.

- [ ] **Step 2: Verify dev server has no build errors**

Open `http://localhost:3000` and confirm hero section renders.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/hero-section/hero-section.tsx
git commit -m "feat: hero section reads from site_settings"
```

---

## Task 4: Update AboutSection

**Files:**
- Modify: `src/app/(main)/_components/about-section/about-section.tsx`

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/about-section/about-section.tsx
import Link from 'next/link'
import { getAboutSettings } from '~/app/(main)/_data/site-settings'

export const AboutSection = async () => {
  const about = await getAboutSettings()

  return (
    <section
      id='tentang'
      className='bg-background py-20 lg:py-28'
      aria-labelledby='about-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px] xl:gap-20'>

          {/* Left: About text */}
          <div>
            <h2
              id='about-heading'
              className='font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
            >
              Tentang KAMMI
            </h2>
            <div className='mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
            <p className='mt-6 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground'>
              {about.paragraph1}
            </p>
            <p className='mt-4 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground'>
              {about.paragraph2}
            </p>
            <Link
              href={about.readMoreHref}
              className='group mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline'
            >
              {about.readMoreLabel}
              <svg
                className='size-4 transition-transform group-hover:translate-x-0.5'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path d='M3 8h10M9 4l4 4-4 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </Link>
          </div>

          {/* Right: Mini Strategi card */}
          <div className='flex flex-col gap-4'>
            <div className='rounded-2xl bg-primary p-6 text-primary-foreground'>
              <div className='mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15'>
                <svg className='size-5' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
                  <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='1.5' strokeDasharray='3 2' />
                  <path d='M12 4v2M12 18v2M4 12h2M18 12h2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                </svg>
              </div>
              <h3 className='font-heading text-lg font-bold'>{about.miniStrategiTitle}</h3>
              <p className='mt-2 font-sans text-sm leading-relaxed text-primary-foreground/80'>
                {about.miniStrategiDescription}
              </p>
              <Link
                href={about.miniStrategiLinkHref}
                className='mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-primary-foreground/90 hover:text-primary-foreground'
              >
                {about.miniStrategiLinkLabel}
                <svg className='size-4' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
                  <path d='M3 8h10M9 4l4 4-4 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify dev server, check `http://localhost:3000#tentang` renders correctly.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/about-section/about-section.tsx
git commit -m "feat: about section reads from site_settings"
```

---

## Task 5: Update LeadershipSection

**Files:**
- Modify: `src/app/(main)/_components/leadership-section/leadership-section.tsx`

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/leadership-section/leadership-section.tsx
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const LeadershipSection = async () => {
  const { periodLabel, heading, leaders } = await getLeadershipSettings()

  const resolvedLeaders = await Promise.all(
    leaders.map(async (l) => ({
      ...l,
      photoSrc: await resolveSiteImage(l.photoUrl)
    }))
  )

  return (
    <section
      className='bg-background py-20 lg:py-28'
      aria-labelledby='leadership-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-3 text-center'>
          <p className='font-sans text-xs font-semibold tracking-widest text-primary uppercase'>
            {periodLabel}
          </p>
          <h2
            id='leadership-heading'
            className='mt-2 font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
          >
            {heading}
          </h2>
          <div className='mx-auto mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
        </div>

        <div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {resolvedLeaders.map((leader) => (
            <article
              key={leader.name}
              className='group flex flex-col items-center text-center'
            >
              <div className='relative mb-4 overflow-hidden rounded-2xl'>
                {leader.photoSrc ? (
                  <Image
                    src={leader.photoSrc}
                    alt={`Foto ${leader.name}`}
                    width={360}
                    height={420}
                    className='h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72'
                    unoptimized={leader.photoSrc.includes('?')}
                  />
                ) : (
                  <div className='h-64 w-full bg-muted sm:h-72' />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent' aria-hidden='true' />
              </div>
              <h3 className='font-heading text-base font-bold text-foreground'>{leader.name}</h3>
              <p className='mt-1 font-sans text-xs font-semibold tracking-wide text-primary uppercase'>
                {leader.role}
              </p>
            </article>
          ))}
        </div>

        <div className='mt-10 flex justify-center'>
          <Link href='/dashboard' className={cn(buttonVariants({ variant: 'outline' }))}>
            Selengkapnya
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify renders at `http://localhost:3000`.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/leadership-section/leadership-section.tsx
git commit -m "feat: leadership section reads from site_settings"
```

---

## Task 6: Update ActionsSection

**Files:**
- Modify: `src/app/(main)/_components/actions-section/actions-section.tsx`

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/actions-section/actions-section.tsx
import Image from 'next/image'
import { getActionsSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const ActionsSection = async () => {
  const { heading, subheading, programs } = await getActionsSettings()

  const resolvedPrograms = await Promise.all(
    programs.map(async (p) => ({
      ...p,
      imageSrc: await resolveSiteImage(p.imageUrl)
    }))
  )

  const featured = resolvedPrograms.find((p) => p.featured)
  const regular = resolvedPrograms.filter((p) => !p.featured)

  return (
    <section
      className='bg-foreground py-20 lg:py-28'
      aria-labelledby='actions-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2
            id='actions-heading'
            className='font-heading text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold text-background'
          >
            {heading}
          </h2>
          <p className='mt-3 font-sans text-sm text-background/60'>
            {subheading}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-4 lg:grid-cols-[2fr_1fr_1fr]'>
          {/* Featured card */}
          {featured && (
            <article className='group relative col-span-2 overflow-hidden rounded-2xl lg:col-span-1 lg:row-span-2'>
              {featured.imageSrc && (
                <Image
                  src={featured.imageSrc}
                  alt={`Dokumentasi ${featured.label}`}
                  width={600}
                  height={700}
                  className='h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:h-full'
                  unoptimized={featured.imageSrc.includes('?')}
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-5'>
                <span className='inline-block rounded-full bg-primary px-3 py-1 font-sans text-xs font-bold text-primary-foreground'>
                  {featured.label}
                </span>
                <p className='mt-2 font-heading text-base font-bold leading-snug text-background'>
                  {featured.sublabel}
                </p>
                <p className='mt-1 font-sans text-xs text-background/70'>{featured.description}</p>
              </div>
            </article>
          )}

          {/* Regular cards */}
          {regular.map((program) => (
            <article
              key={program.id}
              className='group relative overflow-hidden rounded-2xl'
            >
              {program.imageSrc && (
                <Image
                  src={program.imageSrc}
                  alt={`Dokumentasi ${program.label}`}
                  width={400}
                  height={280}
                  className='h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:h-44'
                  unoptimized={program.imageSrc.includes('?')}
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/10 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-4'>
                <p className='font-heading text-sm font-bold leading-tight text-background'>
                  {program.sublabel}
                </p>
                <p className='mt-0.5 font-sans text-xs text-background/60'>{program.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify renders at `http://localhost:3000`.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/actions-section/actions-section.tsx
git commit -m "feat: actions section reads from site_settings"
```

---

## Task 7: Update Navbar

**Files:**
- Modify: `src/app/(main)/_components/navbar/navbar.tsx`

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/navbar/navbar.tsx
import Image from 'next/image'
import Link from 'next/link'
import Logo from '~/assets/logo-header.png'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getNavSettings } from '~/app/(main)/_data/site-settings'

export const Navbar = async () => {
  const nav = await getNavSettings()

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src={Logo}
            alt='Pengurus Pusat Kesatuan Aksi Mahasiswa Muslim Indonesia'
            className='h-10 w-auto object-contain'
            priority
            style={{ width: 'auto', height: '40px' }}
          />
        </Link>

        <nav className='hidden items-center gap-1 md:flex' aria-label='Navigasi utama'>
          {nav.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={nav.ctaBergabungHref}
          className={cn(buttonVariants({ size: 'sm' }), 'hidden md:inline-flex')}
        >
          {nav.ctaBergabungLabel}
        </Link>

        <button
          className='flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden'
          aria-label='Buka menu navigasi'
        >
          <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
            <path d='M3 5h14M3 10h14M3 15h14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          </svg>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify navbar renders correctly at `http://localhost:3000`.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/navbar/navbar.tsx
git commit -m "feat: navbar reads nav links from site_settings"
```

---

## Task 8: Update Footer

**Files:**
- Modify: `src/app/(main)/_components/footer/footer.tsx`

- [ ] **Step 1: Rewrite the component**

```typescript
// src/app/(main)/_components/footer/footer.tsx
import Link from 'next/link'
import Image from 'next/image'
import Logo from '~/assets/logo-header.png'
import { getFooterSettings } from '~/app/(main)/_data/site-settings'

export const Footer = async () => {
  'use cache'
  const footer = await getFooterSettings()

  const FOOTER_LINKS = {
    KAMMI: footer.footerKAMMI,
    'Berita & Data': footer.footerBeritaData,
    'Ikuti Kami': footer.footerIkutiKami
  }

  const socialLinks = [
    { id: 'ig', href: footer.socialIG, label: 'Instagram' },
    { id: 'tw', href: footer.socialTwitter, label: 'Twitter / X' },
    { id: 'yt', href: footer.socialYoutube, label: 'YouTube' }
  ].filter((s) => s.href && s.href !== '#')

  return (
    <footer className='border-t border-border bg-muted'>
      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-8'>
        <div className='grid grid-cols-2 gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]'>
          {/* Brand column */}
          <div className='col-span-2 lg:col-span-1'>
            <Image
              src={Logo}
              alt='KAMMI.id'
              className='h-10 w-auto object-contain'
              style={{ height: '40px', width: 'auto' }}
            />
            <p className='mt-4 max-w-xs font-sans text-sm leading-relaxed text-muted-foreground'>
              Kesatuan Aksi Mahasiswa Muslim Indonesia. Organisasi mahasiswa
              yang berkomitmen membangun bangsa lewat intelektualitas dan
              integritas.
            </p>
            {socialLinks.length > 0 && (
              <div className='mt-6 flex gap-3'>
                {socialLinks.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    className='flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground'
                    aria-label={`Ikuti di ${s.label}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <svg className='size-4' viewBox='0 0 16 16' fill='currentColor' aria-hidden='true'>
                      <rect width='16' height='16' rx='3' fillOpacity='0.2' />
                      <path d='M8 5a3 3 0 1 0 0 6A3 3 0 0 0 8 5zm0 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.5-5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z' />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className='font-sans text-xs font-semibold tracking-widest text-foreground/40 uppercase'>
                {title}
              </h3>
              <ul className='mt-4 space-y-2.5' role='list'>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className='font-sans text-sm text-muted-foreground transition-colors hover:text-foreground'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row'>
          <p className='font-sans text-xs text-foreground/40'>
            &copy; {new Date().getFullYear()} KAMMI.id. Hak Cipta Dilindungi.
          </p>
          <Link
            href='#'
            className='rounded-full border border-border px-4 py-1.5 font-sans text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground'
          >
            Hubungi Kami
          </Link>
        </div>
      </div>
    </footer>
  )
}
```

> **Note on `'use cache'` + async call:** The footer already had `'use cache'`. Calling `getFooterSettings()` inside an already-cached function is fine — the inner `use cache` is a no-op since the outer cache wraps the whole function. The `cacheTag` on the inner function still registers correctly.

- [ ] **Step 2: Verify footer renders at `http://localhost:3000`.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/_components/footer/footer.tsx
git commit -m "feat: footer reads nav links and social from site_settings"
```

---

## Task 9: Update Page Metadata

**Files:**
- Modify: `src/app/(main)/page.tsx`

Replace the static `metadata` export with `generateMetadata` that fetches from settings.

- [ ] **Step 1: Rewrite page.tsx**

```typescript
// src/app/(main)/page.tsx
import type { Metadata } from 'next'
import { HeroSection } from './_components/hero-section'
import { AboutSection } from './_components/about-section'
import { ActionsSection } from './_components/actions-section'
import { LeadershipSection } from './_components/leadership-section'
import { NetworkSection } from './_components/network-section'
import { PublicationsSection } from './_components/publications-section'
import { CtaSection } from './_components/cta-section'
import { getMetadataSettings } from './_data/site-settings'

export const generateMetadata = async (): Promise<Metadata> => {
  const meta = await getMetadataSettings()
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
    }
  }
}

const Page = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ActionsSection />
      <LeadershipSection />
      <NetworkSection />
      <PublicationsSection />
      <CtaSection />
    </>
  )
}

export default Page
```

- [ ] **Step 2: Verify `http://localhost:3000` — check page `<title>` in browser tab matches settings default.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/page.tsx
git commit -m "feat: page metadata reads from site_settings"
```

---

## Self-Review

**Spec coverage:**
- Hero ✓ (Task 3)
- About ✓ (Task 4)
- Leadership ✓ (Task 5)
- Actions/Programs ✓ (Task 6)
- Navigation ✓ (Task 7)
- Footer + Social links ✓ (Task 8)
- Metadata/SEO ✓ (Task 9)
- S3 image URL resolution ✓ (Task 2, used in Tasks 3/5/6)

**Sections not in scope** (no settings defined for them):
- `NetworkSection` — stats remain hardcoded (not in settings schema)
- `PublicationsSection` — articles remain hardcoded (not in settings schema)
- `CtaSection` — CTA content remains hardcoded (not in settings schema)

**Placeholder scan:** None found. All steps have complete code.

**Type consistency:** All types imported from `~/db/query/site-settings`. `getXxxSettings()` return types match what each component destructures. `resolveSiteImage` returns `Promise<string>` used consistently with `await`.
