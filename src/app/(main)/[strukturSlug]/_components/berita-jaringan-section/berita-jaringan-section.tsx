import Image from 'next/image'
import Link from 'next/link'
import { getBeritaJaringanPreview } from './data'
import { beritaJaringanPermalinkUrl } from './utils'
import { resolveSiteImage } from '~/lib/utils/site-image'

/**
 * "Bagian Berita KAMMI se-Indonesia" — spec "Template Situs": 12 Berita
 * terbaru dari seluruh Struktur, hanya di Beranda PP (page.tsx merender ini
 * di dalam cabang `lengkap`, jadi kondisinya sudah Jenjang, bukan route —
 * ADR 0012).
 *
 * Istilah ini dulu bernama "Berita Jaringan" (ADR 0016). Nama lama sengaja
 * masih hidup di nama berkas, nama fungsi, cache tag, dan index basis data:
 * yang di-rename hanyalah istilah domain dan apa yang dibaca pembaca.
 *
 * Tautan tiap kartu ABSOLUT ke Situs Struktur penerbitnya, bukan `next/link`
 * relatif — beda origin dari Situs PP yang sedang melayani.
 */
export const BeritaJaringanSection = async () => {
  const items = await getBeritaJaringanPreview()
  if (items.length === 0) return null

  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      resolvedImageUrl: item.featuredImage
        ? await resolveSiteImage(item.featuredImage)
        : ''
    }))
  )

  return (
    <section
      className='bg-background relative w-full py-20 md:py-28'
      aria-labelledby='berita-jaringan-heading'
    >
      <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
        <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end'>
          <div>
            <h2
              id='berita-jaringan-heading'
              className='font-heading text-foreground text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
            >
              Berita KAMMI se-Indonesia
            </h2>
            <p className='text-muted-foreground mt-2 font-sans text-sm'>
              Kegiatan KAMMI se-Indonesia
            </p>
          </div>
          <Link
            href='/berita/seindonesia'
            className='group text-primary inline-flex shrink-0 items-center gap-2 font-sans text-sm font-semibold hover:underline'
          >
            Lihat Semua Berita se-Indonesia
            <svg
              className='size-4 transition-transform group-hover:translate-x-0.5'
              viewBox='0 0 16 16'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M3 8h10M9 4l4 4-4 4'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Link>
        </div>

        <div className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
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
                  {new Date(item.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                  })}
                </p>
                <h3 className='font-heading text-foreground mt-1.5 line-clamp-2 text-base leading-snug font-bold'>
                  {item.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
