# /tentang Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, museum-like `/tentang` page — Hero + 8 sections, GSAP scroll animations, Lenis smooth scroll, and a sticky section nav.

**Architecture:** Lenis wraps the `(main)` layout globally, synced to GSAP's RAF ticker so ScrollTrigger works natively. Each section is a `'use client'` component using `useGSAP` for scroll-driven reveals. The Kredo section uses GSAP horizontal pin on desktop (≥768px), vertical stack on mobile. Content is inline placeholder; user updates later.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, GSAP 3.15 + `@gsap/react`, Lenis (new install), Bun

---

## File Map

| Action | Path                                                                                 | Responsibility                                         |
| ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Create | `src/components/lenis-provider/lenis-provider.tsx`                                   | Global Lenis + GSAP ScrollTrigger setup                |
| Create | `src/components/lenis-provider/index.ts`                                             | Barrel export                                          |
| Modify | `src/app/(main)/layout.tsx`                                                          | Wrap layout with LenisProvider                         |
| Create | `src/app/(main)/tentang/_components/section-nav/section-nav.tsx`                     | Sticky 8-dot nav, shows/hides based on Hero visibility |
| Create | `src/app/(main)/tentang/_components/section-nav/index.ts`                            | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/tentang-hero/tentang-hero.tsx`                   | Full-viewport title card                               |
| Create | `src/app/(main)/tentang/_components/tentang-hero/index.ts`                           | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/sejarah-section/sejarah-section.tsx`             | Section 1 — cream bg, archival                         |
| Create | `src/app/(main)/tentang/_components/sejarah-section/index.ts`                        | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/visi-section/visi-section.tsx`                   | Section 2 — crimson drench, single statement           |
| Create | `src/app/(main)/tentang/_components/visi-section/index.ts`                           | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/misi-section/misi-section.tsx`                   | Section 3 — dark bg, stagger list                      |
| Create | `src/app/(main)/tentang/_components/misi-section/index.ts`                           | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/karakteristik-section/karakteristik-section.tsx` | Section 4 — two-column                                 |
| Create | `src/app/(main)/tentang/_components/karakteristik-section/index.ts`                  | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/unsur-section/unsur-section.tsx`                 | Section 5 — quadrant                                   |
| Create | `src/app/(main)/tentang/_components/unsur-section/index.ts`                          | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/prinsip-section/prinsip-section.tsx`             | Section 6 — deep slate 2×3 grid                        |
| Create | `src/app/(main)/tentang/_components/prinsip-section/index.ts`                        | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/paradigma-section/paradigma-section.tsx`         | Section 7 — horizontal list                            |
| Create | `src/app/(main)/tentang/_components/paradigma-section/index.ts`                      | Barrel                                                 |
| Create | `src/app/(main)/tentang/_components/kredo-section/kredo-section.tsx`                 | Section 8 — GSAP horizontal pin                        |
| Create | `src/app/(main)/tentang/_components/kredo-section/index.ts`                          | Barrel                                                 |
| Modify | `src/app/(main)/tentang/page.tsx`                                                    | Compose all sections                                   |

---

## Task 1: Install Lenis

**Files:**

- No files created

- [ ] **Step 1: Install Lenis**

```bash
bun add lenis
```

Expected output: Lenis added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify install**

```bash
grep '"lenis"' package.json
```

Expected: line like `"lenis": "^1.x.x"`.

---

## Task 2: Create LenisProvider

**Files:**

- Create: `src/components/lenis-provider/lenis-provider.tsx`
- Create: `src/components/lenis-provider/index.ts`

- [ ] **Step 1: Create the component**

`src/components/lenis-provider/lenis-provider.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const LenisProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(raf)
    }
  }, [])

  return <>{children}</>
}
```

- [ ] **Step 2: Create barrel export**

`src/components/lenis-provider/index.ts`:

```ts
export * from './lenis-provider'
```

- [ ] **Step 3: Type-check**

```bash
bun run check:types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/lenis-provider/
git commit -m "feat(provider): add LenisProvider with GSAP ScrollTrigger sync"
```

---

## Task 3: Add LenisProvider to (main) layout

**Files:**

- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: Wrap layout with LenisProvider**

`src/app/(main)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <LenisProvider>
      <div className='flex min-h-screen flex-col'>
        <Navbar />
        <main className='flex-1'>{children}</main>
        <Footer />
      </div>
    </LenisProvider>
  )
}

export default MainLayout
```

- [ ] **Step 2: Type-check**

```bash
bun run check:types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/layout.tsx
git commit -m "feat(layout): integrate global Lenis smooth scroll"
```

---

## Task 4: Create SectionNav

**Files:**

- Create: `src/app/(main)/tentang/_components/section-nav/section-nav.tsx`
- Create: `src/app/(main)/tentang/_components/section-nav/index.ts`

The nav renders 8 dots — one per section. It hides when the Hero is visible and shows once the user scrolls past it. Active section is tracked via `IntersectionObserver`.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/section-nav/section-nav.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '~/lib/shadcn/utils'

const SECTIONS = [
  { id: 'sejarah', label: 'Sejarah' },
  { id: 'visi', label: 'Visi' },
  { id: 'misi', label: 'Misi' },
  { id: 'karakteristik', label: 'Karakteristik' },
  { id: 'unsur', label: 'Unsur Gerakan' },
  { id: 'prinsip', label: 'Prinsip' },
  { id: 'paradigma', label: 'Paradigma' },
  { id: 'kredo', label: 'Kredo' }
]

export const SectionNav = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('tentang-hero')
    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => setVisible(!entry.isIntersecting),
        { threshold: 0.1 }
      )
      heroObserver.observe(hero)
      return () => heroObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.4 }
      )
      observer.observe(el)
      return observer
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className={cn(
        'fixed top-1/2 right-6 z-50 -translate-y-1/2 transition-opacity duration-500',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-label='Section navigation'
    >
      <ol className='flex flex-col items-center gap-3'>
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeSection === id
          return (
            <li key={id}>
              <button
                onClick={() => scrollTo(id)}
                aria-label={`Go to ${label}`}
                className='group relative flex items-center justify-center'
              >
                <span
                  className={cn(
                    'block rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-primary size-3'
                      : 'bg-foreground/25 group-hover:bg-foreground/50 size-1.5'
                  )}
                />
                <span className='bg-foreground text-background pointer-events-none absolute right-6 rounded px-2 py-0.5 font-sans text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100'>
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

- [ ] **Step 2: Create barrel**

`src/app/(main)/tentang/_components/section-nav/index.ts`:

```ts
export * from './section-nav'
```

- [ ] **Step 3: Type-check**

```bash
bun run check:types
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/tentang/_components/section-nav/
git commit -m "feat(tentang): add sticky section navigation"
```

---

## Task 5: Create TentangHero

**Files:**

- Create: `src/app/(main)/tentang/_components/tentang-hero/tentang-hero.tsx`
- Create: `src/app/(main)/tentang/_components/tentang-hero/index.ts`

Full-viewport title card. Entrance animation on mount (heading + sub slide up). Looping scroll cue arrow. `id="tentang-hero"` used by SectionNav to detect when to show.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/tentang-hero/tentang-hero.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export const TentangHero = () => {
  const containerRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const scrollCueRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from(headingRef.current, { y: 80, opacity: 0, duration: 1.2 })
        .from(subRef.current, { y: 30, opacity: 0, duration: 0.8 }, '-=0.7')
        .from(scrollCueRef.current, { opacity: 0, duration: 0.6 }, '-=0.3')

      gsap.to(scrollCueRef.current, {
        y: 8,
        repeat: -1,
        yoyo: true,
        duration: 0.9,
        ease: 'sine.inOut',
        delay: 1.8
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='tentang-hero'
      ref={containerRef}
      className='bg-background relative flex min-h-svh flex-col justify-center overflow-hidden px-6 lg:px-8'
      aria-labelledby='tentang-heading'
    >
      <div className='mx-auto w-full max-w-7xl'>
        <p className='text-primary mb-4 font-sans text-xs font-semibold tracking-widest uppercase'>
          Mengenal KAMMI
        </p>
        <h1
          ref={headingRef}
          id='tentang-heading'
          className='font-heading text-foreground text-[clamp(4rem,10vw,9rem)] leading-[0.9] font-bold tracking-tight'
        >
          Tentang
          <br />
          <span className='text-primary'>KAMMI</span>
        </h1>
        <p
          ref={subRef}
          className='text-muted-foreground mt-8 max-w-md font-sans text-lg leading-relaxed'
        >
          Mengenal kesatuan yang lahir dari idealisme dan bertumbuh dalam
          tanggung jawab sejarah.
        </p>
      </div>

      <div
        ref={scrollCueRef}
        className='absolute bottom-10 left-1/2 -translate-x-1/2'
        aria-hidden='true'
      >
        <svg
          className='text-muted-foreground size-6'
          viewBox='0 0 24 24'
          fill='none'
        >
          <path
            d='M12 5v14M5 12l7 7 7-7'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>

      <div
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
        aria-hidden='true'
      >
        <div className='bg-primary/5 absolute top-1/4 right-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/4 rounded-full blur-3xl' />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create barrel**

`src/app/(main)/tentang/_components/tentang-hero/index.ts`:

```ts
export * from './tentang-hero'
```

- [ ] **Step 3: Type-check and commit**

```bash
bun run check:types
git add src/app/(main)/tentang/_components/tentang-hero/
git commit -m "feat(tentang): add Hero section"
```

---

## Task 6: Create SejarahSection

**Files:**

- Create: `src/app/(main)/tentang/_components/sejarah-section/sejarah-section.tsx`
- Create: `src/app/(main)/tentang/_components/sejarah-section/index.ts`

Section 1. Cream background `oklch(0.97 0.01 60)`. Text lines fade+slide up on scroll enter via ScrollTrigger. Large muted `01` as background numeral.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/sejarah-section/sejarah-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const SejarahSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const targets = containerRef.current?.querySelectorAll('[data-reveal]')
      if (!targets?.length) return

      gsap.from(targets, {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='sejarah'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='sejarah-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          01
        </span>

        <div className='max-w-3xl'>
          <p
            data-reveal
            className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'
          >
            Sejarah Singkat
          </p>
          <h2
            id='sejarah-heading'
            data-reveal
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Lahir dari Rahim Reformasi
          </h2>
          <div
            data-reveal
            className='bg-primary mt-2 h-1 w-12 rounded-full'
            aria-hidden='true'
          />
          <p
            data-reveal
            className='text-foreground/70 mt-8 font-sans text-base leading-relaxed lg:text-lg'
          >
            KAMMI didirikan pada 29 Maret 1998 di Malang, Jawa Timur, di tengah
            gejolak reformasi yang mengubah wajah Indonesia. Organisasi ini
            lahir dari kesadaran mahasiswa Muslim yang ingin berkontribusi nyata
            dalam perubahan bangsa.
          </p>
          <p
            data-reveal
            className='text-foreground/70 mt-4 font-sans text-base leading-relaxed lg:text-lg'
          >
            Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang
            konsisten menjaga arah perubahan tetap berada di jalur keadilan dan
            kebenaran. Hari ini, KAMMI hadir di ratusan kampus di seluruh
            penjuru Indonesia.
          </p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/sejarah-section/index.ts`:

```ts
export * from './sejarah-section'
```

```bash
git add src/app/(main)/tentang/_components/sejarah-section/
git commit -m "feat(tentang): add Sejarah section"
```

---

## Task 7: Create VisiSection

**Files:**

- Create: `src/app/(main)/tentang/_components/visi-section/visi-section.tsx`
- Create: `src/app/(main)/tentang/_components/visi-section/index.ts`

Section 2. Full crimson background (`bg-primary`). Single centered statement, white text. Scale+fade reveal on scroll enter.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/visi-section/visi-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const VisiSection = () => {
  const containerRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      gsap.from(textRef.current, {
        scale: 0.92,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 60%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='visi'
      ref={containerRef}
      className='bg-primary relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24 lg:px-8'
      aria-labelledby='visi-heading'
    >
      <div className='relative mx-auto max-w-5xl text-center'>
        <span
          className='font-heading text-primary-foreground/[0.05] pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(10rem,25vw,22rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          02
        </span>
        <p className='text-primary-foreground/60 font-sans text-xs font-semibold tracking-widest uppercase'>
          Visi KAMMI
        </p>
        <p
          ref={textRef}
          id='visi-heading'
          className='font-heading text-primary-foreground mt-6 text-[clamp(1.75rem,4vw,3.25rem)] leading-snug font-bold'
        >
          Terwujudnya masyarakat Islami di Indonesia yang adil dan sejahtera
          dalam naungan ridha Allah SWT.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/visi-section/index.ts`:

```ts
export * from './visi-section'
```

```bash
git add src/app/(main)/tentang/_components/visi-section/
git commit -m "feat(tentang): add Visi section"
```

---

## Task 8: Create MisiSection

**Files:**

- Create: `src/app/(main)/tentang/_components/misi-section/misi-section.tsx`
- Create: `src/app/(main)/tentang/_components/misi-section/index.ts`

Section 3. Near-black background. Numbered list of 5 items with large numerals. Each item slides in from the left, staggered on scroll enter.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/misi-section/misi-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const MISI_ITEMS = [
  'Membina mahasiswa Muslim untuk menjadi kader dakwah yang kompeten dan berintegritas tinggi.',
  'Mengembangkan potensi mahasiswa sebagai pemimpin masa depan bangsa yang bertakwa.',
  'Membangun gerakan dakwah kampus yang sistematis dan berkesinambungan di seluruh Indonesia.',
  'Mendorong perubahan sosial-politik yang berlandaskan nilai-nilai Islam yang rahmatan lil alamin.',
  'Menjaga ukhuwah Islamiyah dan persatuan umat di tengah keberagaman bangsa Indonesia.'
]

export const MisiSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-misi-item]')
      if (!items?.length) return

      gsap.from(items, {
        x: -60,
        opacity: 0,
        stagger: 0.14,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='misi'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.14_0.005_285)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='misi-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold text-white/[0.03] select-none'
          aria-hidden='true'
        >
          03
        </span>

        <div className='mb-14'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Misi KAMMI
          </p>
          <h2
            id='misi-heading'
            className='font-heading mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold text-white'
          >
            Lima Poros Gerak
          </h2>
        </div>

        <ol className='space-y-0' aria-label='Misi KAMMI'>
          {MISI_ITEMS.map((item, i) => (
            <li
              key={i}
              data-misi-item
              className='flex items-start gap-6 border-t border-white/10 py-6 last:border-b last:border-white/10'
            >
              <span
                className='font-heading text-primary/50 w-14 shrink-0 text-4xl font-bold tabular-nums lg:text-5xl'
                aria-hidden='true'
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className='mt-1.5 font-sans text-base leading-relaxed text-white/70 lg:text-lg'>
                {item}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/misi-section/index.ts`:

```ts
export * from './misi-section'
```

```bash
git add src/app/(main)/tentang/_components/misi-section/
git commit -m "feat(tentang): add Misi section"
```

---

## Task 9: Create KarakteristikSection

**Files:**

- Create: `src/app/(main)/tentang/_components/karakteristik-section/karakteristik-section.tsx`
- Create: `src/app/(main)/tentang/_components/karakteristik-section/index.ts`

Section 4. White background, two columns. Each column slides up from below, staggered.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/karakteristik-section/karakteristik-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KARAKTERISTIK_ITEMS = [
  {
    title: 'Gerakan Dakwah Amar Maruf Nahi Munkar',
    body: 'KAMMI bergerak di atas landasan dakwah Ilallah, mengajak kepada kebaikan dan mencegah kemungkaran sebagai manifestasi tanggung jawab seorang Muslim terhadap masyarakatnya.'
  },
  {
    title: 'Gerakan Mahasiswa Berlandaskan Nilai Islam',
    body: 'Setiap gerak dan langkah KAMMI dibingkai dalam nilai-nilai Islam yang komprehensif, menjadikan Islam sebagai panduan hidup yang menyeluruh, bukan sekadar ritual.'
  }
]

export const KarakteristikSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const cols = containerRef.current?.querySelectorAll('[data-kar-col]')
      if (!cols?.length) return

      gsap.from(cols, {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='karakteristik'
      ref={containerRef}
      className='bg-background relative min-h-screen px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='karakteristik-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          04
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Karakteristik KAMMI
          </p>
          <h2
            id='karakteristik-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Dua Watak Dasar
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-x-20 gap-y-12 lg:grid-cols-2'>
          {KARAKTERISTIK_ITEMS.map((item, i) => (
            <div
              key={i}
              data-kar-col
              className='border-primary border-t-2 pt-8'
            >
              <h3 className='font-heading text-foreground text-xl leading-snug font-bold lg:text-2xl'>
                {item.title}
              </h3>
              <p className='text-muted-foreground mt-5 font-sans text-base leading-relaxed lg:text-lg'>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/karakteristik-section/index.ts`:

```ts
export * from './karakteristik-section'
```

```bash
git add src/app/(main)/tentang/_components/karakteristik-section/
git commit -m "feat(tentang): add Karakteristik section"
```

---

## Task 10: Create UnsurSection

**Files:**

- Create: `src/app/(main)/tentang/_components/unsur-section/unsur-section.tsx`
- Create: `src/app/(main)/tentang/_components/unsur-section/index.ts`

Section 5. Warm cream background. 4-column quadrant on desktop. Items scale up from 0.9 on scroll enter.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/unsur-section/unsur-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const UNSUR_ITEMS = [
  {
    num: '01',
    title: 'Kader',
    desc: 'Individu Muslim yang berproses dalam pembinaan KAMMI, membentuk karakter dan kompetensi untuk dakwah.'
  },
  {
    num: '02',
    title: 'Kampus',
    desc: 'Arena utama gerak KAMMI, tempat kader hadir sebagai representasi nilai Islam di kehidupan akademik.'
  },
  {
    num: '03',
    title: 'Masyarakat',
    desc: 'Medan pengabdian nyata, di mana kader KAMMI hadir sebagai agen perubahan sosial yang berdampak.'
  },
  {
    num: '04',
    title: 'Negara',
    desc: 'Cita-cita besar KAMMI: berkontribusi pada terwujudnya negara yang adil dan beradab berlandaskan nilai Islam.'
  }
]

export const UnsurSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-unsur-item]')
      if (!items?.length) return

      gsap.from(items, {
        scale: 0.88,
        opacity: 0,
        stagger: 0.12,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='unsur'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='unsur-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          05
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Unsur Gerakan KAMMI
          </p>
          <h2
            id='unsur-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Empat Pilar Gerak
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {UNSUR_ITEMS.map((item) => (
            <div key={item.num} data-unsur-item className='flex flex-col'>
              <span
                className='font-heading text-primary/20 text-5xl font-bold lg:text-6xl'
                aria-hidden='true'
              >
                {item.num}
              </span>
              <h3 className='font-heading text-foreground mt-4 text-xl font-bold'>
                {item.title}
              </h3>
              <p className='text-muted-foreground mt-3 font-sans text-sm leading-relaxed'>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/unsur-section/index.ts`:

```ts
export * from './unsur-section'
```

```bash
git add src/app/(main)/tentang/_components/unsur-section/
git commit -m "feat(tentang): add Unsur Gerakan section"
```

---

## Task 11: Create PrinsipSection

**Files:**

- Create: `src/app/(main)/tentang/_components/prinsip-section/prinsip-section.tsx`
- Create: `src/app/(main)/tentang/_components/prinsip-section/index.ts`

Section 6. Deep slate background. 2×3 grid of 6 items, no icons, text-only. Items cascade up on scroll.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/prinsip-section/prinsip-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PRINSIP_ITEMS = [
  {
    num: '01',
    title: 'Rabbani',
    desc: 'Berorientasi kepada Allah dalam setiap gerak dan keputusan organisasi.'
  },
  {
    num: '02',
    title: 'Ikhlas',
    desc: 'Beramal semata mengharap ridha Allah, jauh dari pamrih duniawi.'
  },
  {
    num: '03',
    title: 'Dakwah',
    desc: 'Gerakan yang berlandaskan seruan kepada kebaikan universal.'
  },
  {
    num: '04',
    title: 'Taghyir',
    desc: 'Mendorong perubahan dari individu hingga tatanan sosial yang lebih adil.'
  },
  {
    num: '05',
    title: 'Ukhuwah',
    desc: 'Membangun persaudaraan yang kokoh di atas aqidah yang sama.'
  },
  {
    num: '06',
    title: 'Istiqamah',
    desc: 'Teguh dan konsisten dalam menjalankan amanah gerakan.'
  }
]

export const PrinsipSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll(
        '[data-prinsip-item]'
      )
      if (!items?.length) return

      gsap.from(items, {
        y: 30,
        opacity: 0,
        stagger: 0.09,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='prinsip'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.18_0.008_285)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='prinsip-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold text-white/[0.03] select-none'
          aria-hidden='true'
        >
          06
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Prinsip Gerakan KAMMI
          </p>
          <h2
            id='prinsip-heading'
            className='font-heading mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold text-white'
          >
            Enam Prinsip
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2 lg:grid-cols-3'>
          {PRINSIP_ITEMS.map((item) => (
            <div
              key={item.num}
              data-prinsip-item
              className='border-t border-white/10 py-8'
            >
              <span
                className='font-heading text-primary/40 text-3xl font-bold tabular-nums'
                aria-hidden='true'
              >
                {item.num}
              </span>
              <h3 className='font-heading mt-3 text-lg font-bold text-white'>
                {item.title}
              </h3>
              <p className='mt-2 font-sans text-sm leading-relaxed text-white/55'>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/prinsip-section/index.ts`:

```ts
export * from './prinsip-section'
```

```bash
git add src/app/(main)/tentang/_components/prinsip-section/
git commit -m "feat(tentang): add Prinsip Gerakan section"
```

---

## Task 12: Create ParadigmaSection

**Files:**

- Create: `src/app/(main)/tentang/_components/paradigma-section/paradigma-section.tsx`
- Create: `src/app/(main)/tentang/_components/paradigma-section/index.ts`

Section 7. White background with crimson accents. 4 items as horizontal rows, each with large numeral + heading + body. Items slide in from the right on scroll.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/paradigma-section/paradigma-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PARADIGMA_ITEMS = [
  {
    num: '01',
    title: 'Islam sebagai Sistem Hidup Komprehensif',
    body: 'Islam bukan agama ritual semata, ia adalah sistem kehidupan yang mengatur seluruh aspek dari individu hingga negara — panduan yang menyeluruh dan tidak terbagi.'
  },
  {
    num: '02',
    title: 'Perubahan Dimulai dari Individu',
    body: 'Transformasi sosial yang sejati hanya mungkin terjadi jika dimulai dari pembentukan karakter individu yang unggul, berintegritas, dan bertakwa.'
  },
  {
    num: '03',
    title: 'Mahasiswa sebagai Agen Perubahan',
    body: 'Mahasiswa memiliki posisi strategis dalam masyarakat sebagai kelompok terdidik yang bebas dari kepentingan sempit dan mampu melihat gambaran besar.'
  },
  {
    num: '04',
    title: 'Dakwah sebagai Metode Gerak',
    body: 'Dakwah adalah jalan yang dipilih KAMMI untuk mencapai perubahan: mengajak, bukan memaksa; meyakinkan, bukan melarang; membangun, bukan merobohkan.'
  }
]

export const ParadigmaSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll(
        '[data-paradigma-item]'
      )
      if (!items?.length) return

      gsap.from(items, {
        x: 50,
        opacity: 0,
        stagger: 0.14,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='paradigma'
      ref={containerRef}
      className='bg-background relative min-h-screen px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='paradigma-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          07
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Paradigma Gerakan KAMMI
          </p>
          <h2
            id='paradigma-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Empat Bingkai Pandang
          </h2>
        </div>

        <div className='divide-border divide-y'>
          {PARADIGMA_ITEMS.map((item) => (
            <div
              key={item.num}
              data-paradigma-item
              className='flex items-start gap-8 py-8'
            >
              <span
                className='font-heading text-primary/30 w-14 shrink-0 text-4xl font-bold tabular-nums'
                aria-hidden='true'
              >
                {item.num}
              </span>
              <div>
                <h3 className='font-heading text-foreground text-xl leading-snug font-bold lg:text-2xl'>
                  {item.title}
                </h3>
                <p className='text-muted-foreground mt-3 max-w-2xl font-sans text-base leading-relaxed'>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel + commit**

`src/app/(main)/tentang/_components/paradigma-section/index.ts`:

```ts
export * from './paradigma-section'
```

```bash
git add src/app/(main)/tentang/_components/paradigma-section/
git commit -m "feat(tentang): add Paradigma Gerakan section"
```

---

## Task 13: Create KredoSection

**Files:**

- Create: `src/app/(main)/tentang/_components/kredo-section/kredo-section.tsx`
- Create: `src/app/(main)/tentang/_components/kredo-section/index.ts`

Section 8. Near-black background. On desktop (≥768px): GSAP horizontal pin — 6 panels, scroll-mapped horizontal movement, each panel is one "constitutional amendment". On mobile: 6 sections stacked vertically. Uses `gsap.matchMedia()` for responsive behavior.

- [ ] **Step 1: Create component**

`src/app/(main)/tentang/_components/kredo-section/kredo-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KREDO_ITEMS = [
  {
    numeral: 'I',
    title: 'Kredo Ketuhanan',
    paragraphs: [
      'Kami percaya bahwa Allah adalah satu-satunya Tuhan yang berhak disembah, yang menciptakan alam semesta dan seluruh isinya dengan hikmah yang agung. Keyakinan ini bukan sekadar pernyataan verbal, melainkan fondasi yang menopang seluruh bangunan hidup kami.',
      'Dari keyakinan ini lahir tanggung jawab: bahwa setiap nikmat yang diterima adalah amanah, bahwa setiap kemampuan yang dimiliki adalah titipan, dan bahwa setiap keputusan yang diambil akan dimintai pertanggungjawaban di hadapan-Nya.',
      'Kami meyakini bahwa hanya dengan menempatkan Allah sebagai pusat orientasi hidup, seorang manusia dapat mencapai harkat tertingginya dan memberikan manfaat terbesar bagi sesama.'
    ]
  },
  {
    numeral: 'II',
    title: 'Kredo Kemanusiaan',
    paragraphs: [
      'Kami percaya bahwa setiap manusia adalah makhluk mulia yang ditiupkan ruh Ilahi ke dalam dirinya, terlepas dari ras, suku, bahasa, dan status sosialnya. Kemuliaan ini bukan sesuatu yang harus dibuktikan, melainkan sesuatu yang harus diakui dan dijaga.',
      'Dari keyakinan ini lahir komitmen: bahwa kami menolak segala bentuk penistaan terhadap martabat manusia, bahwa kami berpihak kepada mereka yang tertindas, dan bahwa kami berupaya menciptakan ruang di mana setiap orang dapat hidup dengan bermartabat.',
      'Kami meyakini bahwa cinta kepada sesama manusia adalah manifestasi nyata dari cinta kepada Allah yang menciptakan mereka semua.'
    ]
  },
  {
    numeral: 'III',
    title: 'Kredo Keislaman',
    paragraphs: [
      'Kami percaya bahwa Islam adalah agama yang sempurna, risalah terakhir yang Allah turunkan untuk menjadi rahmat bagi seluruh alam. Islam bukan warisan budaya yang kami terima secara pasif, melainkan komitmen hidup yang kami pilih secara sadar.',
      'Dari keyakinan ini lahir tanggung jawab: bahwa kami harus memahami Islam secara utuh dan mendalam, bahwa kami harus mempraktikkannya dalam seluruh dimensi kehidupan, dan bahwa kami harus mendakwahkannya dengan hikmah dan teladan yang baik.',
      'Kami meyakini bahwa seorang Muslim sejati adalah mereka yang keislamannya membawa kebaikan tidak hanya bagi dirinya, tetapi bagi seluruh makhluk di sekitarnya.'
    ]
  },
  {
    numeral: 'IV',
    title: 'Kredo Pergerakan',
    paragraphs: [
      'Kami percaya bahwa iman yang sejati selalu berbuah amal, bahwa keyakinan yang tulus selalu mendorong kepada pergerakan. Diam di hadapan ketidakadilan adalah pengkhianatan terhadap iman itu sendiri.',
      'Dari keyakinan ini lahir komitmen: bahwa kami tidak akan membatasi diri pada ranah privat saja, bahwa kami akan hadir di ruang-ruang publik dengan kontribusi nyata, dan bahwa kami akan terus bergerak selama masih ada kebaikan yang harus ditegakkan.',
      'Kami meyakini bahwa pergerakan yang benar adalah pergerakan yang berlandaskan ilmu, berorientasi pada perubahan yang membawa maslahat, dan senantiasa dalam bingkai ketaatan kepada Allah.'
    ]
  },
  {
    numeral: 'V',
    title: 'Kredo Kebangsaan',
    paragraphs: [
      'Kami percaya bahwa Indonesia adalah amanah Allah yang dipercayakan kepada kami. Tanah ini, dengan seluruh kekayaan dan keberagamannya, adalah ladang pengabdian yang harus kami rawat dan perjuangkan dengan sepenuh jiwa.',
      'Dari keyakinan ini lahir cinta: bahwa kami mencintai Indonesia bukan karena ia sempurna, melainkan karena ia adalah rumah bagi saudara-saudara kami yang perlu diperjuangkan masa depannya.',
      'Kami meyakini bahwa seorang Muslim yang baik akan menjadi warga negara yang baik, dan seorang warga negara yang baik akan memberikan kontribusi terbaik bagi terwujudnya Indonesia yang adil, makmur, dan bermartabat.'
    ]
  },
  {
    numeral: 'VI',
    title: 'Kredo Kemahasiswaan',
    paragraphs: [
      'Kami percaya bahwa masa muda adalah waktu terbaik untuk menanamkan nilai, membangun karakter, dan meletakkan fondasi bagi kehidupan yang bermakna. Kampus adalah laboratorium kehidupan, tempat ide-ide besar lahir dan diuji.',
      'Dari keyakinan ini lahir semangat: bahwa kami tidak akan menyia-nyiakan masa muda, bahwa kami akan menggunakan platform kemahasiswaan untuk membawa perubahan nyata, dan bahwa kami akan menjaga marwah intelektual sebagai modal terbesar kaum muda.',
      'Kami meyakini bahwa mahasiswa yang baik bukan hanya mereka yang unggul secara akademik, melainkan mereka yang mengintegrasikan kecerdasan intelektual dengan kecerdasan moral dan kepekaan sosial yang tinggi.'
    ]
  }
]

export const KredoSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current || !trackRef.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const totalScroll = trackRef.current!.scrollWidth - window.innerWidth

        const kredoTween = gsap.to(trackRef.current, {
          x: -totalScroll,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: `+=${totalScroll}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        })

        const panels = trackRef.current!.querySelectorAll('[data-kredo-panel]')
        panels.forEach((panel) => {
          const content = panel.querySelector('[data-kredo-content]')
          if (!content) return
          gsap.from(content, {
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: kredoTween,
              start: 'left 85%',
              toggleActions: 'play none none reverse'
            }
          })
        })
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='kredo'
      aria-labelledby='kredo-heading'
      className='bg-[oklch(0.12_0.005_285)]'
    >
      <div ref={containerRef} className='overflow-hidden'>
        <div
          ref={trackRef}
          className='flex flex-col md:flex-row'
          style={{ width: 'auto' }}
        >
          {KREDO_ITEMS.map((kredo, i) => (
            <div
              key={kredo.numeral}
              data-kredo-panel
              className='relative flex min-h-screen w-full shrink-0 flex-col justify-center px-8 py-20 md:w-screen md:px-16 lg:px-24'
              aria-label={`Kredo ${kredo.numeral}: ${kredo.title}`}
            >
              <span
                className='font-heading pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 text-[clamp(10rem,22vw,20rem)] leading-none font-bold text-white/[0.03] select-none'
                aria-hidden='true'
              >
                {kredo.numeral}
              </span>

              <div data-kredo-content className='relative max-w-2xl'>
                {i === 0 && (
                  <p
                    id='kredo-heading'
                    className='text-primary mb-8 font-sans text-xs font-semibold tracking-widest uppercase'
                  >
                    Kredo KAMMI
                  </p>
                )}

                <div className='mb-6 flex items-center gap-4'>
                  <span className='font-heading text-primary/60 text-5xl font-bold lg:text-6xl'>
                    {kredo.numeral}
                  </span>
                  <span className='font-sans text-xs text-white/25'>
                    {String(i + 1).padStart(2, '0')} /{' '}
                    {String(KREDO_ITEMS.length).padStart(2, '0')}
                  </span>
                </div>

                <h2 className='font-heading text-2xl leading-snug font-bold text-white lg:text-3xl'>
                  {kredo.title}
                </h2>

                <div
                  className='bg-primary/40 mt-5 h-px w-12'
                  aria-hidden='true'
                />

                <div className='mt-6 space-y-4'>
                  {kredo.paragraphs.map((para, j) => (
                    <p
                      key={j}
                      className='font-sans text-sm leading-relaxed text-white/55 lg:text-base'
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Barrel**

`src/app/(main)/tentang/_components/kredo-section/index.ts`:

```ts
export * from './kredo-section'
```

- [ ] **Step 3: Type-check**

```bash
bun run check:types
```

Expected: no errors. If `ScrollTrigger.getById` type error occurs, cast as `gsap.core.Tween`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/tentang/_components/kredo-section/
git commit -m "feat(tentang): add Kredo section with GSAP horizontal pin"
```

---

## Task 14: Compose page.tsx

**Files:**

- Modify: `src/app/(main)/tentang/page.tsx`

Wire all sections together. `SectionNav` renders outside `<main>` flow (fixed position handles itself). `page.tsx` stays as RSC — all client work is inside the leaf components.

- [ ] **Step 1: Rewrite page.tsx**

`src/app/(main)/tentang/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { TentangHero } from './_components/tentang-hero'
import { SejarahSection } from './_components/sejarah-section'
import { VisiSection } from './_components/visi-section'
import { MisiSection } from './_components/misi-section'
import { KarakteristikSection } from './_components/karakteristik-section'
import { UnsurSection } from './_components/unsur-section'
import { PrinsipSection } from './_components/prinsip-section'
import { ParadigmaSection } from './_components/paradigma-section'
import { KredoSection } from './_components/kredo-section'
import { SectionNav } from './_components/section-nav'

export const metadata: Metadata = {
  title: 'Tentang KAMMI',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
}

const TentangPage = () => {
  return (
    <>
      <SectionNav />
      <TentangHero />
      <SejarahSection />
      <VisiSection />
      <MisiSection />
      <KarakteristikSection />
      <UnsurSection />
      <PrinsipSection />
      <ParadigmaSection />
      <KredoSection />
    </>
  )
}

export default TentangPage
```

- [ ] **Step 2: Type-check and build**

```bash
bun run check:types && bun run build
```

Expected: build completes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/tentang/page.tsx
git commit -m "feat(tentang): compose /tentang page — 8 sections + hero + nav"
```

---

## Task 15: Browser Verification Pass

**No files created** — this is a quality inspection task.

- [ ] **Step 1: Start dev server**

```bash
bun run dev
```

Navigate to `http://localhost:3000/tentang`.

- [ ] **Step 2: Desktop viewport (1440px) — check**

Verify:

- Hero: heading renders at `clamp(4rem,10vw,9rem)`, entrance animation fires once
- Scroll cue arrow bounces, disappears when scrolling
- SectionNav appears once Hero leaves viewport
- Each section transitions visually between its own background tone
- Misi items stagger in correctly
- Visi section: full crimson background, single centered statement
- Kredo: horizontal pin engages, 6 panels scroll left as user scrolls down
- SectionNav dot activates for each section as it enters viewport

- [ ] **Step 3: Mobile viewport (390px) — check**

Verify:

- Kredo renders as vertical stack (no horizontal scroll)
- Each section is readable, no overflow
- SectionNav is visible on right edge without overlapping content
- Typography scales correctly via `clamp()`
- Misi, Unsur, and Prinsip grids collapse to single column

- [ ] **Step 4: Reduced motion — check**

In browser DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`.

Verify:

- Page is fully readable with no animation
- No content is hidden or invisible at rest
- Kredo section still renders (content visible, no horizontal pin)

- [ ] **Step 5: Fix any defects found**

Common issues to watch for:

- Kredo `totalScroll` calculated before fonts load (causes wrong pin length) — fix with `ScrollTrigger.refresh()` after a short delay or use `invalidateOnRefresh: true` in the scrollTrigger config
- SectionNav missing Kredo as active (pinned section stays visible for long) — IntersectionObserver with `threshold: 0.1` instead of `0.4` for `#kredo`
- Type error on `ScrollTrigger.getById` return — cast as `gsap.core.Tween | null` and add null guard

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "fix(tentang): browser verification fixes"
```
