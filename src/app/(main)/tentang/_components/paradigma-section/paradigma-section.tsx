'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PARADIGMA_ITEMS = [
  {
    num: '01',
    title: 'Islam sebagai Sistem Hidup Komprehensif',
    body: 'Islam bukan agama ritual semata, ia adalah sistem kehidupan yang mengatur seluruh aspek dari individu hingga negara — panduan yang menyeluruh dan tidak terbagi.',
  },
  {
    num: '02',
    title: 'Perubahan Dimulai dari Individu',
    body: 'Transformasi sosial yang sejati hanya mungkin terjadi jika dimulai dari pembentukan karakter individu yang unggul, berintegritas, dan bertakwa.',
  },
  {
    num: '03',
    title: 'Mahasiswa sebagai Agen Perubahan',
    body: 'Mahasiswa memiliki posisi strategis dalam masyarakat sebagai kelompok terdidik yang bebas dari kepentingan sempit dan mampu melihat gambaran besar.',
  },
  {
    num: '04',
    title: 'Dakwah sebagai Metode Gerak',
    body: 'Dakwah adalah jalan yang dipilih KAMMI untuk mencapai perubahan: mengajak, bukan memaksa; meyakinkan, bukan melarang; membangun, bukan merobohkan.',
  },
]

export const ParadigmaSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-paradigma-item]')
      if (!items?.length) return

      gsap.from(items, {
        x: 50,
        opacity: 0,
        stagger: 0.14,
        duration: 0.8,
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
      id="paradigma"
      ref={containerRef}
      className="relative min-h-screen bg-background px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="paradigma-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-foreground/[0.04]"
          aria-hidden="true"
        >
          07
        </span>

        <div className="mb-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Paradigma Gerakan KAMMI
          </p>
          <h2
            id="paradigma-heading"
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-foreground"
          >
            Empat Bingkai Pandang
          </h2>
        </div>

        <div className="divide-y divide-border">
          {PARADIGMA_ITEMS.map((item) => (
            <div
              key={item.num}
              data-paradigma-item
              className="flex items-start gap-8 py-8"
            >
              <span
                className="w-14 shrink-0 font-heading text-4xl font-bold tabular-nums text-primary/30"
                aria-hidden="true"
              >
                {item.num}
              </span>
              <div>
                <h3 className="font-heading text-xl font-bold leading-snug text-foreground lg:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
