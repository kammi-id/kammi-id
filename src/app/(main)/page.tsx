'use client'

import { Construction } from 'lucide-react'

import { Badge } from '~/components/shadcn/ui/badge'

const Page = () => {
  return (
    <main className='bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 antialiased'>
      {/* Background Aesthetic */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-radial-[at_50%_50%,rgba(67,147,131,0.1)_0%,transparent_70%]' />
        <div className='bg-primary/10 absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full blur-3xl' />
      </div>

      {/* Main Content */}
      <div className='z-10 flex w-full max-w-2xl flex-col items-center gap-8 text-center'>
        {/* Badge Section */}
        <Badge
          variant='outline'
          className='animate-in fade-in slide-in-from-bottom-3 border-primary/20 bg-primary/5 text-primary flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-widest uppercase duration-700 select-none'
        >
          <Construction className='size-3.5' />
          Under Construction
        </Badge>

        {/* Hero Text */}
        <section className='space-y-4'>
          <h1 className='font-heading animate-in fade-in slide-in-from-bottom-4 text-5xl font-extrabold tracking-tight duration-1000 select-none sm:text-7xl'>
            KAMMI <span className='text-secondary-foreground/20'>ID</span>
          </h1>
          <p className='animate-in fade-in slide-in-from-bottom-5 text-muted-foreground mx-auto max-w-md text-lg text-balance delay-100 duration-1000'>
            Situs ini sedang dalam tahap pengembangan kreatif. Kami sedang
            membangun sesuatu yang luar biasa untuk masa depan.
          </p>
        </section>
      </div>

      {/* Footer Branding */}
      <footer className='animate-in fade-in zoom-in absolute bottom-8 z-10 delay-700 duration-1000'>
        <p className='text-muted-foreground/30 text-xs font-medium tracking-widest uppercase'>
          © 2026 KAMMI.id
        </p>
      </footer>
    </main>
  )
}

export default Page
