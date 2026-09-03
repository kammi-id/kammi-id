import { cache } from 'react'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound, permanentRedirect } from 'next/navigation'
import { resolveStrukturForPermalinkFromParams } from '~/app/(main)/_data/struktur'
import { articleQuery } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { articlePermalinkHistoryQuery } from '~/db/query/article-permalink-history'
import { readOrganization } from '~/db/query/organization'
import { resolveGalleryImages, resolveSiteImage } from '~/lib/utils/site-image'
import {
  formatTanggalTerbit,
  toWibIsoString
} from '~/lib/publikasi/tanggal-terbit'
import { ArticleBodyRenderer } from '~/components/article-body-renderer'
import { ImageGalleryGrid } from '~/components/image-gallery-grid'
import {
  resolvePermalinkBerita,
  canonicalPermalinkForHistoryTarget
} from './_components/_permalink-berita'
import { InactiveStrukturPermalinkFrame } from './_components/inactive-struktur-permalink-frame'

// Halaman ini WAJIB dinamis (request-time), bukan statik: badan tulisan
// dirender dari dokumen tersimpan pada saat request (bukan dibekukan saat
// terbit), dan gerbang Terbit membandingkan tanggal terbit terhadap "sekarang"
// — sebuah Berita terjadwal harus mulai terbaca begitu tanggalnya lewat,
// tanpa menunggu revalidasi cache. `connection()` menandai ini eksplisit ke
// Cache Components, mengikuti pola yang sama dengan
// `dashboard/branches/[[...slug]]/page.tsx`.
//
// Tidak perlu `instant = false` di sini sendiri — `[strukturSlug]/layout.tsx`
// sudah menyatakannya untuk seluruh subtree (satu titik menutup semua rute
// turunannya, lihat komentar di sana).

export type BeritaDetailParams = Promise<{
  strukturSlug: string
  tahun: string
  bulan: string
  slug: string
}>

type BeritaDetailPageProps = {
  params: BeritaDetailParams
}

// `cache()` React membuat `generateMetadata` dan komponen halaman berbagi
// satu round-trip DB per request alih-alih dua, tanpa menaruh 'use cache'
// pada data yang justru wajib segar tiap request.
const loadBeritaBySlug = cache(
  async (organizationId: string, slug: string) =>
    await articleQuery.getBlogArticleBySlug(organizationId, slug)
)

const loadStrukturOrg = cache(async (organizationId: string) => {
  const [org] = await readOrganization({ id: [organizationId] })
  return org
})

type ResolvedOutcome = {
  organizationId: string | null
  isNonActive: boolean
  articleRow: Awaited<ReturnType<typeof loadBeritaBySlug>> | undefined
  org: Awaited<ReturnType<typeof loadStrukturOrg>> | undefined
  outcome: ReturnType<typeof resolvePermalinkBerita> | null
}

// Exported juga untuk `opengraph-image.tsx` (ticket 04, kartu bagikan) —
// keduanya butuh persis Artikel + Struktur yang sama, jadi dipanggil dari
// satu tempat alih-alih menduplikasi query DB-nya di berkas metadata rute.
export const resolveOutcome = async (
  params: BeritaDetailParams
): Promise<ResolvedOutcome> => {
  const { tahun, bulan, slug } = await params
  const struktur = await resolveStrukturForPermalinkFromParams(params)
  if (!struktur) {
    return {
      organizationId: null,
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: null
    }
  }

  const { id: organizationId, isNonActive } = struktur

  const [articleRow, org] = await Promise.all([
    loadBeritaBySlug(organizationId, slug),
    loadStrukturOrg(organizationId)
  ])

  let outcome = resolvePermalinkBerita({
    requestedTahun: tahun,
    requestedBulan: bulan,
    slug,
    article: articleRow ?? undefined
  })

  // Ticket 10 (Riwayat alamat Berita, ADR 0014): riwayat HANYA disentuh di
  // jalur tidak-ditemukan di atas — lookup langsung by slug yang berhasil
  // (outcome 'ok' atau 'redirect' kanonik) tidak pernah query tabel riwayat
  // sama sekali.
  if (outcome.kind === 'not-found') {
    const historyTarget =
      await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
        organizationId,
        slug
      )
    const to = historyTarget
      ? canonicalPermalinkForHistoryTarget(historyTarget)
      : null
    if (to) outcome = { kind: 'redirect', to }
  }

  return { organizationId, isNonActive, articleRow, org, outcome }
}

export const generateMetadata = async ({
  params
}: BeritaDetailPageProps): Promise<Metadata> => {
  await connection()
  const { organizationId, articleRow, org, outcome } =
    await resolveOutcome(params)

  if (!organizationId || !articleRow || !org || outcome?.kind !== 'ok')
    return {}

  // `openGraph.images` sengaja TIDAK diisi di sini (beda dari sebelum ticket
  // 04): begitu kuncinya ada di objek ini — walau nilainya `undefined` —
  // Next tidak lagi menimpanya dengan output `opengraph-image.tsx` (lihat
  // `mergeStaticMetadata` di `next/dist/lib/metadata/resolve-metadata.js`,
  // yang mengecek `hasOwnProperty('images')`, bukan truthiness). Membiarkan
  // kunci ini kosong sepenuhnya membuat file convention di folder yang sama
  // yang menang — kartu bagimu bergambar penuh, bukan foto mentah.
  return {
    title: articleRow.title,
    description: `Berita dari ${org.name}`,
    openGraph: {
      title: articleRow.title,
      description: `Berita dari ${org.name}`,
      type: 'article'
    },
    robots: outcome.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true }
  }
}

const BeritaDetailPage = async ({ params }: BeritaDetailPageProps) => {
  await connection()
  const { organizationId, isNonActive, articleRow, org, outcome } =
    await resolveOutcome(params)

  if (!organizationId) notFound()
  if (!outcome || outcome.kind === 'not-found') notFound()
  if (outcome.kind === 'redirect') permanentRedirect(outcome.to)

  // outcome.kind === 'ok' dari sini — dan resolvePermalinkBerita hanya
  // menjawab 'ok' ketika `articleRow` ada dan `publishedAt`-nya terisi.
  if (!articleRow || !articleRow.publishedAt || !org) notFound()

  const category = articleRow.categoryId
    ? await articleCategoryQuery.getById(articleRow.categoryId)
    : null

  const imagePath = articleRow.featuredImage
    ? await resolveSiteImage(articleRow.featuredImage)
    : null

  const galleryImageUrls = await resolveGalleryImages(articleRow.galleryImages)

  const content = (
    <article className='mx-auto max-w-3xl px-6 py-16 lg:px-8'>
      {category && (
        <span className='text-primary mb-4 inline-block text-sm font-semibold tracking-wide uppercase'>
          {category.name}
        </span>
      )}

      <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
        {articleRow.title}
      </h1>

      <div className='text-muted-foreground mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
        <time dateTime={toWibIsoString(articleRow.publishedAt)}>
          {formatTanggalTerbit(articleRow.publishedAt)}
        </time>
        {articleRow.penulis && (
          <>
            <span aria-hidden='true'>&middot;</span>
            <span>{articleRow.penulis}</span>
          </>
        )}
        <span aria-hidden='true'>&middot;</span>
        <span>{org.name}</span>
      </div>

      {imagePath && (
        // eslint-disable-next-line @next/next/no-img-element -- gambar utama tidak berdimensi tetap yang diketahui sebelum render.
        <img
          src={imagePath}
          alt={articleRow.title}
          className='mt-8 aspect-video w-full rounded-2xl object-cover'
        />
      )}

      <div className='mt-8'>
        <ArticleBodyRenderer body={articleRow.body} />
      </div>

      <ImageGalleryGrid
        images={galleryImageUrls}
        articleTitle={articleRow.title}
      />
    </article>
  )

  return isNonActive ? (
    <InactiveStrukturPermalinkFrame organizationName={org.name}>
      {content}
    </InactiveStrukturPermalinkFrame>
  ) : (
    content
  )
}

export default BeritaDetailPage
