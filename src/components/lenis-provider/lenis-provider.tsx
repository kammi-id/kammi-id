'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type LenisContextType = {
  scrollTo: (target: HTMLElement | string | number) => void
}

const LenisContext = createContext<LenisContextType>({
  scrollTo: () => {}
})

export const useLenisScroll = () => useContext(LenisContext)

export const LenisProvider = ({ children }: { children: ReactNode }) => {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(raf)
      lenisRef.current = null
    }
  }, [])

  const scrollTo = (target: HTMLElement | string | number) => {
    lenisRef.current?.scrollTo(target as Parameters<Lenis['scrollTo']>[0])
  }

  return (
    <LenisContext.Provider value={{ scrollTo }}>
      {children}
    </LenisContext.Provider>
  )
}
