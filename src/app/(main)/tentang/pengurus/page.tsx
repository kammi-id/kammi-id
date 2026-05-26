import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { LeadershipSection } from '~/app/(main)/_components/leadership-section'
import { LeadersDirectory } from './_components/leaders-directory'

export const metadata: Metadata = {
  title: 'Pengurus Pusat — KAMMI.id',
  description:
    'Mengenal Ketua Umum, Sekretaris Jenderal, Bendahara Umum, dan seluruh jajaran Pengurus Pusat KAMMI.',
}

const LeadershipSkeleton = () => (
  <div className='relative flex min-h-screen flex-col overflow-hidden bg-background'>
    <div className='px-6 pt-14 pb-8 text-center sm:pt-16 lg:px-8 lg:pt-20'>
      <div className='mx-auto h-3 w-24 animate-pulse rounded-full bg-muted' />
      <div className='mx-auto mt-3 h-7 w-56 animate-pulse rounded-full bg-muted' />
    </div>
    <div className='flex-1' />
    <div className='flex flex-col items-center gap-3 px-4 pb-8 sm:px-6 md:flex-row md:items-end md:justify-center md:gap-0 md:px-0 md:pb-0'>
      {[false, true, false].map((isCenter, i) => (
        <div
          key={i}
          className={[
            'w-full animate-pulse rounded-2xl bg-muted md:w-[260px]',
            isCenter
              ? 'h-[clamp(220px,48vh,400px)] md:h-[clamp(220px,65vh,650px)] md:z-10'
              : 'h-[clamp(200px,43vh,360px)] md:h-[clamp(209px,61.75vh,618px)]',
          ].join(' ')}
        />
      ))}
    </div>
  </div>
)

const DirectorySkeleton = () => (
  <div className='border-t border-border bg-background px-6 pt-20 pb-16 lg:px-8 lg:pt-28 lg:pb-20'>
    <div className='mx-auto max-w-6xl space-y-14'>
      {[6, 8].map((count, bi) => (
        <div key={bi} className='space-y-6'>
          <div className='mx-auto h-5 w-40 animate-pulse rounded-full bg-muted' />
          <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className='w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-0'
              >
                <div className='aspect-[3/4] animate-pulse rounded-xl bg-muted' />
                <div className='mt-3 space-y-1.5 px-0.5'>
                  <div className='h-2 w-16 animate-pulse rounded-full bg-muted' />
                  <div className='h-3.5 w-full animate-pulse rounded-full bg-muted' />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

const PengurusPage = () => {
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='px-6 py-3 lg:px-8'>
        <ol className='flex items-center gap-2 text-sm text-muted-foreground'>
          <li>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Beranda
            </Link>
          </li>
          <li aria-hidden='true' className='select-none'>
            /
          </li>
          <li>
            <h1 className='text-sm font-medium text-foreground'>Pengurus Pusat</h1>
          </li>
        </ol>
      </nav>

      <Suspense fallback={<LeadershipSkeleton />}>
        <LeadershipSection />
      </Suspense>

      <Suspense fallback={<DirectorySkeleton />}>
        <LeadersDirectory />
      </Suspense>
    </>
  )
}

export default PengurusPage
