'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const HeroSectionClient = ({
  children
}: {
  children: React.ReactNode
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      wrapper
        .querySelectorAll<HTMLElement>('[data-hero-section]')
        .forEach((section) => {
          const img = section.querySelector<HTMLElement>('[data-hero-img]')
          const badge = section.querySelector<HTMLElement>('[data-hero-badge]')
          const h1 = section.querySelector<HTMLElement>('[data-hero-h1]')
          const desc = section.querySelector<HTMLElement>('[data-hero-desc]')

          const tl = gsap.timeline()

          // Stagger: badge exits first → h1 → description → image zooms + fades last
          if (badge) {
            tl.to(
              badge,
              { opacity: 0, y: -28, ease: 'none', duration: 0.18 },
              0
            )
          }
          if (h1) {
            tl.to(
              h1,
              { opacity: 0, y: -52, ease: 'none', duration: 0.26 },
              0.12
            )
          }
          if (desc) {
            tl.to(
              desc,
              { opacity: 0, y: -36, ease: 'none', duration: 0.22 },
              0.22
            )
          }
          if (img) {
            tl.to(
              img,
              { scale: 1.1, opacity: 0, ease: 'none', duration: 0.52 },
              0.28
            )
          }

           
          ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: '+=80%',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            animation: tl,
            clamp: true
          } as Parameters<typeof ScrollTrigger.create>[0])
        })
    }, wrapper)

    return () => ctx.revert()
  }, [])

  return <div ref={wrapperRef}>{children}</div>
}
