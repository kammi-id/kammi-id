import Image from 'next/image'
import { notFound } from 'next/navigation'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { formatTanggalTerbit } from '~/lib/publikasi/tanggal-terbit'
import { getBeritaJaringan } from './data'
import { beritaJaringanPermalinkUrl } from './utils'
import { BeritaJaringanArchivePagination } from './berita-jaringan-archive-pagination'

type BeritaJaringanArchiveProps = {
  page: number
}

/**
 * `/berita/jaringan` — arsip nasional lintas Struktur (ticket 08), padanan
 * `BeritaArchive` (`berita-archive/berita-archive.tsx`) tapi tanpa
 * `organizationId` (network-wide) dan dengan nama Struktur pada tiap kartu +
 * tautan absolut ke Situs penerbitnya. Pembedaan nol-baris-`page`-1
 * vs-nol-baris-`page`-di-luar-jangkauan mengikuti alasan yang sama:
 * `count(*) over()` cuma ikut baris yang benar-benar kembali.
 */
export const BeritaJaringanArchive = async ({
  page
}: BeritaJaringanArchiveProps) => {
  const result = await getBeritaJaringan(page)

  if (result.items.length === 0) {
    if (page > 1) notFound()

    return (
      <div className='mx-auto max-w-3xl px-6 py-24 text-center lg:px-8'>
        <p className='text-muted-foreground font-sans text-base'>
          Belum ada Berita yang terbit dari jaringan Struktur.
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
          <a
            key={item.id}
            href={beritaJaringanPermalinkUrl(item)}
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
              <span className='text-primary mb-1.5 inline-block font-sans text-xs font-semibold tracking-wide uppercase'>
                {item.organization.name}
              </span>
              <p className='text-muted-foreground font-sans text-xs font-medium'>
                {formatTanggalTerbit(item.publishedAt)}
              </p>
              <h3 className='font-heading text-foreground mt-1.5 line-clamp-2 text-base leading-snug font-bold'>
                {item.title}
              </h3>
            </div>
          </a>
        ))}
      </div>

      {result.totalPages > 1 && (
        <BeritaJaringanArchivePagination
          currentPage={page}
          totalPages={result.totalPages}
        />
      )}
    </div>
  )
}
