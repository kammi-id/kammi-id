# /tentang Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all P0/P1/P3 findings from the impeccable critique+audit of the `/tentang` scroll-pinned page.

**Architecture:** All fixes are isolated to 4 files: `tentang-scene.tsx` (animation + layout), `visi-section.tsx` (semantic HTML), `tentang-hero.tsx` (hero copy + UX), `section-nav.tsx` (phase counter). No new files needed.

**Tech Stack:** Next.js 15, GSAP ScrollTrigger, Tailwind CSS, nanostores

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/(main)/tentang/_components/tentang-scene/tentang-scene.tsx` | Reduced-motion fallback, data-id attrs, lazy-load images, yPercent fix, double-rAF, paradigma mobile grid |
| `src/app/(main)/tentang/_components/visi-section/visi-section.tsx` | `<p>` → `<h2>` for visi heading |
| `src/app/(main)/tentang/_components/tentang-hero/tentang-hero.tsx` | Narrative subheading, scroll cue visibility + safe area |
| `src/app/(main)/tentang/_components/section-nav/section-nav.tsx` | Phase counter above dots |

---

## Task 1 (P0): Reduced-motion fallback + Visi semantic HTML

**Files:**
- Modify: `visi-section.tsx`
- Modify: `tentang-scene.tsx` lines 143–150 (reduced-motion block) + add `data-id` to 3 containers

- [ ] **Step 1: Fix visi-section.tsx — `<p>` → `<h2>`**

Change `useRef<HTMLParagraphElement>` to `useRef<HTMLHeadingElement>` and element from `<p>` to `<h2>`:

```tsx
const textRef = useRef<HTMLHeadingElement>(null)
// ...
<h2
  ref={textRef}
  id='visi-heading'
  className='visi-text font-heading text-primary-foreground mt-6 text-[clamp(1.75rem,4vw,3.25rem)] leading-snug font-bold opacity-0'
>
  Wadah perjuangan permanen...
</h2>
```

- [ ] **Step 2: Add `data-id` attributes to 3 inner containers in tentang-scene.tsx**

```tsx
// Prinsip stack (currently line ~603):
<div data-id='prinsip-stack' className='relative h-[52vh] w-full max-w-5xl'>

// Paradigma stack (currently line ~635):
<div data-id='paradigma-stack' className='relative h-[64vh] w-full max-w-6xl'>

// Kredo mask (currently line ~694):
<div
  data-id='kredo-mask'
  className='absolute inset-0 overflow-hidden'
  style={{ maskImage: '...', WebkitMaskImage: '...' }}
>
```

- [ ] **Step 3: Replace the reduced-motion block in tentang-scene.tsx**

Replace lines 143–150 with:

```tsx
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Convert from scroll-pinned experience to linear flow so sighted
  // users who disable motion can still read all content sections.
  gsap.set(sceneRef.current, { height: 'auto', overflow: 'visible' })

  ;[heroRef, visiRef, misiRef, prinsipRef, paradigmaRef, kredoRef].forEach(
    (ref) => {
      if (!ref.current) return
      gsap.set(ref.current, {
        position: 'relative',
        inset: 'unset',
        width: '100%',
        height: 'auto',
        minHeight: '100svh',
        opacity: 1,
        pointerEvents: 'auto',
        zIndex: 'auto'
      })
    }
  )

  gsap.set(visiRef.current, { backgroundColor: MAROON })
  gsap.set(prinsipRef.current, { backgroundColor: WHITE })
  gsap.set(paradigmaRef.current, { backgroundColor: DARK })
  gsap.set(kredoRef.current, { backgroundColor: PARCHMENT })

  // Visi
  gsap.set(['.visi-title', '.visi-text'], { opacity: 1 })

  // Misi — all cards visible (stacked by z-index; top card is readable)
  gsap.set('.misi-scene-label', { opacity: 1 })
  gsap.set('.misi-scene-card', { opacity: 1, x: 0 })

  // Prinsip — convert stacked absolute items to flow
  gsap.set('.prinsip-eyebrow', { opacity: 1 })
  const prinsipStack = sceneRef.current?.querySelector('[data-id="prinsip-stack"]') as HTMLElement | null
  if (prinsipStack) gsap.set(prinsipStack, { height: 'auto' })
  PRINSIP_ITEMS.forEach((_, i) => {
    gsap.set(`.prinsip-point-${i}`, {
      position: 'relative',
      inset: 'unset',
      opacity: 1,
      y: 0,
      paddingTop: '3rem',
      paddingBottom: '3rem'
    })
  })

  // Paradigma — convert stacked items to flow, inject photos
  gsap.set('.paradigma-eyebrow', { opacity: 1 })
  const paradigmaStack = sceneRef.current?.querySelector('[data-id="paradigma-stack"]') as HTMLElement | null
  if (paradigmaStack) gsap.set(paradigmaStack, { height: 'auto' })
  PARADIGMA_ITEMS.forEach((_, i) => {
    gsap.set(`.paradigma-text-${i}`, {
      position: 'relative',
      inset: 'unset',
      opacity: 1,
      y: 0,
      paddingTop: i === 0 ? '3rem' : '1.5rem',
      paddingBottom: '1.5rem'
    })
    gsap.set(`.paradigma-photo-${i}`, {
      position: 'relative',
      inset: 'unset',
      opacity: 1,
      y: 0
    })
    // Inject image (deferred for normal path; must be explicit here)
    const photoInner = sceneRef.current?.querySelector(
      `[data-photo="paradigma-${i}"]`
    ) as HTMLElement | null
    if (photoInner) {
      photoInner.style.backgroundImage = settings.paradigmaImages[i]
        ? `url(${settings.paradigmaImages[i]})`
        : `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
    }
  })

  // Kredo — remove scroll mask, show full text
  gsap.set('.kredo-eyebrow', { opacity: 1 })
  const kredoMask = sceneRef.current?.querySelector('[data-id="kredo-mask"]') as HTMLElement | null
  if (kredoMask) {
    gsap.set(kredoMask, {
      maskImage: 'none',
      WebkitMaskImage: 'none',
      overflow: 'visible',
      height: 'auto',
      position: 'relative'
    })
  }
  gsap.set(kredoDocRef.current, {
    opacity: 1,
    y: 0,
    paddingTop: '3rem',
    paddingBottom: '4rem',
    position: 'relative'
  })

  return
}
```

---

## Task 2 (P1): Lazy-load prinsip + paradigma images

**Files:**
- Modify: `tentang-scene.tsx`

- [ ] **Step 1: Add `data-photo` attr + remove backgroundImage from paradigma photo inner div**

In the paradigma photo figure, change the inner `<div>` from:
```tsx
<div
  className='aspect-video w-full'
  style={{
    backgroundImage: settings.paradigmaImages[i] ? `url(...)` : `linear-gradient(...)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
  aria-hidden='true'
/>
```
To:
```tsx
<div
  data-photo={`paradigma-${i}`}
  className='aspect-video w-full'
  style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
  aria-hidden='true'
/>
```

- [ ] **Step 2: Remove backgroundImage from prinsip photo divs**

In prinsip photo divs, change:
```tsx
style={{
  backgroundImage: settings.prinsipImages[i] ? `url(...)` : `linear-gradient(...)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  maskImage: '...',
  WebkitMaskImage: '...'
}}
```
To:
```tsx
style={{
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  maskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.25) 100%)',
  WebkitMaskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.25) 100%)'
}}
```

- [ ] **Step 3: Add GSAP `call()` lazy-injection at phase labels**

After the `prinsipIn` label setup in the timeline, add:
```tsx
mainTl.call(
  () => {
    PRINSIP_ITEMS.forEach((_, i) => {
      const el = sceneRef.current?.querySelector(`.prinsip-photo-${i}`) as HTMLElement | null
      if (!el) return
      el.style.backgroundImage = settings.prinsipImages[i]
        ? `url(${settings.prinsipImages[i]})`
        : `linear-gradient(155deg, oklch(0.45 0.06 ${17 + i * 28}), oklch(0.2 0.03 ${17 + i * 28}))`
    })
  },
  undefined,
  'prinsipIn'
)
```

After the `paradigmaIn` label setup, add:
```tsx
mainTl.call(
  () => {
    PARADIGMA_ITEMS.forEach((_, i) => {
      const el = sceneRef.current?.querySelector(`[data-photo="paradigma-${i}"]`) as HTMLElement | null
      if (!el) return
      el.style.backgroundImage = settings.paradigmaImages[i]
        ? `url(${settings.paradigmaImages[i]})`
        : `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
    })
  },
  undefined,
  'paradigmaIn'
)
```

---

## Task 3 (P1): Paradigma mobile grid + misc polish fixes

**Files:**
- Modify: `tentang-scene.tsx`

- [ ] **Step 1: Fix Paradigma grid for landscape mobile**

Change the paradigma grid div from:
```tsx
className='absolute inset-0 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'
```
To:
```tsx
className='absolute inset-0 grid grid-cols-1 items-center gap-6 [@media(max-height:600px)]:grid-cols-[1.1fr_0.9fr] [@media(max-height:600px)]:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'
```

This makes the layout two-column on short viewports (landscape phones) without needing the `lg:` breakpoint.

- [ ] **Step 2: Fix yPercent → y on last prinsip photo exit**

Find the `.prinsip-photo-${lastPrinsip}` exit tween (Phase 5 transition) and change:
```tsx
{ yPercent: -60, opacity: 0, duration: 0.5, ease: 'power2.in' }
```
To:
```tsx
{ y: -60, opacity: 0, duration: 0.5, ease: 'power2.in' }
```

- [ ] **Step 3: Improve rAF reliability (double-frame)**

Change single `requestAnimationFrame` to double:
```tsx
// Before:
requestAnimationFrame(() => {
  const st = ScrollTrigger.getById('tentang-main')
  ...
})

// After:
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const st = ScrollTrigger.getById('tentang-main')
    ...
  })
)
```

---

## Task 4 (P1): Hero — narrative hook + scroll cue

**Files:**
- Modify: `tentang-hero.tsx`

- [ ] **Step 1: Add subheading ref and improve scroll cue**

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

      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from(headingRef.current, { y: 60, opacity: 0, duration: 1.2 })
        .from(subRef.current, { y: 12, opacity: 0, duration: 0.7 }, '-=0.5')
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
      className='relative flex h-full flex-col justify-center overflow-hidden bg-transparent px-6 lg:px-8'
      aria-labelledby='tentang-heading'
    >
      <div className='mx-auto w-full max-w-7xl'>
        <h1
          ref={headingRef}
          id='tentang-heading'
          className='font-heading text-white'
        >
          <span className='mb-5 block font-sans text-xs font-semibold tracking-[0.35em] text-white/50 uppercase'>
            Tentang
          </span>
          <span className='block text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92] font-bold tracking-tight'>
            Kesatuan Aksi
            <br />
            <span className='text-primary'>Mahasiswa Muslim</span>
            <br />
            Indonesia
          </span>
        </h1>
        <p
          ref={subRef}
          className='mt-8 font-sans text-sm tracking-[0.2em] text-white/45 uppercase'
        >
          Visi&ensp;·&ensp;Misi&ensp;·&ensp;Prinsip&ensp;·&ensp;Paradigma&ensp;·&ensp;Kredo
        </p>
      </div>

      <div
        ref={scrollCueRef}
        className='absolute bottom-[max(2.5rem,calc(env(safe-area-inset-bottom)+1rem))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5'
        aria-hidden='true'
      >
        <span className='font-sans text-[0.6rem] tracking-[0.25em] text-white/55 uppercase'>
          Gulir
        </span>
        <svg className='size-5 text-white/65' viewBox='0 0 24 24' fill='none'>
          <path
            d='M12 5v14M5 12l7 7 7-7'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
    </section>
  )
}
```

---

## Task 5 (P3): SectionNav phase counter

**Files:**
- Modify: `section-nav.tsx`

- [ ] **Step 1: Add phase counter above the dots**

Inside the `<nav>`, before the `<ol>`, add:
```tsx
{/* Phase counter — shows current position in the journey */}
<div className='mb-2 flex justify-center'>
  <span className='font-mono text-[0.6rem] tabular-nums text-foreground/35'>
    {activePhase + 1}
    <span className='text-foreground/20'>/5</span>
  </span>
</div>
```

---

## Verification

- [ ] Run `bun tsc --noEmit` — no TypeScript errors
- [ ] Reload `/tentang` in browser — check all 5 phases animate correctly
- [ ] Toggle `prefers-reduced-motion: reduce` in DevTools — verify all sections visible and stacked vertically
- [ ] Check mobile viewport (375px) — paradigma two-column on landscape, hero scroll cue visible
