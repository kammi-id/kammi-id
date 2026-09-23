'use client'

/**
 * HomeScene — four normal-flow sections (Hero, About, Leadership, Network).
 * Each section plays its own one-shot GSAP entrance the first time it enters
 * the viewport, via a plain IntersectionObserver. No pin, no scroll-scrub, no
 * cross-section transition — sections sit where the document puts them.
 */

import { useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { cn } from '~/lib/shadcn/utils'
import { useSectionReveal } from '~/hooks/use-section-reveal'
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

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

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
      <span data-target={value}>{value}</span>
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
  const rootRef = useRef<HTMLDivElement>(null)

  // Section refs — reveal trigger targets
  const heroSectionRef = useRef<HTMLDivElement>(null)
  const aboutSectionRef = useRef<HTMLDivElement>(null)
  const leadershipSectionRef = useRef<HTMLDivElement>(null)
  const networkSectionRef = useRef<HTMLDivElement>(null)

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
  // Mobile-only: sub-element refs for staggered text animation
  const lsPeriodRef = useRef<HTMLParagraphElement>(null)
  const lsHeadingRef = useRef<HTMLHeadingElement>(null)
  const lsCtaRef = useRef<HTMLDivElement>(null)
  // Mobile-only: sequential portrait stage (separate from desktop trio)
  const lsMobileKetuaRef = useRef<HTMLDivElement>(null)
  const lsMobileSekjRef = useRef<HTMLDivElement>(null)
  const lsMobileBendRef = useRef<HTMLDivElement>(null)

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
    const portalRoot = document.getElementById('portal-root') ?? document.body
    portalRoot.appendChild(el)
    tooltipRef.current = el

    const onScroll = () => {
      el.style.visibility = 'hidden'
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      portalRoot.removeChild(el)
      tooltipRef.current = null
    }
  }, [])

  // ── Tooltip updater ─────────────────────────────────────────────────────────
  const handleTooltip = useCallback((t: ProvinceTooltip) => {
    const el = tooltipRef.current
    if (!el) return

    if (!t.visible || !t.pwName) {
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
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return
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

  // ── Per-section entrance timelines ──────────────────────────────────────────
  const isDesktopRef = useRef(true)

  const { contextSafe } = useGSAP(
    () => {
      if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return
      isDesktopRef.current = window.innerWidth >= 768

      // ── Initial hidden/offset states — set before first paint so nothing
      // flashes visible before its section is revealed. ─────────────────────
      gsap.set(
        [heroBadgeRef.current, heroH1Ref.current, heroDescRef.current].filter(
          Boolean
        ),
        { opacity: 0, y: 24 }
      )
      gsap.set(heroImgRef.current, { scale: 1.06, opacity: 0 })

      gsap.set([aboutLeftRef.current], { opacity: 0, x: -60 })
      gsap.set([aboutRightRef.current], { opacity: 0, x: 60 })

      if (isDesktopRef.current) {
        gsap.set(lsTextRef.current, { opacity: 0, y: 24, scale: 0.96 })
        gsap.set(lsKetuaRef.current, { y: '30vh', opacity: 0 })
        gsap.set(lsSekjRef.current, { x: '-30vw', opacity: 0 })
        gsap.set(lsBendRef.current, { x: '30vw', opacity: 0 })
      } else {
        gsap.set(lsPeriodRef.current, { opacity: 0, y: 22 })
        gsap.set(lsHeadingRef.current, { opacity: 0, y: 22 })
        gsap.set(lsCtaRef.current, { opacity: 0, y: 14 })
        gsap.set(
          [
            lsMobileKetuaRef.current,
            lsMobileSekjRef.current,
            lsMobileBendRef.current
          ],
          { x: '110vw' }
        )
        const mobilePlates = [
          lsMobileKetuaRef.current,
          lsMobileSekjRef.current,
          lsMobileBendRef.current
        ]
          .filter(Boolean)
          .map((el) => el!.querySelector<HTMLElement>('[data-mobile-plate]'))
          .filter(Boolean)
        gsap.set(mobilePlates, { opacity: 0 })
      }

      gsap.set(netMapRef.current, { scale: 1.15, opacity: 0 })
      gsap.set(netHeaderRef.current, { opacity: 0, y: -24 })
      gsap.set(netCtaRef.current, { opacity: 0, y: -12 })
      if (netCardsRef.current) {
        const cards = Array.from(
          netCardsRef.current.querySelectorAll<HTMLElement>('[data-stat]')
        )
        gsap.set(cards, { opacity: 0, y: 56 })
      }
    },
    { scope: rootRef }
  )

  // ── Hero — enters immediately, it's already in view on load ────────────────
  const revealHero = useCallback(() => {
    gsap
      .timeline()
      .to(heroImgRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out'
      })
      .to(
        heroBadgeRef.current,
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        '-=0.55'
      )
      .to(
        heroH1Ref.current,
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      )
      .to(
        heroDescRef.current,
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        '-=0.4'
      )
  }, [])

  // ── About — left slides from left, right slides from right ─────────────────
  const revealAbout = useCallback(() => {
    gsap
      .timeline()
      .to(aboutLeftRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power3.out'
      })
      .to(
        aboutRightRef.current,
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      )
  }, [])

  // ── Leadership — desktop trio converges, mobile sequential reveal ──────────
  const revealLeadership = useCallback(() => {
    if (isDesktopRef.current) {
      gsap
        .timeline()
        .to(lsTextRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out'
        })
        .to(
          [lsSekjRef.current, lsBendRef.current],
          { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        )
        .to(
          lsKetuaRef.current,
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.5'
        )
      return
    }

    const plate = (ref: React.RefObject<HTMLDivElement | null>) =>
      ref.current?.querySelector<HTMLElement>('[data-mobile-plate]') ?? null

    gsap
      .timeline()
      // Title stagger in
      .to(lsPeriodRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out'
      })
      .to(
        lsHeadingRef.current,
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.2'
      )
      .to(
        lsCtaRef.current,
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' },
        '-=0.2'
      )
      // Ketua enters, holds, exits left
      .to(
        lsMobileKetuaRef.current,
        { x: 0, duration: 0.5, ease: 'power3.out' },
        '+=0.1'
      )
      .to(
        plate(lsMobileKetuaRef),
        { opacity: 1, duration: 0.35, ease: 'power3.out' },
        '-=0.2'
      )
      .to(lsMobileKetuaRef.current, {
        x: '-110vw',
        duration: 0.45,
        ease: 'power2.in',
        delay: 0.8
      })
      // Sekjen enters only after Ketua fully exits
      .to(lsMobileSekjRef.current, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out'
      })
      .to(
        plate(lsMobileSekjRef),
        { opacity: 1, duration: 0.35, ease: 'power3.out' },
        '-=0.2'
      )
      .to(lsMobileSekjRef.current, {
        x: '-110vw',
        duration: 0.45,
        ease: 'power2.in',
        delay: 0.8
      })
      // Bendahara enters only after Sekjen fully exits
      .to(lsMobileBendRef.current, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out'
      })
      .to(
        plate(lsMobileBendRef),
        { opacity: 1, duration: 0.35, ease: 'power3.out' },
        '-=0.2'
      )
  }, [])

  // ── Network — map zooms in, header/CTA/cards follow, stats count up ────────
  const revealNetwork = useCallback(() => {
    const tl = gsap.timeline().to(netMapRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    })
    tl.to(
      netHeaderRef.current,
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.5'
    ).to(
      netCtaRef.current,
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      '-=0.3'
    )

    if (netCardsRef.current) {
      const cards = Array.from(
        netCardsRef.current.querySelectorAll<HTMLElement>('[data-stat]')
      )
      const numEls = Array.from(
        netCardsRef.current.querySelectorAll<HTMLElement>('[data-target]')
      )
      const statValues = [
        networkStats.wilayah,
        networkStats.daerah,
        networkStats.komisariat
      ]

      cards.forEach((card, i) => {
        const counter = { val: 0 }
        tl.to(
          card,
          { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
          i === 0 ? '-=0.2' : '-=0.25'
        ).to(
          counter,
          {
            val: statValues[i],
            duration: 0.6,
            ease: 'power2.out',
            onUpdate() {
              const el = numEls[i]
              if (el) el.textContent = String(Math.round(counter.val))
            }
          },
          '<'
        )
      })
    }
  }, [networkStats])

  const heroReveal = contextSafe(revealHero)
  const aboutReveal = contextSafe(revealAbout)
  const leadershipReveal = contextSafe(revealLeadership)
  const networkReveal = contextSafe(revealNetwork)

  useSectionReveal(heroSectionRef, heroReveal)
  useSectionReveal(aboutSectionRef, aboutReveal)
  useSectionReveal(leadershipSectionRef, leadershipReveal)
  useSectionReveal(networkSectionRef, networkReveal)

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
    {
      value: networkStats.wilayah,
      label: 'Pengurus Wilayah',
      dataAttr: 'wilayah'
    },
    {
      value: networkStats.daerah,
      label: 'Pengurus Daerah',
      dataAttr: 'daerah'
    },
    {
      value: networkStats.komisariat,
      label: 'Komisariat',
      dataAttr: 'komisariat'
    }
  ]

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className='relative w-full'>
      {/*
       * ══════════════════════════════════════════════════════════════════════
       * Hero
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={heroSectionRef}
        className='relative -mt-20 h-svh w-full overflow-hidden'
        aria-labelledby='hero-heading'
      >
        {hero && (
          <>
            <div ref={heroImgRef} className='absolute inset-0'>
              {hero.resolvedImageUrl ? (
                <Image
                  src={hero.resolvedImageUrl}
                  alt={hero.title}
                  fill
                  sizes='100vw'
                  className='object-cover'
                  preload
                  unoptimized={hero.resolvedImageUrl.startsWith('http')}
                />
              ) : (
                <div className='bg-foreground/10 absolute inset-0' />
              )}
            </div>

            <div
              className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent'
              aria-hidden='true'
            />

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
                  className='font-heading text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.05] font-bold tracking-tight text-white'
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
       * About
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={aboutSectionRef}
        className='bg-background relative w-full py-20 md:py-28'
        id='tentang'
        aria-labelledby='about-heading'
      >
        <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
          <div className='grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px] xl:gap-20'>
            {/* Left: "Tentang KAMMI" */}
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
              <p className='text-muted-foreground mt-3 max-w-2xl font-sans text-sm leading-snug md:mt-6 md:text-base md:leading-relaxed'>
                {about.paragraph1}
              </p>
              <p className='text-muted-foreground mt-2 max-w-2xl font-sans text-sm leading-snug md:mt-4 md:text-base md:leading-relaxed'>
                {about.paragraph2}
              </p>
              <Link
                href={about.readMoreHref}
                className='group text-primary mt-3 inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline md:mt-6'
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

            {/* Right: "Lahir dari Rahim Reformasi" card. */}
            {/* Hidden below md: same content lives at /tentang. */}
            <div ref={aboutRightRef} className='hidden flex-col gap-4 md:flex'>
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
       * Leadership
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={leadershipSectionRef}
        className='bg-background border-border relative flex w-full flex-col overflow-hidden border-b pt-16 md:pt-20'
        aria-labelledby='leadership-heading'
      >
        {/* Header */}
        <div ref={lsTextRef} className='px-6 pb-2 text-center md:pb-4 lg:px-8'>
          <p
            ref={lsPeriodRef}
            className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'
          >
            {leadership.periodLabel}
          </p>
          <h2
            ref={lsHeadingRef}
            id='leadership-heading'
            className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
          >
            {leadership.heading}
          </h2>
          <div
            ref={lsCtaRef}
            className='mt-4 mb-3 flex justify-center md:mt-6 md:mb-12'
          >
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

        {/* ── Mobile: sequential portrait stage (hidden on md+) ──────────── */}
        <div className='relative h-[70vh] min-h-[420px] overflow-hidden md:hidden'>
          {(
            [
              {
                ref: lsMobileKetuaRef,
                key: 'mobile-ketua',
                label: 'Ketua Umum',
                name: leadership.triumvirate.ketua.name,
                photoSrc: leadership.triumvirate.ketua.photoSrc
              },
              {
                ref: lsMobileSekjRef,
                key: 'mobile-sekj',
                label: 'Sekretaris Jenderal',
                name: leadership.triumvirate.sekretaris.name,
                photoSrc: leadership.triumvirate.sekretaris.photoSrc
              },
              {
                ref: lsMobileBendRef,
                key: 'mobile-bend',
                label: 'Bendahara Umum',
                name: leadership.triumvirate.bendahara.name,
                photoSrc: leadership.triumvirate.bendahara.photoSrc
              }
            ] as const
          ).map(({ ref: portraitRef, key, label, name, photoSrc }) => (
            <div key={key} ref={portraitRef} className='absolute inset-0'>
              {/* Photo — fills stage, contained + anchored bottom-left ≥90vw wide */}
              <div className='absolute inset-0'>
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={`Foto ${name}`}
                    width={600}
                    height={900}
                    sizes='100vw'
                    className='h-full w-full object-contain object-bottom object-left'
                    unoptimized={photoSrc.startsWith('http')}
                  />
                ) : (
                  <div className='bg-muted/30 h-full w-full rounded-t-3xl' />
                )}
              </div>
              {/* Name plate — right side, overlapping photo */}
              <div
                data-mobile-plate
                className='absolute right-5 bottom-14 max-w-[52vw] rounded-xl bg-white/85 px-4 py-3 text-right shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/50 backdrop-blur-md'
              >
                <p className='text-primary font-sans text-[10px] leading-none font-bold tracking-[0.2em] uppercase'>
                  {label}
                </p>
                <p className='font-heading text-foreground mt-1.5 text-sm leading-snug font-bold'>
                  {name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Desktop: side-by-side trio (hidden below md) ─────────────────── */}
        <div className='hidden md:mt-auto md:flex md:flex-row md:items-end md:justify-center md:gap-0 md:px-8 lg:px-12'>
          {trio.map(
            ({ key, label, name, photoSrc, position, ref: photoRef }) => {
              const isCenter = position === 'center'
              const isLeft = position === 'left'

              return (
                <div
                  key={key}
                  ref={photoRef}
                  data-ls-photo={key}
                  className={cn(
                    'group relative shrink-0 cursor-pointer overflow-visible rounded-none bg-transparent p-0',
                    isLeft
                      ? 'md:-mr-[12vw] lg:-mr-[15vw]'
                      : !isCenter
                        ? 'md:-ml-[12vw] lg:-ml-[15vw]'
                        : '',
                    isCenter ? 'z-10' : 'z-0',
                    isCenter
                      ? 'md:h-[min(44vw,800px)]'
                      : 'md:h-[min(40vw,740px)]'
                  )}
                >
                  {photoSrc ? (
                    <Image
                      src={photoSrc}
                      alt={`Foto ${name}`}
                      width={800}
                      height={1067}
                      sizes='35vw'
                      className='h-full w-auto max-w-none object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.02]'
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
                      'bottom-12 translate-y-1 opacity-70',
                      'group-hover:translate-y-0 group-hover:opacity-100',
                      isCenter
                        ? 'left-1/2 -translate-x-1/2 text-center'
                        : isLeft
                          ? 'left-8 text-left'
                          : 'right-8 text-right'
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
            }
          )}
        </div>
      </div>

      {/*
       * ══════════════════════════════════════════════════════════════════════
       * Network
       * ══════════════════════════════════════════════════════════════════════
       */}
      <div
        ref={networkSectionRef}
        className='bg-background relative h-[85vh] min-h-[560px] w-full overflow-hidden'
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
          className='from-background/92 via-background/50 pointer-events-none absolute inset-x-0 top-0 z-[5] h-56 bg-gradient-to-b to-transparent'
          aria-hidden='true'
        />

        {/* Bottom gradient for cards readability */}
        <div
          className='from-background/92 via-background/50 pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-56 bg-gradient-to-t to-transparent'
          aria-hidden='true'
        />

        {/* Content overlay — on top of map in z-axis, not y-axis */}
        <div className='pointer-events-none absolute inset-0 z-10 flex flex-col'>
          {/* Header: eyebrow + title + CTA button */}
          <div
            ref={netHeaderRef}
            className='pointer-events-auto shrink-0 pt-10 pb-2 text-center md:pt-14'
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
                'focus-visible:outline-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
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
            className='pointer-events-auto shrink-0 px-4 pb-8 sm:px-6 md:pb-12 lg:px-12'
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
