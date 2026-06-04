'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Logo from '~/assets/logo.png'

export const UnderConstructionClient = () => {
  const container = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out', duration: 1.2 }
      })

      gsap.set(
        [
          logoRef.current,
          statusRef.current,
          titleRef.current,
          footerRef.current
        ],
        {
          opacity: 0,
          y: 40
        }
      )

      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8
      })
        .to(
          statusRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8
          },
          '-=0.4'
        )
        .to(
          titleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.5
          },
          '-=0.6'
        )
        .to(
          footerRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1
          },
          '-=0.8'
        )
        .to(
          progressRef.current,
          {
            width: '100%',
            duration: 1.5,
            ease: 'expo.inOut'
          },
          '-=1'
        )

      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e
        const xPos = (clientX / window.innerWidth - 0.5) * 30
        const yPos = (clientY / window.innerHeight - 0.5) * 30

        gsap.to(titleRef.current, {
          x: xPos,
          y: yPos,
          duration: 0.8,
          ease: 'power2.out'
        })
      }

      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    },
    { scope: container }
  )

  return (
    <main
      ref={container}
      className='bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative min-h-screen w-full overflow-hidden'
    >
      {/*
        Blueprint Grid using Tailwind Arbitrary Values
        bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] defines the dot pattern
        bg-[length:32px_32px] defines the spacing
      */}
      <div className='absolute inset-0 -z-10 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-[length:32px_32px] opacity-[0.03] dark:opacity-[0.05]' />

      <div className='relative z-10 flex min-h-screen flex-col justify-center px-6 md:px-12 lg:px-24'>
        <div
          ref={logoRef}
          className='absolute top-12 right-0 left-0 flex justify-center'
        >
          <Image
            src={Logo}
            alt='KAMMI Logo'
            className='h-12 w-auto object-contain'
            sizes='40px'
            priority
          />
        </div>

        <div ref={statusRef} className='mb-6 flex w-fit items-center gap-3'>
          <span className='relative flex h-3 w-3'>
            <span className='bg-destructive absolute inset-0 animate-ping rounded-full'></span>
            <span className='bg-destructive relative inline-flex h-3 w-3 rounded-full'></span>
          </span>
          <span className='text-muted-foreground font-sans text-xs font-medium tracking-widest uppercase'>
            System Status: Building
          </span>
        </div>

        <div ref={titleRef} className='max-w-5xl'>
          <h1 className='font-heading text-foreground text-[clamp(3rem,12vw,8rem)] leading-[0.9] font-bold tracking-tighter uppercase'>
            Under <br />
            <span className='text-primary'>Construction</span>
          </h1>

          <div className='bg-primary/20 relative mt-6 h-1 w-full max-w-md overflow-hidden'>
            <div
              ref={progressRef}
              className='bg-primary absolute inset-0 w-0'
            />
          </div>
        </div>

        <div
          ref={footerRef}
          className='absolute right-6 bottom-12 left-6 flex justify-start md:right-12 md:left-12 lg:right-24'
        >
          <div className='max-w-md text-left'>
            <p className='text-muted-foreground font-sans text-sm leading-relaxed md:text-base'>
              Kami sedang membangun rumah digital baru untuk{' '}
              <span className='text-foreground font-semibold'>KAMMI.id</span>.
              Sesuatu yang lebih enerjik, profesional, dan inklusif sedang
              dipersiapkan.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
