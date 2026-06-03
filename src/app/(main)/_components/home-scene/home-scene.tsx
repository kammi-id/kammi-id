'use client'

/**
 * HomeScene — a single pinned container that drives all homepage section
 * transitions through one GSAP master timeline, eliminating the "scrolling
 * down" feel produced by chaining separate ScrollTrigger pins.
 *
 * Architecture mirrors /tentang's TentangScene:
 *   - One `h-svh overflow-hidden` wrapper that is pinned for the entire
 *     homepage animation sequence.
 *   - Four section layers as `absolute inset-0` children, stacked via z-index.
 *   - One master GSAP timeline scrubbed over the pin window.
 *
 * Scroll budget (end: '+=800%'):
 *   Phase 1 — Hero exits                   ~1.3 units  (~130vh)
 *   Phase 2 — About enters + holds + exits ~2.0 units  (~200vh)
 *   Phase 3 — Leadership enters/holds/exits~2.5 units  (~250vh)
 *   Phase 4 — Network enters + holds       ~2.2 units  (~220vh)
 *   Total                                  ~8.0 units  (800%)
 */

import { useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { cn } from '~/lib/shadcn/utils'
import {
  matchSlugsForPW,
  type ProvinceTooltip
} from '../network-section/leaflet-map-utils'
import type { AboutSettings } from '~/db/query/site-settings'
import type { NetworkStats, PWOrg } from '~/app/(main)/_data/network'

// ── Leaflet — client-only, no SSR ─────────────────────────────────────────────
const LeafletMap = dynamic(() => import('../network-section/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div
      className='h-full w-full animate-pulse'
      style={{ background: 'oklch(0.94 0.018 240)' }}
    />
  )
})

// ── Types ──────────────────────────────────────────────────────────────────────
interface HeroItem {
  id: string
  title: string
  description: string
  badgeText: string
  resolvedImageUrl: string
}

interface ResolvedLeadership {
  periodLabel: string
  heading: string
  triumvirate: {
    ketua: { name: string; photoSrc: string | null }
    sekretaris: { name: string; photoSrc: string | null }
    bendahara: { name: string; photoSrc: string | null }
  }
}

interface HomeSceneProps {
  heroItems: HeroItem[]
  about: AboutSettings
  leadership: ResolvedLeadership
  networkStats: NetworkStats
  pwOrgs: PWOrg[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const buildPWLookup = (pwOrgs: PWOrg[]): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const pw of pwOrgs) {
    for (const slug of matchSlugsForPW(pw.name)) {
      if (!map[slug]) map[slug] = pw.name
    }
  }
  return map
}

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({
  value,
  label,
  dataAttr
}: {
  value: number
  label: string
  dataAttr: string
}) => (
  <div
    data-stat={dataAttr}
    className='border-border/50 bg-background/90 flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center shadow-sm backdrop-blur-sm lg:p-5'
  >
    <p className='font-heading text-foreground text-[clamp(2rem,4vw,3.25rem)] leading-none font-bold tabular-nums'>
      <span data-target={value}>0</span>
    </p>
    <p className='text-muted-foreground font-sans text-[10px] font-semibold tracking-widest uppercase'>
      {label}
    </p>
  </div>
)

// ── Main component ─────────────────────────────────────────────────────────────
export const HomeScene = ({
  heroItems,
  about,
  leadership,
  networkStats,
  pwOrgs
}: HomeSceneProps) => {
  // Scene root — pinned by ScrollTrigger
  const sceneRef = useRef<HTMLDivElement>(null)

  // Layer refs (z-stacked: hero < about < leadership < network)
  const heroLayerRef = useRef<HTMLDivElement>(null)
  const aboutLayerRef = useRef<HTMLDivElement>(null)
  const leadershipLayerRef = useRef<HTMLDivElement>(null)
  const networkLayerRef = useRef<HTMLDivElement>(null)

  // Hero element refs
  const heroImgRef = useRef<HTMLDivElement>(null)
  const heroBadgeRef = useRef<HTMLDivElement>(null)
  const heroH1Ref = useRef<HTMLHeadingElement>(null)
  const heroDescRef = useRef<HTMLParagraphElement>(null)

  // About element refs
  const aboutLeftRef = useRef<HTMLDivElement>(null)
  const aboutRightRef = useRef<HTMLDivElement>(null)

  // Leadership element refs
  const lsTextRef = useRef<HTMLDivElement>(null)
  const lsKetuaRef = useRef<HTMLDivElement>(null)
  const lsSekjRef = useRef<HTMLDivElement>(null)
  const lsBendRef = useRef<HTMLDivElement>(null)

  // Network element refs
  const netMapRef = useRef<HTMLDivElement>(null)
  const netHeaderRef = useRef<HTMLDivElement>(null)
  const netCtaRef = useRef<HTMLDivElement>(null)
  const netCardsRef = useRef<HTMLDivElement>(null)

  // Map interaction refs
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const mapHoveredRef = useRef(false)
  const pwLookup = useRef(buildPWLookup(pwOrgs))

  // ── Tooltip: imperative DOM, lives in document.body ─────────────────────────
  useEffect(() => {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '9999',
      pointerEvents: 'none',
      visibility: 'hidden',
      minWidth: '160px',
      maxWidth: '240px',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
      background: 'oklch(0.141 0.005 285.823)',
      color: 'white',
      transform: 'translateY(-100%)',
      fontFamily: 'var(--font-sans, sans-serif)'
    })
    el.setAttribute('aria-hidden', 'true')
    el.innerHTML = `
      <p style="font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;opacity:0.5;margin:0 0 4px">Pengurus Wilayah</p>
      <p data-tip-pw style="font-family:var(--font-heading,serif);font-size:14px;font-weight:700;line-height:1.25;margin:0"></p>
    `
    document.body.appendChild(el)
    tooltipRef.current = el

    const onScroll = () => {
      el.style.visibility = 'hidden'
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.body.removeChild(el)
      tooltipRef.current = null
    }
  }, [])

  // ── Tooltip updater ─────────────────────────────────────────────────────────
  const handleTooltip = useCallback((t: ProvinceTooltip) => {
    const el = tooltipRef.current
    if (!el) return

    // Only show tooltip when network layer is the active section
    const networkOpacity = parseFloat(
      networkLayerRef.current?.style.opacity ?? '0'
    )
    if (networkOpacity < 0.5 || !t.visible) {
      el.style.visibility = 'hidden'
      return
    }

    if (!t.pwName) {
      el.style.visibility = 'hidden'
      return
    }
    el.style.visibility = 'visible'
    el.style.left = `${t.clientX + 16}px`
    el.style.top = `${t.clientY - 12}px`
    const pwEl = el.querySelector<HTMLElement>('[data-tip-pw]')
    if (pwEl) pwEl.textContent = t.pwName
  }, [])

  // ── Map hover: cards slide down, map breathes ───────────────────────────────
  const handleMapHover = useCallback((hovering: boolean) => {
    if (hovering === mapHoveredRef.current) return
    mapHoveredRef.current = hovering
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.to(netCardsRef.current, {
      y: hovering ? 72 : 0,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto'
    })
    gsap.to(netMapRef.current, {
      scale: hovering ? 1.03 : 1,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto'
    })
    if (!hovering && tooltipRef.current) {
      tooltipRef.current.style.visibility = 'hidden'
    }
  }, [])

  // ── Master GSAP animation ────────────────────────────────────────────────────
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger)

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const isDesktop = window.innerWidth >= 768

      // ── Initial layer states (all invisible except hero) ───────────────────
      gsap.set(aboutLayerRef.current, { opacity: 0, pointerEvents: 'none' })
      gsap.set(aboutLeftRef.current, { opacity: 0, x: -60 })
      gsap.set(aboutRightRef.current, { opacity: 0, x: 60 })

      gsap.set(leadershipLayerRef.current, { opacity: 0, pointerEvents: 'none' })

      gsap.set(networkLayerRef.current, { opacity: 0, pointerEvents: 'none' })
      gsap.set(netMapRef.current, { scale: 1.5, opacity: 0 })
      gsap.set(netHeaderRef.current, { opacity: 0, y: -24 })
      gsap.set(netCtaRef.current, { opacity: 0, y: -12 })

      // Network stat cards initial state
      if (netCardsRef.current) {
        const cards = Array.from(
          netCardsRef.current.querySelectorAll<HTMLElement>('[data-stat]')
        )
        gsap.set(cards, { opacity: 0, y: 56 })
      }

      // ── Leadership initial state (desktop: photos off-screen, text huge) ───
      if (isDesktop && lsTextRef.current) {
        const textRect = lsTextRef.current.getBoundingClientRect()
        const deltaY =
          window.innerHeight / 2 - (textRect.top + textRect.height / 2)
        gsap.set(lsTextRef.current, {
          scale: 3.5,
          y: deltaY,
          transformOrigin: 'center center'
        })
        gsap.set(lsKetuaRef.current, { y: '85vh', scale: 1.15 })
        gsap.set(lsSekjRef.current, { x: '-55vw' })
        gsap.set(lsBendRef.current, { x: '55vw' })
      } else {
        gsap.set(lsTextRef.current, { opacity: 0, scale: 1.5, y: '10vh' })
        gsap.set(
          [lsKetuaRef.current, lsSekjRef.current, lsBendRef.current],
          { opacity: 0, y: 65 }
        )
      }

      // ── Counter objects for network stats ──────────────────────────────────
      const statValues = [
        networkStats.wilayah,
        networkStats.daerah,
        networkStats.komisariat
      ]
      const counterObjs = statValues.map((v) => ({ val: 0, target: v }))

      // ── Master timeline — one pin, one scrub ───────────────────────────────
      const mainTl = gsap.timeline({
        scrollTrigger: {
          id: 'home-main',
          trigger: sceneRef.current,
          start: 'top top',
          end: '+=800%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      })

      // ════════════════════════════════════════════════════════════════════════
      // PHASE 1 — Hero exits  (t: 0 → 1.3)
      // ════════════════════════════════════════════════════════════════════════
      mainTl
        // Stagger: badge first → h1 → description → image zooms + fades last
        .to(
          heroBadgeRef.current,
          { opacity: 0, y: -28, ease: 'power2.in', duration: 0.18 },
          0
        )
        .to(
          heroH1Ref.current,
          { opacity: 0, y: -52, ease: 'power2.in', duration: 0.26 },
          0.12
        )
        .to(
          heroDescRef.current,
          { opacity: 0, y: -36, ease: 'power2.in', duration: 0.22 },
          0.22
        )
        .to(
          heroImgRef.current,
          { scale: 1.1, opacity: 0, ease: 'none', duration: 0.52 },
          0.28
        )

      // ════════════════════════════════════════════════════════════════════════
      // PHASE 2 — About enters (t: 1.1 → 1.6), holds, exits (t: 2.7 → 3.4)
      // ════════════════════════════════════════════════════════════════════════
      mainTl
        // Enter: about layer fades in while hero is finishing
        .to(
          aboutLayerRef.current,
          { opacity: 1, ease: 'none', duration: 0.08 },
          1.1
        )
        .set(aboutLayerRef.current, { pointerEvents: 'auto' }, 1.1)
        // Left col ("Tentang KAMMI") slides from left
        .to(
          aboutLeftRef.current,
          { opacity: 1, x: 0, ease: 'power3.out', duration: 0.25 },
          1.18
        )
        // Right card ("Lahir dari Rahim Reformasi") slides from right — stagger
        .to(
          aboutRightRef.current,
          { opacity: 1, x: 0, ease: 'power3.out', duration: 0.25 },
          1.28
        )

        // ── Hold: implicit gap (t: 1.53 → 2.7) ───────────────────────────────

        // Exit: left exits to the left, right exits to the right
        .to(
          aboutLeftRef.current,
          { opacity: 0, x: '-68vw', ease: 'power2.in', duration: 0.32 },
          2.7
        )
        .to(
          aboutRightRef.current,
          { opacity: 0, x: '68vw', ease: 'power2.in', duration: 0.32 },
          2.76
        )
        .to(
          aboutLayerRef.current,
          { opacity: 0, ease: 'none', duration: 0.1 },
          3.02
        )
        .set(aboutLayerRef.current, { pointerEvents: 'none' }, 3.12)

      // ════════════════════════════════════════════════════════════════════════
      // PHASE 3 — Leadership enters (t: 2.9 → 4.5), holds, exits (t: 4.6 → 5.3)
      // ════════════════════════════════════════════════════════════════════════
      mainTl
        .to(
          leadershipLayerRef.current,
          { opacity: 1, ease: 'none', duration: 0.08 },
          2.9
        )
        .set(leadershipLayerRef.current, { pointerEvents: 'auto' }, 2.9)

      if (isDesktop) {
        mainTl
          // Text zooms from huge at center to normal top position
          .to(
            lsTextRef.current,
            { scale: 1, y: 0, ease: 'none', duration: 0.38 },
            2.9
          )
          // Photos converge from edges
          .fromTo(
            lsKetuaRef.current,
            { y: '85vh', scale: 1.15 },
            { y: 0, scale: 1, ease: 'none', duration: 0.42 },
            3.08
          )
          .fromTo(
            lsSekjRef.current,
            { x: '-55vw' },
            { x: 0, ease: 'none', duration: 0.45 },
            3.17
          )
          .fromTo(
            lsBendRef.current,
            { x: '55vw' },
            { x: 0, ease: 'none', duration: 0.45 },
            3.22
          )
      } else {
        // Mobile: simple fade-in
        mainTl
          .to(
            lsTextRef.current,
            { opacity: 1, scale: 1, y: 0, ease: 'power3.out', duration: 0.5 },
            2.9
          )
          .to(
            [lsKetuaRef.current, lsSekjRef.current, lsBendRef.current],
            { opacity: 1, y: 0, ease: 'power3.out', duration: 0.45, stagger: 0.12 },
            3.1
          )
      }

      // ── Leadership exits: heading fades up, all photos fall down ──────────
      mainTl
        .to(
          lsTextRef.current,
          { opacity: 0, y: -80, ease: 'power2.in', duration: 0.22 },
          4.6
        )
        .to(
          [lsKetuaRef.current, lsSekjRef.current, lsBendRef.current],
          { y: '110vh', opacity: 0, ease: 'power2.in', duration: 0.32 },
          4.7
        )
        .to(
          leadershipLayerRef.current,
          { opacity: 0, ease: 'none', duration: 0.1 },
          5.02
        )
        .set(leadershipLayerRef.current, { pointerEvents: 'none' }, 5.12)

      // ════════════════════════════════════════════════════════════════════════
      // PHASE 4 — Network enters (t: 4.9 → 6.2), holds (t: 6.2 → 8.0)
      // ════════════════════════════════════════════════════════════════════════
      mainTl
        .to(
          networkLayerRef.current,
          { opacity: 1, ease: 'none', duration: 0.1 },
          4.9
        )
        .set(networkLayerRef.current, { pointerEvents: 'auto' }, 4.9)
        // Map dramatically zooms in from scale(1.5)
        .to(
          netMapRef.current,
          { opacity: 1, scale: 1, ease: 'none', duration: 0.32 },
          4.9
        )
        // Header slides down + fades in
        .to(
          netHeaderRef.current,
          { opacity: 1, y: 0, ease: 'power3.out', duration: 0.2 },
          5.0
        )
        // CTA fades in
        .to(
          netCtaRef.current,
          { opacity: 1, y: 0, ease: 'power3.out', duration: 0.14 },
          5.14
        )

      // Stat cards stagger up from below with live counters
      if (netCardsRef.current) {
        const cards = Array.from(
          netCardsRef.current.querySelectorAll<HTMLElement>('[data-stat]')
        )
        const numEls = Array.from(
          netCardsRef.current.querySelectorAll<HTMLElement>('[data-target]')
        )

        cards.forEach((card, i) => {
          const s = 5.22 + i * 0.14
          mainTl.to(card, { opacity: 1, y: 0, ease: 'power3.out', duration: 0.18 }, s)
          mainTl.to(
            counterObjs[i],
            {
              val: counterObjs[i].target,
              ease: 'none',
              duration: 0.18,
              onUpdate() {
                const el = numEls[i]
                if (el)
                  el.textContent = String(Math.round(counterObjs[i].val))
              }
            },
            s
          )
        })
      }

      // Network holds until t=8.0 (implicit — last animation ends at ~5.64)
    },
    { scope: sceneRef }
  )

  // ── Derived data ─────────────────────────────────────────────────────────────
  const hero = heroItems[0] ?? null

  const trio = [
    {
      key: 'sekj' as const,
      label: 'Sekretaris Jenderal',
      name: leadership.triumvirate.sekretaris.name,
      photoSrc: leadership.triumvirate.sekretaris.photoSrc,
      position: 'left' as const,
      ref: lsSekjRef
    },
    {
      key: 'ketua' as const,
      label: 'Ketua Umum',
      name: leadership.triumvirate.ketua.name,
      photoSrc: leadership.triumvirate.ketua.photoSrc,
      position: 'center' as const,
      ref: lsKetuaRef
    },
    {
      key: 'bend' as const,
      label: 'Bendahara Umum',
      name: leadership.triumvirate.bendahara.name,
      photoSrc: leadership.triumvirate.bendahara.photoSrc,
      position: 'right' as const,
      ref: lsBendRef
    }
  ]

  const statCards = [
    { value: networkStats.wilayah, label: 'Pengurus Wilayah', dataAttr: 'wilayah' },
    { value: networkStats.daerah, label: 'Pengurus Daerah', dataAttr: 'daerah' },
    { value: networkStats.komisariat, label: 'Komisariat', dataAttr: 'komisariat' }
  ]

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={sceneRef}
      className='relative h-svh w-full overflow-hidden -mt-20'
      aria-label='Beranda KAMMI'
    >
      {/*
       * ══════════════════════════════════════════════════════════════════════
       * LAYER 1 — Hero  (z-index: 10)
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={heroLayerRef}
        className='absolute inset-0 z-10'
        aria-labelledby='hero-heading'
      >
        {hero && (
          <>
            {/* Background image — GSAP zooms + fades this out */}
            <div ref={heroImgRef} className='absolute inset-0'>
              {hero.resolvedImageUrl ? (
                <Image
                  src={hero.resolvedImageUrl}
                  alt={hero.title}
                  fill
                  className='object-cover'
                  priority
                  unoptimized={hero.resolvedImageUrl.includes('?')}
                />
              ) : (
                <div className='absolute inset-0 bg-foreground/10' />
              )}
            </div>

            {/* Gradient overlay */}
            <div
              className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent'
              aria-hidden='true'
            />

            {/* Text content */}
            <div className='absolute inset-0 flex items-center'>
              <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
                {hero.badgeText && (
                  <div
                    ref={heroBadgeRef}
                    className='mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm'
                  >
                    <span className='font-sans text-xs font-semibold tracking-widest text-white uppercase'>
                      {hero.badgeText}
                    </span>
                  </div>
                )}

                <h1
                  ref={heroH1Ref}
                  id='hero-heading'
                  className='font-heading text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white'
                >
                  {hero.title}
                </h1>

                {hero.description && (
                  <p
                    ref={heroDescRef}
                    className='mt-5 max-w-xl font-sans text-base leading-relaxed text-white/80 md:text-lg'
                  >
                    {hero.description}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/*
       * ══════════════════════════════════════════════════════════════════════
       * LAYER 2 — About  (z-index: 20)
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={aboutLayerRef}
        className='bg-background absolute inset-0 z-20 flex items-center overflow-hidden'
        style={{ pointerEvents: 'none' }}
        id='tentang'
        aria-labelledby='about-heading'
      >
        <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
          <div className='grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px] xl:gap-20'>
            {/* Left: "Tentang KAMMI" — exits to the LEFT */}
            <div ref={aboutLeftRef}>
              <h2
                id='about-heading'
                className='font-heading text-foreground text-[clamp(1.5rem,3vw,2rem)] font-bold'
              >
                Tentang KAMMI
              </h2>
              <div
                className='bg-primary mt-1 h-1 w-12 rounded-full'
                aria-hidden='true'
              />
              <p className='text-muted-foreground mt-6 max-w-2xl font-sans text-base leading-relaxed'>
                {about.paragraph1}
              </p>
              <p className='text-muted-foreground mt-4 max-w-2xl font-sans text-base leading-relaxed'>
                {about.paragraph2}
              </p>
              <Link
                href={about.readMoreHref}
                className='group text-primary mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline'
              >
                {about.readMoreLabel}
                <svg
                  className='size-4 transition-transform group-hover:translate-x-0.5'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-hidden='true'
                >
                  <path
                    d='M3 8h10M9 4l4 4-4 4'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </Link>
            </div>

            {/* Right: "Lahir dari Rahim Reformasi" card — exits to the RIGHT */}
            <div ref={aboutRightRef} className='flex flex-col gap-4'>
              <div className='bg-primary text-primary-foreground rounded-2xl p-6'>
                <div className='bg-primary-foreground/15 mb-4 flex size-10 items-center justify-center rounded-xl'>
                  <svg
                    className='size-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    aria-hidden='true'
                  >
                    <rect
                      x='3'
                      y='4'
                      width='18'
                      height='18'
                      rx='2'
                      stroke='currentColor'
                      strokeWidth='1.5'
                    />
                    <path
                      d='M16 2v4M8 2v4M3 10h18'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                    />
                    <path
                      d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                  </svg>
                </div>
                <p className='text-primary-foreground/60 font-sans text-xs font-semibold tracking-widest uppercase'>
                  29 Maret 1998 · Malang
                </p>
                <h3 className='font-heading mt-1 text-lg font-bold'>
                  {about.sejarahCardTitle}
                </h3>
                <p className='text-primary-foreground/80 mt-2 font-sans text-sm leading-relaxed'>
                  {about.sejarahCardDescription}
                </p>
                <Link
                  href={about.sejarahCardLinkHref}
                  className='text-primary-foreground/90 hover:text-primary-foreground mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold'
                >
                  {about.sejarahCardLinkLabel}
                  <svg
                    className='size-4'
                    viewBox='0 0 16 16'
                    fill='none'
                    aria-hidden='true'
                  >
                    <path
                      d='M3 8h10M9 4l4 4-4 4'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
       * ══════════════════════════════════════════════════════════════════════
       * LAYER 3 — Leadership  (z-index: 30)
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={leadershipLayerRef}
        className='bg-background border-border absolute inset-0 z-30 flex flex-col overflow-hidden border-b'
        style={{ pointerEvents: 'none' }}
        aria-labelledby='leadership-heading'
      >
        {/* Header — zooms from huge at center to small at top on desktop */}
        <div
          ref={lsTextRef}
          className='px-6 pt-24 pb-4 text-center lg:px-8 lg:pt-28'
        >
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            {leadership.periodLabel}
          </p>
          <h2
            id='leadership-heading'
            className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
          >
            {leadership.heading}
          </h2>
          <div className='mt-6 mb-12 flex justify-center'>
            <Link
              href='/tentang/pengurus'
              className='text-primary hover:text-primary/80 group flex items-center gap-2 font-sans text-sm font-semibold transition-colors'
            >
              Lihat Seluruh Pengurus Pusat
              <svg
                className='size-4 transition-transform group-hover:translate-x-1'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path
                  d='M6 12l4-4-4-4'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Photo trio — converge from edges, then exit downward */}
        <div className='mt-auto flex flex-col items-start gap-10 px-6 sm:px-8 md:flex-row md:items-end md:justify-center md:gap-0 lg:px-12'>
          {trio.map(({ key, label, name, photoSrc, position, ref: photoRef }) => {
            const isCenter = position === 'center'
            const isLeft = position === 'left'

            return (
              <div
                key={key}
                ref={photoRef}
                data-ls-photo={key}
                className={cn(
                  'group relative shrink-0 cursor-pointer overflow-visible rounded-[2.5rem] bg-muted/60 px-4 pt-4 pb-0',
                  'md:w-auto md:rounded-none md:bg-transparent md:p-0',
                  isLeft
                    ? 'md:-mr-[12vw] lg:-mr-[15vw]'
                    : !isCenter
                      ? 'md:-ml-[12vw] lg:-ml-[15vw]'
                      : '',
                  isCenter
                    ? 'order-1 z-10 md:order-none'
                    : isLeft
                      ? 'order-2 z-0 md:order-none'
                      : 'order-3 z-0 md:order-none',
                  isCenter
                    ? 'h-[clamp(200px,38vh,320px)] md:h-[min(44vw,800px)]'
                    : 'h-[clamp(175px,33vh,280px)] md:h-[min(40vw,740px)]'
                )}
              >
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={`Foto ${name}`}
                    width={800}
                    height={1067}
                    className='h-full w-auto max-w-none object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.02] max-md:rounded-t-[2rem] max-md:object-left-bottom'
                    unoptimized={photoSrc.startsWith('http')}
                  />
                ) : (
                  <div
                    className='bg-muted/30 h-full rounded-t-[2rem]'
                    style={{ aspectRatio: '3/4' }}
                  />
                )}

                {/* Frosted name plate */}
                <div
                  className={cn(
                    'absolute rounded-xl px-4 py-2.5',
                    'bg-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/50 backdrop-blur-md',
                    'w-max max-w-[85%] transition-[opacity,transform] duration-200 ease-out',
                    'bottom-12 translate-y-1 opacity-70 max-md:hidden',
                    'group-hover:translate-y-0 group-hover:opacity-100',
                    isCenter
                      ? 'left-1/2 -translate-x-1/2 text-center'
                      : isLeft
                        ? 'left-8 text-left'
                        : 'right-8 text-right',
                    'max-md:right-[-24px] max-md:bottom-6 max-md:left-auto max-md:flex max-md:max-w-[80%] max-md:translate-y-0 max-md:translate-x-0 max-md:opacity-100 max-md:text-right'
                  )}
                >
                  <p className='text-primary font-sans text-[10px] leading-none font-bold tracking-[0.2em] uppercase'>
                    {label}
                  </p>
                  <p className='font-heading text-foreground mt-1.5 text-sm leading-tight font-bold md:text-base'>
                    {name}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/*
       * ══════════════════════════════════════════════════════════════════════
       * LAYER 4 — Network  (z-index: 40)
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={networkLayerRef}
        className='bg-background absolute inset-0 z-40'
        style={{ pointerEvents: 'none' }}
        aria-labelledby='network-heading'
      >
        {/* Map: full-cover background — pans on hover */}
        <div ref={netMapRef} className='absolute inset-0 z-0'>
          <LeafletMap
            pwLookup={pwLookup.current}
            onTooltip={handleTooltip}
            onMapHover={handleMapHover}
          />
        </div>

        {/* Top gradient for header readability */}
        <div
          className='pointer-events-none absolute inset-x-0 top-0 z-[5] h-56 bg-gradient-to-b from-background/92 via-background/50 to-transparent'
          aria-hidden='true'
        />

        {/* Bottom gradient for cards readability */}
        <div
          className='pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-56 bg-gradient-to-t from-background/92 via-background/50 to-transparent'
          aria-hidden='true'
        />

        {/* Content overlay — on top of map in z-axis, not y-axis */}
        <div className='pointer-events-none absolute inset-0 z-10 flex flex-col'>
          {/* Header: eyebrow + title + CTA button */}
          <div
            ref={netHeaderRef}
            className='pointer-events-auto shrink-0 pt-24 pb-2 text-center lg:pt-28'
          >
            <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
              Jaringan Nasional
            </p>
            <h2
              id='network-heading'
              className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold'
            >
              PW/PD KAMMI se-Indonesia
            </h2>
          </div>

          {/* CTA button — just below title */}
          <div
            ref={netCtaRef}
            className='pointer-events-auto shrink-0 pb-2 text-center'
          >
            <Link
              href='/wilayah-daerah'
              className={cn(
                'group inline-flex items-center gap-2 rounded-xl px-6 py-3',
                'bg-primary text-primary-foreground font-sans text-sm font-semibold',
                'transition-[transform,box-shadow] duration-200 ease-out',
                'hover:scale-[1.02] hover:shadow-[0_8px_24px_oklch(0.52_0.20_17_/_0.35)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                'mt-5'
              )}
            >
              Jelajahi Jaringan KAMMI
              <svg
                className='size-4 transition-transform duration-200 group-hover:translate-x-1'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path
                  d='M3 8h10M9 4l4 4-4 4'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Link>
          </div>

          {/* Spacer — map fills the middle */}
          <div className='flex-1' />

          {/* Stat cards at bottom */}
          <div
            ref={netCardsRef}
            className='pointer-events-auto shrink-0 px-6 pb-24 lg:px-12'
          >
            <div className='grid grid-cols-3 gap-3 lg:gap-4'>
              {statCards.map((card) => (
                <StatCard
                  key={card.dataAttr}
                  value={card.value}
                  label={card.label}
                  dataAttr={card.dataAttr}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
