'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const MISI_ITEMS = [
  'Membina keislaman, keimanan, dan ketaqwaan mahasiswa muslim Indonesia.',
  'Menggali, mengembangkan, dan memantapkan potensi dakwah, intelektual, sosial, dan politik mahasiswa.',
  'Mencerahkan dan meningkatkan kualitas masyarakat Indonesia menjadi masyarakat yang rabbani, madani (civil society).',
  'Memelopori dan memelihara komunikasi, solidaritas, dan kerjasama mahasiswa Indonesia dalam menyelesaikan permasalahan kerakyatan dan kebangsaan.',
  'Mengembangkan kerjasama antar elemen masyarakat dengan semangat membawa kebaikan, menyebar manfaat, dan mencegah kemungkaran (amar maruf nahi munkar).'
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
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='misi'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.14_0.005_285)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='misi-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold text-white/[0.03] select-none'
          aria-hidden='true'
        >
          03
        </span>

        <div className='mb-14'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Misi KAMMI
          </p>
          <h2
            id='misi-heading'
            className='font-heading mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold text-white'
          >
            Lima Poros Gerak
          </h2>
        </div>

        <ol className='space-y-0' aria-label='Misi KAMMI'>
          {MISI_ITEMS.map((item, i) => (
            <li
              key={i}
              data-misi-item
              className='flex items-start gap-6 border-t border-white/10 py-6 last:border-b last:border-white/10'
            >
              <span
                className='font-heading text-primary/50 w-14 shrink-0 text-4xl font-bold tabular-nums lg:text-5xl'
                aria-hidden='true'
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className='mt-1.5 font-sans text-base leading-relaxed text-white/70 lg:text-lg'>
                {item}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
