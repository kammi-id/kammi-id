'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface AboutSectionClientProps {
  paragraph1: string
  paragraph2: string
  readMoreHref: string
  readMoreLabel: string
  sejarahCardTitle: string
  sejarahCardDescription: string
  sejarahCardLinkHref: string
  sejarahCardLinkLabel: string
}

export const AboutSectionClient = ({
  paragraph1,
  paragraph2,
  readMoreHref,
  readMoreLabel,
  sejarahCardTitle,
  sejarahCardDescription,
  sejarahCardLinkHref,
  sejarahCardLinkLabel
}: AboutSectionClientProps) => {
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const left = leftRef.current
    const right = rightRef.current
    if (!section || !left || !right) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      // Initial state — invisible until scroll drives the entrance
      gsap.set(section, { opacity: 0 })
      gsap.set(left, { opacity: 0, x: -60 })
      gsap.set(right, { opacity: 0, x: 60 })

      const tl = gsap.timeline()

      // ── Enter (t: 0 → 0.40) ───────────────────────────────────────────────
      // Section fades in
      tl.to(section, { opacity: 1, ease: 'none', duration: 0.08 }, 0)
      // Left col ("Tentang") slides from left + fades in
      tl.to(left, { opacity: 1, x: 0, ease: 'none', duration: 0.25 }, 0.07)
      // Right card ("Lahir dari Rahim Reformasi") slides from right + fades in — staggered
      tl.to(right, { opacity: 1, x: 0, ease: 'none', duration: 0.25 }, 0.18)

      // ── Hold (t: 0.40 → 0.60) ─────────────────────────────────────────────
      // Natural gap — content rests at full visibility

      // ── Exit (t: 0.60 → 1.0) ──────────────────────────────────────────────
      // Left exits to the LEFT
      tl.to(left, { opacity: 0, x: '-68vw', ease: 'none', duration: 0.32 }, 0.6)
      // Right ("Lahir") exits to the RIGHT — slight stagger after left
      tl.to(
        right,
        { opacity: 0, x: '68vw', ease: 'none', duration: 0.32 },
        0.66
      )
      // Section fades out last
      tl.to(section, { opacity: 0, ease: 'none', duration: 0.1 }, 0.9)

       
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        animation: tl,
        clamp: true
      } as any)
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id='tentang'
      className='bg-background flex h-dvh items-center overflow-hidden'
      aria-labelledby='about-heading'
    >
      <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px] xl:gap-20'>
          {/* Left: Tentang text — exits LEFT */}
          <div ref={leftRef}>
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
              {paragraph1}
            </p>
            <p className='text-muted-foreground mt-4 max-w-2xl font-sans text-base leading-relaxed'>
              {paragraph2}
            </p>
            <Link
              href={readMoreHref}
              className='group text-primary mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline'
            >
              {readMoreLabel}
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

          {/* Right: "Lahir dari Rahim Reformasi" card — exits RIGHT */}
          <div ref={rightRef} className='flex flex-col gap-4'>
            <div className='bg-primary text-primary-foreground rounded-2xl p-6'>
              {/* Calendar icon */}
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
                {sejarahCardTitle}
              </h3>
              <p className='text-primary-foreground/80 mt-2 font-sans text-sm leading-relaxed'>
                {sejarahCardDescription}
              </p>
              <Link
                href={sejarahCardLinkHref}
                className='text-primary-foreground/90 hover:text-primary-foreground mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold'
              >
                {sejarahCardLinkLabel}
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
    </section>
  )
}
