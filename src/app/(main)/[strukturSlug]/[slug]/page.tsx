import { cache } from 'react'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { resolveStrukturIdFromParams } from '~/app/(main)/_data/struktur'
import { articleQuery } from '~/db/query/article'
import { ArticleBodyRenderer } from '~/components/article-body-renderer'
import { ImageGalleryGrid } from '~/components/image-gallery-grid'
import { resolveGalleryImages } from '~/lib/utils/site-image'
import { resolvePermalinkHalaman } from './_components/_permalink-halaman'

// Tiket 09 (Halaman beralamat akar). Mengikuti pola halaman Permalink
// Berita (`berita/[tahun]/[bulan]/[slug]/page.tsx`, tiket 05) tapi
// disederhanakan: Halaman tidak bertanggal, jadi tidak ada gerbang Terbit
// berbasis tanggal dan tidak ada tahun/bulan untuk dikanonikkan. Halaman ini
// WAJIB dinamis (request-time), bukan statik — `connection()` menandainya
// eksplisit ke Cache Components, sama seperti halaman Permalink Berita.
//
// `RESERVED_STRUKTUR_PATHS` (`~/lib/struktur/reserved-paths`) menjamin
// segmen ini tidak pernah menutupi rute statis yang sudah ada (`berita`,
// `tentang`, `event`, dst.) — dijaga saat SIMPAN (`ArticleInputSchema`
// menolak slug yang bertabrakan), bukan di sini. Next.js App Router sendiri
// yang memenangkan segmen statis di atas `[slug]` pada level yang sama.
//
// Tidak perlu `instant = false` di sini sendiri — `[strukturSlug]/layout.tsx`
// sudah menyatakannya untuk seluruh subtree (satu titik menutup semua rute
// turunannya, lihat komentar di sana).

type HalamanDetailParams = Promise<{ strukturSlug: string; slug: string }>

type HalamanDetailPageProps = {
  params: HalamanDetailParams
}

const loadHalamanBySlug = cache(
  async (organizationId: string, slug: string) =>
    await articleQuery.getPageArticleBySlug(organizationId, slug)
)

type ResolvedOutcome = {
  organizationId: string | null
  articleRow: Awaited<ReturnType<typeof loadHalamanBySlug>> | undefined
  outcome: ReturnType<typeof resolvePermalinkHalaman> | null
}

const resolveOutcome = async (
  params: HalamanDetailParams
): Promise<ResolvedOutcome> => {
  const { slug } = await params
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) {
    return { organizationId: null, articleRow: undefined, outcome: null }
  }

  const articleRow = await loadHalamanBySlug(organizationId, slug)
  const outcome = resolvePermalinkHalaman({ article: articleRow ?? undefined })

  return { organizationId, articleRow, outcome }
}

export const generateMetadata = async ({
  params
}: HalamanDetailPageProps): Promise<Metadata> => {
  await connection()
  const { slug } = await params
  const { organizationId, articleRow, outcome } = await resolveOutcome(params)

  if (!organizationId || !articleRow || outcome?.kind !== 'ok') return {}

  return {
    title: articleRow.title,
    alternates: { canonical: `/${slug}` },
    robots: outcome.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true }
  }
}

const HalamanDetailPage = async ({ params }: HalamanDetailPageProps) => {
  await connection()
  const { organizationId, articleRow, outcome } = await resolveOutcome(params)

  if (!organizationId) notFound()
  if (!outcome || outcome.kind === 'not-found') notFound()

  // outcome.kind === 'ok' dari sini — dan resolvePermalinkHalaman hanya
  // menjawab 'ok' ketika `articleRow` ada.
  if (!articleRow) notFound()

  const galleryImageUrls = await resolveGalleryImages(articleRow.galleryImages)

  return (
    <article className='mx-auto max-w-3xl px-6 py-16 lg:px-8'>
      <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
        {articleRow.title}
      </h1>

      <div className='mt-8'>
        <ArticleBodyRenderer body={articleRow.body} />
      </div>

      <ImageGalleryGrid
        images={galleryImageUrls}
        articleTitle={articleRow.title}
      />
    </article>
  )
}

export default HalamanDetailPage
