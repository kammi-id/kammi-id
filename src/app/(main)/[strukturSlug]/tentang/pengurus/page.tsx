import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PengurusHero } from './_components/pengurus-hero'
import { LeadersDirectory } from './_components/leaders-directory'
import { ScrollProgress } from './_components/scroll-progress'
import {
  resolveStrukturIdFromParams,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Pengurus Pusat',
  description:
    'Mengenal Ketua Umum, Sekretaris Jenderal, Bendahara Umum, dan seluruh jajaran Pengurus Pusat KAMMI.',
  openGraph: {
    title: 'Pengurus Pusat',
    description:
      'Mengenal Ketua Umum, Sekretaris Jenderal, Bendahara Umum, dan seluruh jajaran Pengurus Pusat KAMMI.'
  }
}

const LeadershipSkeleton = () => (
  <div className='bg-background relative flex min-h-screen flex-col overflow-hidden'>
    <div className='px-6 pt-14 pb-8 text-center sm:pt-16 lg:px-8 lg:pt-20'>
      <div className='bg-muted mx-auto h-3 w-24 animate-pulse rounded-full' />
      <div className='bg-muted mx-auto mt-3 h-7 w-56 animate-pulse rounded-full' />
    </div>
    <div className='flex-1' />
    <div className='flex flex-col items-center gap-3 px-4 pb-8 sm:px-6 md:flex-row md:items-end md:justify-center md:gap-0 md:px-0 md:pb-0'>
      {[false, true, false].map((isCenter, i) => (
        <div
          key={i}
          className={[
            'bg-muted w-full animate-pulse rounded-2xl md:w-[260px]',
            isCenter
              ? 'h-[clamp(220px,48vh,400px)] md:z-10 md:h-[clamp(220px,65vh,650px)]'
              : 'h-[clamp(200px,43vh,360px)] md:h-[clamp(209px,61.75vh,618px)]'
          ].join(' ')}
        />
      ))}
    </div>
  </div>
)

const DirectorySkeleton = () => (
  <div className='border-border bg-background border-t px-6 pt-20 pb-16 lg:px-8 lg:pt-28 lg:pb-20'>
    <div className='mx-auto max-w-6xl space-y-14'>
      {[6, 8].map((count, bi) => (
        <div key={bi} className='space-y-6'>
          <div className='bg-muted mx-auto h-5 w-40 animate-pulse rounded-full' />
          <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className='w-[calc(50%-8px)] min-w-0 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]'
              >
                <div className='bg-muted aspect-[3/4] animate-pulse rounded-xl' />
                <div className='mt-3 space-y-1.5 px-0.5'>
                  <div className='bg-muted h-2 w-16 animate-pulse rounded-full' />
                  <div className='bg-muted h-3.5 w-full animate-pulse rounded-full' />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

type PengurusPageProps = {
  params: StrukturRouteParams
}

const PengurusPage = async ({ params }: PengurusPageProps) => {
  const orgId = await resolveStrukturIdFromParams(params)

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: 'Beranda', url: '/' },
              { name: 'Tentang', url: '/tentang' },
              { name: 'Pengurus Pusat', url: '/tentang/pengurus' }
            ])
          )
        }}
      />
      <ScrollProgress />

      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='px-6 py-3 lg:px-8'>
        <ol className='text-muted-foreground flex items-center gap-2 text-sm'>
          <li>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Beranda
            </Link>
          </li>
          <li aria-hidden='true' className='select-none'>
            /
          </li>
          <li>
            <h1 className='text-foreground text-sm font-medium'>
              Pengurus Pusat
            </h1>
          </li>
        </ol>
      </nav>

      <Suspense fallback={<LeadershipSkeleton />}>
        <PengurusHero organizationId={orgId} />
      </Suspense>

      <Suspense fallback={<DirectorySkeleton />}>
        <LeadersDirectory organizationId={orgId} />
      </Suspense>
    </>
  )
}

export default PengurusPage
