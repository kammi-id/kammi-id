'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KARAKTERISTIK_ITEMS = [
  { title: 'Harokatu Tajnid', subtitle: 'Organisasi Pengkaderan' },
  { title: 'Harokatu Amal', subtitle: 'Organisasi Pergerakan' },
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
          start: 'top 70%',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      id="karakteristik"
      ref={containerRef}
      className="relative min-h-screen bg-background px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="karakteristik-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-foreground/[0.04]"
          aria-hidden="true"
        >
          04
        </span>

        <div className="mb-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Karakteristik KAMMI
          </p>
          <h2
            id="karakteristik-heading"
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-foreground"
          >
            Dua Watak Dasar
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-20 gap-y-12 lg:grid-cols-2">
          {KARAKTERISTIK_ITEMS.map((item, i) => (
            <div key={i} data-kar-col className="border-t-2 border-primary pt-8">
              <h3 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-snug text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
