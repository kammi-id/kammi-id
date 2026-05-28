'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const VisiSection = () => {
  const containerRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      // Entrance animations are now handled by TentangScene
      // But we keep the local refs for the scene to target
    },
    { scope: containerRef }
  )

  return (
    <section
      id='visi'
      ref={containerRef}
      className='relative flex h-full items-center justify-center overflow-hidden bg-transparent px-6 py-24 lg:px-8'
      aria-labelledby='visi-heading'
    >
      <div className='relative mx-auto max-w-5xl text-center'>
        <p
          ref={titleRef}
          className='visi-title text-primary-foreground/60 font-sans text-sm font-semibold tracking-widest uppercase opacity-0'
        >
          Visi KAMMI
        </p>
        <p
          ref={textRef}
          id='visi-heading'
          className='visi-text font-heading text-primary-foreground mt-6 text-[clamp(1.75rem,4vw,3.25rem)] leading-snug font-bold opacity-0'
        >
          Wadah perjuangan permanen yang akan melahirkan kader-kader Pemimpin
          dalam upaya mewujudkan Bangsa dan Negara Indonesia yang Islami.
        </p>
      </div>
    </section>
  )
}
