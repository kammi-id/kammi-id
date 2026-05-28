'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TentangHero } from '../tentang-hero'
import { VisiSection } from '../visi-section'

export const TentangScene = () => {
  const sceneRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const visiRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: sceneRef.current,
          start: 'top top',
          end: '+=150%',
          scrub: true,
          pin: true
        }
      })

      mainTl
        .to(heroRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut'
        })
        .to(
          sceneRef.current,
          {
            backgroundColor: 'var(--primary)',
            duration: 1,
            ease: 'power2.inOut'
          },
          '<'
        )
        .to(
          visiRef.current,
          {
            pointerEvents: 'auto',
            duration: 0
          },
          '<'
        )
        .fromTo(
          '.visi-text',
          { opacity: 0, scale: 0.8, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1,
            ease: 'power2.inOut'
          },
          '-=0.7'
        )
        .to(
          '.visi-title',
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.inOut'
          },
          '-=0.4'
        )
    },
    { scope: sceneRef }
  )

  return (
    <div
      ref={sceneRef}
      className='bg-background relative h-svh w-full overflow-hidden'
    >
      <div ref={heroRef} className='absolute inset-0 z-10'>
        <TentangHero />
      </div>
      <div ref={visiRef} className='pointer-events-none absolute inset-0 z-20'>
        <VisiSection />
      </div>
    </div>
  )
}
