'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const MISI_ITEMS = [
  'Membina mahasiswa Muslim untuk menjadi kader dakwah yang kompeten dan berintegritas tinggi.',
  'Mengembangkan potensi mahasiswa sebagai pemimpin masa depan bangsa yang bertakwa.',
  'Membangun gerakan dakwah kampus yang sistematis dan berkesinambungan di seluruh Indonesia.',
  'Mendorong perubahan sosial-politik yang berlandaskan nilai-nilai Islam yang rahmatan lil alamin.',
  'Menjaga ukhuwah Islamiyah dan persatuan umat di tengah keberagaman bangsa Indonesia.',
]

export const MisiSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-misi-item]')
      if (!items?.length) return

      gsap.from(items, {
        x: -60,
        opacity: 0,
        stagger: 0.14,
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
      id="misi"
      ref={containerRef}
      className="relative min-h-screen bg-[oklch(0.14_0.005_285)] px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="misi-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-white/[0.03]"
          aria-hidden="true"
        >
          03
        </span>

        <div className="mb-14">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Misi KAMMI
          </p>
          <h2
            id="misi-heading"
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-white"
          >
            Lima Poros Gerak
          </h2>
        </div>

        <ol className="space-y-0" aria-label="Misi KAMMI">
          {MISI_ITEMS.map((item, i) => (
            <li
              key={i}
              data-misi-item
              className="flex items-start gap-6 border-t border-white/10 py-6 last:border-b last:border-white/10"
            >
              <span
                className="w-14 shrink-0 font-heading text-4xl font-bold tabular-nums text-primary/50 lg:text-5xl"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-1.5 font-sans text-base leading-relaxed text-white/70 lg:text-lg">
                {item}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
