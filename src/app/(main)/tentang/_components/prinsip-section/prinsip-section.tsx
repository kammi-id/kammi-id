'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PRINSIP_ITEMS = [
  { num: '01', title: 'Rabbani', desc: 'Berorientasi kepada Allah dalam setiap gerak dan keputusan organisasi.' },
  { num: '02', title: 'Ikhlas', desc: 'Beramal semata mengharap ridha Allah, jauh dari pamrih duniawi.' },
  { num: '03', title: 'Dakwah', desc: 'Gerakan yang berlandaskan seruan kepada kebaikan universal.' },
  { num: '04', title: 'Taghyir', desc: 'Mendorong perubahan dari individu hingga tatanan sosial yang lebih adil.' },
  { num: '05', title: 'Ukhuwah', desc: 'Membangun persaudaraan yang kokoh di atas aqidah yang sama.' },
  { num: '06', title: 'Istiqamah', desc: 'Teguh dan konsisten dalam menjalankan amanah gerakan.' },
]

export const PrinsipSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-prinsip-item]')
      if (!items?.length) return

      gsap.from(items, {
        y: 30,
        opacity: 0,
        stagger: 0.09,
        duration: 0.65,
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
      id="prinsip"
      ref={containerRef}
      className="relative min-h-screen bg-[oklch(0.18_0.008_285)] px-6 py-24 lg:px-8 lg:py-36"
      aria-labelledby="prinsip-heading"
    >
      <div className="relative mx-auto max-w-7xl">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-heading text-[clamp(8rem,20vw,18rem)] font-bold leading-none text-white/[0.03]"
          aria-hidden="true"
        >
          06
        </span>

        <div className="mb-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">
            Prinsip Gerakan KAMMI
          </p>
          <h2
            id="prinsip-heading"
            className="mt-3 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight text-white"
          >
            Enam Prinsip
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
          {PRINSIP_ITEMS.map((item) => (
            <div
              key={item.num}
              data-prinsip-item
              className="border-t border-white/10 py-8"
            >
              <span
                className="font-heading text-3xl font-bold tabular-nums text-primary/40"
                aria-hidden="true"
              >
                {item.num}
              </span>
              <h3 className="mt-3 font-heading text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-white/55">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
