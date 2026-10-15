import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { formatTanggalTerbit } from '~/lib/publikasi/tanggal-terbit'
import { getBeritaArsip } from './data'
import { beritaArsipPermalinkPath } from './utils'
import { BeritaArchivePagination } from './berita-archive-pagination'

type BeritaArchiveProps = {
  organizationId: string
  page: number
}

/**
 * `/berita` — the full chronological Berita archive for one Situs Struktur
 * (ticket 07). `getBeritaArsip` computes `totalCount`/`totalPages` in the
 * same query as the page of rows (window function, see
 * `~/db/query/article.ts`'s `listBeritaArsipForOrg`) — a page beyond the
 * last one legitimately comes back with zero rows *and* no way to recover
 * `totalPages` from that response (the count travels on the rows LIMIT/OFFSET
 * just discarded). Zero rows on `page > 1` is therefore treated as an
 * out-of-range page number (`notFound()`); zero rows on page 1 means this
 * Struktur genuinely has no Berita Terbit yet.
 */
export const BeritaArchive = async ({
  organizationId,
  page
}: BeritaArchiveProps) => {
  const result = await getBeritaArsip(organizationId, page)

  if (result.items.length === 0) {
    if (page > 1) notFound()

    return (
      <div className='mx-auto max-w-3xl px-6 py-24 text-center lg:px-8'>
        <p className='text-muted-foreground font-sans text-base'>
          Belum ada Berita yang terbit dari Struktur ini.
        </p>
      </div>
    )
  }

  const resolved = await Promise.all(
    result.items.map(async (item) => ({
      ...item,
      resolvedImageUrl: item.featuredImage
        ? await resolveSiteImage(item.featuredImage)
        : ''
    }))
  )

  return (
    <div className='mx-auto w-full max-w-7xl px-6 py-12 lg:px-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {resolved.map((item) => (
          <Link
            key={item.id}
            href={beritaArsipPermalinkPath(item)}
            className='group border-border/60 bg-background ring-foreground/5 overflow-hidden rounded-3xl border shadow-sm ring-1 transition-shadow hover:shadow-md'
          >
            <div className='bg-muted relative aspect-[4/3] w-full overflow-hidden'>
              {item.resolvedImageUrl ? (
                <Image
                  src={item.resolvedImageUrl}
                  alt={item.title}
                  fill
                  sizes='(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
                  className='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                  unoptimized={item.resolvedImageUrl.startsWith('http')}
                />
              ) : (
                <div className='bg-foreground/10 absolute inset-0' />
              )}
            </div>
            <div className='p-4'>
              {item.category && (
                <span className='text-primary mb-1.5 inline-block font-sans text-xs font-semibold tracking-wide uppercase'>
                  {item.category.name}
                </span>
              )}
              <p className='text-muted-foreground font-sans text-xs font-medium'>
                {formatTanggalTerbit(item.publishedAt)}
              </p>
              <h3 className='font-heading text-foreground mt-1.5 line-clamp-2 text-base leading-snug font-bold'>
                {item.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {result.totalPages > 1 && (
        <BeritaArchivePagination
          currentPage={page}
          totalPages={result.totalPages}
        />
      )}
    </div>
  )
}
