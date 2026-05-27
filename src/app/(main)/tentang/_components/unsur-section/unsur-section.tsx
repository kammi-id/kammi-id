'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const UNSUR_ITEMS = [
  {
    num: '01',
    title: 'Kader',
    desc: 'Individu Muslim yang berproses dalam pembinaan KAMMI, membentuk karakter dan kompetensi untuk dakwah.',
  },
  {
    num: '02',
    title: 'Kampus',
    desc: 'Arena utama gerak KAMMI, tempat kader hadir sebagai representasi nilai Islam di kehidupan akademik.',
  },
  {
    num: '03',
    title: 'Masyarakat',
    desc: 'Medan pengabdian nyata, di mana kader KAMMI hadir sebagai agen perubahan sosial yang berdampak.',
  },
  {
    num: '04',
    title: 'Negara',
    desc: 'Cita-cita besar KAMMI: berkontribusi pada terwujudnya negara yang adil dan beradab berlandaskan nilai Islam.',
  },
]

export const UnsurSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-unsur-item]')
      if (!items?.length) return

      gsap.from(items, {
        scale: 0.88,
        opacity: 0,
        stagger: 0.12,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      id="unsur"
      ref={containerRef}
      className="relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="unsur-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-foreground/[0.04]"
          aria-hidden="true"
        >
          05
        </span>

        <div className="mb-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Unsur Gerakan KAMMI
          </p>
          <h2
            id="unsur-heading"
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-foreground"
          >
            Empat Pilar Gerak
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {UNSUR_ITEMS.map((item) => (
            <div key={item.num} data-unsur-item className="flex flex-col">
              <span
                className="font-heading text-5xl font-bold text-primary/20 lg:text-6xl"
                aria-hidden="true"
              >
                {item.num}
              </span>
              <h3 className="mt-4 font-heading text-xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
