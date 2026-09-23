import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { formatEventDate } from '~/lib/publikasi/event'
import type { listEventsForOrg } from '~/db/query/event'

export const EventCards = async ({
  items
}: {
  items: Awaited<ReturnType<typeof listEventsForOrg>>['items']
}) => {
  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      image: item.featuredImage
        ? await resolveSiteImage(item.featuredImage)
        : ''
    }))
  )
  return resolved.map((item) => (
    <Link
      key={item.id}
      href={`/events/${item.slug}`}
      className='group bg-background ring-foreground/5 flex flex-col overflow-hidden rounded-3xl shadow-sm ring-1 transition-shadow hover:shadow-md'
    >
      <div className='bg-muted relative aspect-[4/3] overflow-hidden'>
        {item.image && (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes='(min-width: 1024px) 304px, (min-width: 768px) 45vw, 90vw'
            className='object-contain'
            unoptimized={item.image.startsWith('http')}
          />
        )}
      </div>
      <div className='flex flex-col gap-2 p-4'>
        {item.eventCancelled && <Badge variant='destructive'>Dibatalkan</Badge>}
        {item.eventStartsAt && item.eventTimezone && (
          <time
            dateTime={item.eventStartsAt.toISOString()}
            className='text-primary text-sm font-medium'
          >
            {formatEventDate(item.eventStartsAt, item.eventTimezone)}
          </time>
        )}
        <h3 className='font-heading text-foreground line-clamp-2 text-lg font-bold'>
          {item.title}
        </h3>
        <p className='text-muted-foreground text-sm'>{item.eventLocation}</p>
      </div>
    </Link>
  ))
}
