'use client'

import { useRef } from 'react'

export const VisiSection = () => {
  const containerRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  return (
    <section
      id='visi'
      ref={containerRef}
      className='relative flex h-full items-center justify-center overflow-hidden bg-transparent px-6 py-24 lg:px-8'
      aria-labelledby='visi-heading'
    >
      {/* Eyebrow — sticky at top, matches other section labels */}
      <div className='absolute inset-x-0 top-[13vh] flex justify-center px-6'>
        <p
          ref={titleRef}
          className='visi-title text-primary-foreground/70 font-sans text-sm font-semibold tracking-widest uppercase opacity-0'
        >
          Visi KAMMI
        </p>
      </div>

      <div className='relative mx-auto max-w-5xl text-center'>
        <h2
          ref={textRef}
          id='visi-heading'
          className='visi-text font-heading text-primary-foreground mt-6 text-[clamp(1.75rem,4vw,3.25rem)] leading-snug font-bold opacity-0'
        >
          Wadah perjuangan permanen yang akan melahirkan kader-kader Pemimpin
          dalam upaya mewujudkan Bangsa dan Negara Indonesia yang Islami.
        </h2>
      </div>
    </section>
  )
}
