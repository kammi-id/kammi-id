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
          start: 'top 60%',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      id="visi"
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-6 py-24 lg:px-8"
      aria-labelledby="visi-heading"
    >
      <div className="relative mx-auto max-w-5xl text-center">
        <span
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-heading text-[clamp(10rem,25vw,22rem)] font-bold leading-none text-primary-foreground/[0.05]"
          aria-hidden="true"
        >
          02
        </span>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary-foreground/60">
          Visi KAMMI
        </p>
        <p
          ref={textRef}
          id="visi-heading"
          className="mt-6 font-heading text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-snug text-primary-foreground"
        >
          Terwujudnya masyarakat Islami di Indonesia yang adil dan sejahtera dalam naungan ridha
          Allah SWT.
        </p>
      </div>
    </section>
  )
}
