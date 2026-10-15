import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  resolveStrukturIdFromParams,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { EventCards } from './_components/event-cards'
import { getEvents } from './_data/events'
import { EVENT_PAGE_SIZE, type EventListKind } from '~/db/query/event'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Jadwal dan pengumuman kegiatan KAMMI.',
  alternates: { canonical: '/events' }
}
const tabs = [
  { kind: 'upcoming', label: 'Mendatang' },
  { kind: 'past', label: 'Events Sebelumnya' },
  { kind: 'cancelled', label: 'Dibatalkan' }
] as const

const EventsContent = async ({
  params,
  searchParams
}: {
  params: StrukturRouteParams
  searchParams: Promise<{ status?: string; page?: string }>
}) => {
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) notFound()
  const search = await searchParams
  const kind: EventListKind =
    search.status === 'past' || search.status === 'cancelled'
      ? search.status
      : 'upcoming'
  const page = /^\d+$/.test(search.page ?? '1') ? Number(search.page ?? 1) : 1
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  const result = await getEvents(organizationId, kind, page)
  if (page > 1 && !result.items.length) notFound()
  return (
    <div className='mx-auto max-w-(--breakpoint-lg) px-6 py-10 lg:px-8'>
      <Link href='/' className='text-muted-foreground text-sm hover:underline'>
        Beranda
      </Link>
      <h1 className='font-heading mt-4 text-4xl font-bold'>Events</h1>
      <p className='text-muted-foreground mt-3'>
        Temukan jadwal dan pengumuman kegiatan.
      </p>
      <nav aria-label='Daftar Events' className='my-8 flex flex-wrap gap-4'>
        {tabs.map((tab) => (
          <Link
            key={tab.kind}
            href={`/events?status=${tab.kind}`}
            aria-current={kind === tab.kind ? 'page' : undefined}
            className='text-muted-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:underline'
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {result.items.length ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <EventCards items={result.items} />
        </div>
      ) : (
        <p className='text-muted-foreground py-12'>
          Belum ada Event dalam daftar ini.
        </p>
      )}
      <nav
        aria-label='Halaman Events'
        className='mt-8 flex justify-between gap-4'
      >
        {page > 1 && (
          <Link
            href={`/events?status=${kind}&page=${page - 1}`}
            className='text-primary hover:underline'
          >
            Sebelumnya
          </Link>
        )}
        {result.total > page * EVENT_PAGE_SIZE && (
          <Link
            href={`/events?status=${kind}&page=${page + 1}`}
            className='text-primary ml-auto hover:underline'
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  )
}
const EventsPage = (props: Parameters<typeof EventsContent>[0]) => (
  <Suspense
    fallback={
      <p className='text-muted-foreground px-6 py-10'>Memuat Events…</p>
    }
  >
    <EventsContent {...props} />
  </Suspense>
)
export default EventsPage
