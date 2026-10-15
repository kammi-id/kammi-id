import { cache, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEventBySlug } from '~/db/query/event'
import { articlePermalinkHistoryQuery } from '~/db/query/article-permalink-history'
import {
  resolveStrukturForPermalinkFromParams,
  getStrukturIdentity
} from '~/app/(main)/_data/struktur'
import { isTerbit } from '~/lib/publikasi/tanggal-terbit'
import { formatEventDate } from '~/lib/publikasi/event'
import {
  resolveSiteImage,
  resolveAbsoluteSiteImage
} from '~/lib/utils/site-image'
import { deriveSummary } from '~/lib/seo'
import { ArticleBodyRenderer } from '~/components/article-body-renderer'
import { ImageGalleryGrid } from '~/components/image-gallery-grid'
import { resolveGalleryImages } from '~/lib/utils/site-image'
import { Badge } from '~/components/shadcn/ui/badge'
import { ArticleShareButtons } from '~/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/_components/article-share-buttons'

type Props = { params: Promise<{ strukturSlug: string; slug: string }> }
const loadEvent = cache(async (strukturSlug: string, slug: string) => {
  const struktur = await resolveStrukturForPermalinkFromParams(
    Promise.resolve({ strukturSlug })
  )
  if (!struktur) return null
  const direct = await getEventBySlug(struktur.id, slug)
  const row =
    direct ??
    (await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
      struktur.id,
      slug,
      'event'
    ))
  if (
    !row ||
    row.type !== 'event' ||
    !row.publishedAt ||
    !row.eventStartsAt ||
    !row.eventTimezone ||
    !(
      row.status === 'archived' ||
      (row.status === 'published' && isTerbit(row.publishedAt))
    )
  )
    return null
  const identity = await getStrukturIdentity(struktur.id)
  if (!identity) return null
  return {
    row,
    identity,
    isNonActive: struktur.isNonActive,
    redirect: row.slug !== slug
  }
})

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  await connection()
  const { strukturSlug, slug } = await params
  const result = await loadEvent(strukturSlug, slug)
  if (!result) return {}
  const { row, identity } = result
  const image = row.featuredImage
    ? await resolveAbsoluteSiteImage(row.featuredImage, identity)
    : null
  const description = deriveSummary(row.body, { strukturName: identity.name })
  return {
    title: row.title,
    description,
    alternates: { canonical: `/events/${row.slug}` },
    robots: { index: row.status !== 'archived', follow: true },
    openGraph: {
      title: row.title,
      description,
      type: 'article',
      ...(image ? { images: [{ url: image }] } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title: row.title,
      description,
      ...(image ? { images: [image] } : {})
    }
  }
}

const EventDetailContent = async ({ params }: Props) => {
  await connection()
  const { strukturSlug, slug } = await params
  const result = await loadEvent(strukturSlug, slug)
  if (!result) notFound()
  if (result.redirect) permanentRedirect(`/events/${result.row.slug}`)
  const { row, identity, isNonActive } = result
  const [image, gallery] = await Promise.all([
    row.featuredImage ? resolveSiteImage(row.featuredImage) : '',
    resolveGalleryImages(row.galleryImages)
  ])
  return (
    <article className='mx-auto max-w-3xl px-6 py-10 lg:px-8'>
      {isNonActive ? (
        <div className='mb-8'>
          <p className='font-semibold'>{identity.name}</p>
          <p className='text-muted-foreground mt-2'>
            Kepengurusan Struktur ini sedang tidak berjalan. Event ini tetap
            tersedia sebagai arsip.
          </p>
        </div>
      ) : (
        <Link href='/events' className='text-primary text-sm hover:underline'>
          Semua Events
        </Link>
      )}
      <h1 className='font-heading mt-4 text-3xl font-bold sm:text-4xl'>
        {row.title}
      </h1>
      <div className='my-4 flex gap-2'>
        {row.eventCancelled && (
          <Badge variant='destructive'>Event Dibatalkan</Badge>
        )}
        {row.status === 'archived' && (
          <Badge variant='secondary'>Diarsipkan</Badge>
        )}
      </div>
      {image && (
        <Image
          src={image}
          alt={row.title}
          width={1000}
          height={1000}
          sizes='(min-width: 768px) 720px, 90vw'
          className='my-6 h-auto w-full rounded-3xl object-contain'
          unoptimized={image.startsWith('http')}
        />
      )}
      <dl className='my-8 grid gap-4 sm:grid-cols-2'>
        <div>
          <dt className='text-muted-foreground text-sm'>Waktu Mulai</dt>
          <dd className='mt-1 font-medium'>
            {formatEventDate(row.eventStartsAt!, row.eventTimezone!)}
          </dd>
        </div>
        {row.eventEndsAt && (
          <div>
            <dt className='text-muted-foreground text-sm'>Waktu Selesai</dt>
            <dd className='mt-1 font-medium'>
              {formatEventDate(row.eventEndsAt, row.eventTimezone!)}
            </dd>
          </div>
        )}
        <div>
          <dt className='text-muted-foreground text-sm'>Lokasi</dt>
          <dd className='mt-1 font-medium'>{row.eventLocation}</dd>
        </div>
      </dl>
      <ArticleBodyRenderer body={row.body} />
      {row.eventUrl && !row.eventCancelled && (
        <a
          href={row.eventUrl}
          className='bg-primary text-primary-foreground mt-8 inline-flex rounded-full px-6 py-3 font-semibold hover:opacity-90'
          target='_blank'
          rel='noopener noreferrer'
        >
          Informasi / Pendaftaran
        </a>
      )}
      {gallery.length > 0 && (
        <ImageGalleryGrid articleTitle={row.title} images={gallery} />
      )}
      <ArticleShareButtons title={row.title} />
    </article>
  )
}
const EventDetailPage = (props: Props) => (
  <Suspense
    fallback={<p className='text-muted-foreground px-6 py-10'>Memuat Event…</p>}
  >
    <EventDetailContent {...props} />
  </Suspense>
)
export default EventDetailPage
