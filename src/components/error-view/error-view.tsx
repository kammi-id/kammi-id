'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { Button } from '~/components/shadcn/ui/button'
import gsap from 'gsap'

export type ErrorType = '404' | 'general'
export type ErrorContext = 'public' | 'dashboard'

interface ErrorViewProps {
  type: ErrorType
  context: ErrorContext
  className?: string
}

const CONTENT = {
  public: {
    '404': {
      title: '404',
      heading: 'Yah, nyasar ya?',
      subtext: 'Halaman ini lagi main petak umpet, dan kayaknya dia menang.',
      action: 'Balik ke Home',
      href: '/'
    },
    general: {
      title: 'Error',
      heading: 'Waduh, ada kendala teknis!',
      subtext:
        'Sabar ya, tim kami lagi benerin ini biar kamu bisa lanjut eksplorasi.',
      action: 'Balik ke Home',
      href: '/'
    }
  },
  dashboard: {
    '404': {
      title: '404',
      heading: 'Ups, halaman tidak ditemukan',
      subtext: 'Sepertinya rute ini nggak ada di peta dashboard kamu.',
      action: 'Kembali ke Dashboard',
      href: '/dashboard'
    },
    general: {
      title: 'Error',
      heading: 'Terjadi kesalahan sistem',
      subtext:
        'Ada glitch kecil di dashboard kamu. Jangan panik, coba refresh atau balik dulu.',
      action: 'Kembali ke Dashboard',
      href: '/dashboard'
    }
  }
}

export const ErrorView = ({ type, context, className }: ErrorViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const decorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Entrance animations
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' }
      )

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power3.out' }
      )

      gsap.fromTo(
        buttonRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.6, ease: 'power2.out' }
      )

      // Background decorative floating animation
      gsap.to(decorRef.current, {
        x: 'random(-20, 20)',
        y: 'random(-20, 20)',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden p-6 text-center',
        className
      )}
    >
      <div
        ref={decorRef}
        className='pointer-events-none absolute inset-0 select-none'
      >
        <div
          className='text-primary absolute -top-20 -left-20 text-[20rem] leading-none font-black opacity-10 select-none'
          style={{ transform: 'rotate(-15deg)' }}
        >
          {CONTENT[context][type].title}
        </div>
        <div
          className='text-primary absolute -right-20 -bottom-20 text-[20rem] leading-none font-black opacity-10 select-none'
          style={{ transform: 'rotate(15deg)' }}
        >
          {CONTENT[context][type].title}
        </div>
      </div>

      <div className='relative z-10 flex max-w-2xl flex-col items-center gap-6'>
        <h1
          ref={titleRef}
          className='text-primary text-7xl font-black tracking-tighter md:text-9xl'
        >
          {CONTENT[context][type].title}
        </h1>

        <div ref={contentRef} className='space-y-4'>
          <h2 className='text-foreground text-3xl font-bold tracking-tight md:text-5xl'>
            {CONTENT[context][type].heading}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-md text-lg md:text-xl'>
            {CONTENT[context][type].subtext}
          </p>
        </div>

        <div ref={buttonRef}>
          <Button
            render={<Link href={CONTENT[context][type].href} />}
            nativeButton={false}
            size='lg'
            className='mt-4 h-14 px-8 text-lg font-semibold transition-transform hover:scale-105 active:scale-95'
          >
            {CONTENT[context][type].action}
          </Button>
        </div>
      </div>
    </div>
  )
}
