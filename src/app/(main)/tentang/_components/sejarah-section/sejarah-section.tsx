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
          start: 'top 75%',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      id="sejarah"
      ref={containerRef}
      className="relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="sejarah-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-foreground/[0.04]"
          aria-hidden="true"
        >
          01
        </span>

        <div className="max-w-3xl">
          <p data-reveal className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Sejarah Singkat
          </p>
          <h2
            id="sejarah-heading"
            data-reveal
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-foreground"
          >
            Lahir dari Rahim Reformasi
          </h2>
          <div data-reveal className="mt-2 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
          <p data-reveal className="mt-8 font-sans text-base leading-relaxed text-foreground/70 lg:text-lg">
            KAMMI didirikan pada 29 Maret 1998 di Malang, Jawa Timur, di tengah gejolak reformasi
            yang mengubah wajah Indonesia. Organisasi ini lahir dari kesadaran mahasiswa Muslim yang
            ingin berkontribusi nyata dalam perubahan bangsa.
          </p>
          <p data-reveal className="mt-4 font-sans text-base leading-relaxed text-foreground/70 lg:text-lg">
            Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang konsisten menjaga arah
            perubahan tetap berada di jalur keadilan dan kebenaran. Hari ini, KAMMI hadir di ratusan
            kampus di seluruh penjuru Indonesia.
          </p>
        </div>
      </div>
    </section>
  )
}
