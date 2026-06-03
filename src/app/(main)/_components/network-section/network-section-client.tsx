'use client'

import { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '~/lib/shadcn/utils'
import { matchSlugsForPW, type ProvinceTooltip } from './leaflet-map-utils'
import type { NetworkStats, PWOrg } from '~/app/(main)/_data/network'

gsap.registerPlugin(ScrollTrigger)

// Dynamically import Leaflet — no SSR
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div
      className='h-full w-full animate-pulse'
      style={{ background: 'oklch(0.94 0.018 240)' }}
    />
  )
})

const buildPWLookup = (pwOrgs: PWOrg[]): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const pw of pwOrgs) {
    for (const slug of matchSlugsForPW(pw.name)) {
      if (!map[slug]) map[slug] = pw.name
    }
  }
  return map
}

// ── Stat card ─────────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
interface NetworkSectionClientProps {
  stats: NetworkStats
  pwOrgs: PWOrg[]
}

export const NetworkSectionClient = ({
  stats,
  pwOrgs
}: NetworkSectionClientProps) => {
  const sectionRef = useRef<HTMLElement>(null)
  const mapAreaRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRowRef = useRef<HTMLDivElement>(null)
  const ctaBtnRef = useRef<HTMLDivElement>(null)
  // Tooltip element lives in document.body — never in React's tree.
  // This avoids SSR hydration mismatches caused by next/dynamic partial bailouts.
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const mapHoveredRef = useRef(false)
  const pwLookup = useRef(buildPWLookup(pwOrgs))

  // Create tooltip imperatively in document.body — client only, zero SSR footprint
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
      <p style="font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;opacity:0.5;margin:0">Provinsi</p>
      <p data-tip-name style="font-family:var(--font-heading,serif);font-size:14px;font-weight:700;line-height:1.25;margin:2px 0 0"></p>
      <div data-tip-pw-section style="display:none">
        <div style="height:1px;background:rgba(255,255,255,0.2);margin:6px 0"></div>
        <p style="font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;opacity:0.5;margin:0">Pengurus Wilayah</p>
        <p data-tip-pw style="font-size:12px;line-height:1.4;opacity:0.9;margin:2px 0 0"></p>
      </div>
      <div data-tip-nopw-section style="display:none">
        <div style="height:1px;background:rgba(255,255,255,0.15);margin:6px 0"></div>
        <p style="font-size:10px;opacity:0.4;margin:0">Belum ada PW</p>
      </div>
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

  // DOM-direct tooltip updater — no setState, no re-renders
  const handleTooltip = useCallback((t: ProvinceTooltip) => {
    const el = tooltipRef.current
    if (!el) return
    if (!t.visible) {
      el.style.visibility = 'hidden'
      return
    }
    el.style.visibility = 'visible'
    el.style.left = `${t.clientX + 16}px`
    el.style.top = `${t.clientY - 12}px`
    const nameEl = el.querySelector<HTMLElement>('[data-tip-name]')
    const pwEl = el.querySelector<HTMLElement>('[data-tip-pw]')
    const pwSection = el.querySelector<HTMLElement>('[data-tip-pw-section]')
    const noPwSection = el.querySelector<HTMLElement>('[data-tip-nopw-section]')
    if (nameEl) nameEl.textContent = t.idName
    if (t.pwName) {
      if (pwEl) pwEl.textContent = t.pwName
      if (pwSection) pwSection.style.display = 'block'
      if (noPwSection) noPwSection.style.display = 'none'
    } else {
      if (pwSection) pwSection.style.display = 'none'
      if (noPwSection) noPwSection.style.display = 'block'
    }
  }, [])

  // GSAP scroll-scrub entrance animation
  useEffect(() => {
    const section = sectionRef.current
    const header = headerRef.current
    const cardsRow = cardsRowRef.current
    const ctaBtn = ctaBtnRef.current
    const mapArea = mapAreaRef.current
    if (!section || !header || !cardsRow || !ctaBtn || !mapArea) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const cards = Array.from(
        cardsRow.querySelectorAll<HTMLElement>('[data-stat]')
      )
      const numEls = Array.from(
        cardsRow.querySelectorAll<HTMLElement>('[data-target]')
      )
      const statValues = [stats.wilayah, stats.daerah, stats.komisariat]
      const counterObjs = statValues.map((v) => ({ val: 0, target: v }))

      // Initial states — map zooms IN from large, everything else starts invisible
      gsap.set(mapArea, { opacity: 0, scale: 1.5 })
      gsap.set(header, { opacity: 0, y: -24 })
      gsap.set(ctaBtn, { opacity: 0, y: -12 })
      gsap.set(cards, { opacity: 0, y: 56 })

      const tl = gsap.timeline()

      // Map dramatically zooms in from scale(1.5) to scale(1)
      tl.to(
        mapArea,
        { opacity: 1, scale: 1, ease: 'none', duration: 0.32 },
        0
      )

      // Header slides down + fades in
      tl.to(header, { opacity: 1, y: 0, ease: 'none', duration: 0.2 }, 0.1)

      // CTA button fades in just after header
      tl.to(ctaBtn, { opacity: 1, y: 0, ease: 'none', duration: 0.14 }, 0.24)

      // Stat cards stagger up from bottom
      cards.forEach((card, i) => {
        const s = 0.32 + i * 0.14
        tl.to(card, { opacity: 1, y: 0, ease: 'none', duration: 0.18 }, s)
        tl.to(
          counterObjs[i],
          {
            val: counterObjs[i].target,
            ease: 'none',
            duration: 0.18,
            onUpdate() {
              const el = numEls[i]
              if (el) el.textContent = String(Math.round(counterObjs[i].val))
            }
          },
          s
        )
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        animation: tl,
        clamp: true
      } as any)
    }, section)

    return () => ctx.revert()
  }, [stats])

  // Map hover: cards slide down + map breathes slightly
  const handleMapHover = useCallback((hovering: boolean) => {
    if (hovering === mapHoveredRef.current) return
    mapHoveredRef.current = hovering
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) return
    gsap.to(cardsRowRef.current, {
      y: hovering ? 72 : 0,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto'
    })
    gsap.to(mapAreaRef.current, {
      scale: hovering ? 1.03 : 1,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto'
    })
    if (!hovering && tooltipRef.current) {
      tooltipRef.current.style.visibility = 'hidden'
    }
  }, [])

  const statCards = [
    { value: stats.wilayah, label: 'Pengurus Wilayah', dataAttr: 'wilayah' },
    { value: stats.daerah, label: 'Pengurus Daerah', dataAttr: 'daerah' },
    { value: stats.komisariat, label: 'Komisariat', dataAttr: 'komisariat' }
  ]

  return (
    <section
      ref={sectionRef}
      className='bg-background relative h-dvh max-h-dvh overflow-hidden'
      aria-labelledby='network-heading'
    >
      {/* Tooltip is created imperatively in document.body (see useEffect above). */}

      {/* Map: full-cover background — like a hero image, interactive */}
      <div ref={mapAreaRef} className='absolute inset-0 z-0'>
        <LeafletMap
          pwLookup={pwLookup.current}
          onTooltip={handleTooltip}
          onMapHover={handleMapHover}
        />
      </div>

      {/* Top gradient overlay for header text readability */}
      <div
        className='pointer-events-none absolute inset-x-0 top-0 z-[5] h-56 bg-gradient-to-b from-background/92 via-background/50 to-transparent'
        aria-hidden='true'
      />

      {/* Bottom gradient overlay for stat cards readability */}
      <div
        className='pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-56 bg-gradient-to-t from-background/92 via-background/50 to-transparent'
        aria-hidden='true'
      />

      {/* Content overlay — everything lives on top of the map (z-axis, not y-axis) */}
      <div className='pointer-events-none absolute inset-0 z-10 flex flex-col'>
        {/* Header: eyebrow + title + CTA button */}
        <div
          ref={headerRef}
          className='pointer-events-auto shrink-0 pt-8 pb-2 text-center lg:pt-10'
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

          {/* CTA button sits below title */}
          <div ref={ctaBtnRef} className='mt-5 flex justify-center'>
            <Link
              href='/wilayah-daerah'
              className={cn(
                'group inline-flex items-center gap-2 rounded-xl px-6 py-3',
                'bg-primary text-primary-foreground font-sans text-sm font-semibold',
                'transition-[transform,box-shadow] duration-200 ease-out',
                'hover:scale-[1.02] hover:shadow-[0_8px_24px_oklch(0.52_0.20_17_/_0.35)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
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
        </div>

        {/* Spacer — map fills the middle */}
        <div className='flex-1' />

        {/* Stat cards at the bottom */}
        <div
          ref={cardsRowRef}
          className='pointer-events-auto shrink-0 px-6 pb-6 lg:px-12'
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
    </section>
  )
}
