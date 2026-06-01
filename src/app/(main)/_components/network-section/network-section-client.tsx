'use client'

import { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '~/lib/shadcn/utils'
import { matchSlugForPW, type ProvinceTooltip } from './leaflet-map-utils'
import type { NetworkStats, PWOrg } from '~/app/(main)/_data/network'

gsap.registerPlugin(ScrollTrigger)

// Dynamically import Leaflet — no SSR
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div
      className='h-full w-full animate-pulse rounded-2xl'
      style={{ background: 'oklch(0.94 0.018 240)' }}
    />
  )
})

const buildPWLookup = (pwOrgs: PWOrg[]): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const pw of pwOrgs) {
    const slug = matchSlugForPW(pw.name)
    if (slug && !map[slug]) map[slug] = pw.name
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
  const cardsRowRef = useRef<HTMLDivElement>(null)
  const ctaBtnRef = useRef<HTMLDivElement>(null)
  // Tooltip via direct DOM — zero React re-renders on hover
  const tooltipRef = useRef<HTMLDivElement>(null)
  const mapHoveredRef = useRef(false)
  const pwLookup = useRef(buildPWLookup(pwOrgs))

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
    const cardsRow = cardsRowRef.current
    const ctaBtn = ctaBtnRef.current
    const mapArea = mapAreaRef.current
    if (!section || !cardsRow || !ctaBtn || !mapArea) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const cards = Array.from(cardsRow.querySelectorAll<HTMLElement>('[data-stat]'))
      const numEls = Array.from(cardsRow.querySelectorAll<HTMLElement>('[data-target]'))
      const statValues = [stats.wilayah, stats.daerah, stats.komisariat]
      const counterObjs = statValues.map((v) => ({ val: 0, target: v }))

      gsap.set(mapArea, { opacity: 0, scale: 0.97 })
      gsap.set(cards, { opacity: 0, y: 56 })
      gsap.set(ctaBtn, { opacity: 0, y: 20 })

      const tl = gsap.timeline()

      tl.to(mapArea, { opacity: 1, scale: 1, ease: 'none', duration: 0.18 }, 0)

      cards.forEach((card, i) => {
        const s = 0.18 + i * 0.2
        tl.to(card, { opacity: 1, y: 0, ease: 'none', duration: 0.2 }, s)
        tl.to(
          counterObjs[i],
          {
            val: counterObjs[i].target,
            ease: 'none',
            duration: 0.2,
            onUpdate() {
              const el = numEls[i]
              if (el) el.textContent = String(Math.round(counterObjs[i].val))
            }
          },
          s
        )
      })

      tl.to(ctaBtn, { opacity: 1, y: 0, ease: 'none', duration: 0.14 }, 0.82)

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

  // Map hover: cards slide down + map zooms
  const handleMapHover = useCallback((hovering: boolean) => {
    if (hovering === mapHoveredRef.current) return
    mapHoveredRef.current = hovering
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    gsap.to(cardsRowRef.current, {
      y: hovering ? 68 : 0,
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
      className='bg-background relative flex h-dvh max-h-dvh flex-col overflow-hidden'
      aria-labelledby='network-heading'
    >
      {/* Fixed tooltip — DOM-managed, zero React re-renders on hover */}
      <div
        ref={tooltipRef}
        className='pointer-events-none fixed z-[9999] min-w-[160px] max-w-[240px] rounded-xl px-3.5 py-2.5 shadow-xl'
        style={{
          visibility: 'hidden',
          background: 'oklch(0.141 0.005 285.823)',
          color: 'white',
          transform: 'translateY(-100%)'
        }}
        aria-hidden='true'
      >
        <p className='font-sans text-[9px] font-semibold tracking-widest uppercase opacity-50'>
          Provinsi
        </p>
        <p data-tip-name className='font-heading mt-0.5 text-sm font-bold leading-snug' />

        {/* PW section — shown when province has a PW */}
        <div data-tip-pw-section style={{ display: 'none' }}>
          <div className='my-1.5 h-px w-full bg-white/20' />
          <p className='font-sans text-[9px] font-semibold tracking-widest uppercase opacity-50'>
            Pengurus Wilayah
          </p>
          <p data-tip-pw className='font-sans mt-0.5 text-xs leading-snug opacity-90' />
        </div>

        {/* Fallback — shown when no PW exists */}
        <div data-tip-nopw-section style={{ display: 'none' }}>
          <div className='my-1.5 h-px w-full bg-white/15' />
          <p className='font-sans text-[10px] opacity-40'>Belum ada PW</p>
        </div>
      </div>

      {/* Header */}
      <div className='relative z-10 shrink-0 pt-8 text-center lg:pt-10'>
        <p
          id='network-heading'
          className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'
        >
          Jaringan Nasional
        </p>
        <h2 className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold'>
          Peta Jaringan KAMMI
        </h2>
      </div>

      {/* Map */}
      <div
        ref={mapAreaRef}
        className='relative z-0 min-h-0 flex-1 px-6 pt-3 pb-0 lg:px-12'
      >
        <LeafletMap
          pwLookup={pwLookup.current}
          onTooltip={handleTooltip}
          onMapHover={handleMapHover}
        />
      </div>

      {/* Stat cards */}
      <div
        ref={cardsRowRef}
        className='relative z-10 shrink-0 -mt-6 px-6 pb-3 lg:-mt-8 lg:px-12'
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

        <div ref={ctaBtnRef} className='mt-4 flex justify-center lg:mt-5'>
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
    </section>
  )
}
