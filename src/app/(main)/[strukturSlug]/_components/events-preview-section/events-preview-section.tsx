import Link from 'next/link'
import { getEvents } from '../../events/_data/events'
import { EventCards } from '../../events/_components/event-cards'
import { PublicationRow } from '../publication-row'

export const EventsPreviewSection = async ({
  organizationId
}: {
  organizationId: string | null
}) => {
  if (!organizationId) return null
  const { items } = await getEvents(organizationId, 'upcoming', 1, 8)
  if (!items.length) return null
  return (
    <section
      aria-labelledby='events-heading'
      className='bg-background py-8 md:py-10'
    >
      <div className='mx-auto max-w-(--breakpoint-lg) px-6 lg:px-8'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <h2
            id='events-heading'
            className='font-heading text-foreground text-3xl font-bold'
          >
            Events Mendatang
          </h2>
          <Link
            href='/events'
            className='text-primary text-sm font-semibold hover:underline'
          >
            Lihat Semua Events
          </Link>
        </div>
        <PublicationRow label='Events mendatang'>
          <EventCards items={items} />
        </PublicationRow>
      </div>
    </section>
  )
}
