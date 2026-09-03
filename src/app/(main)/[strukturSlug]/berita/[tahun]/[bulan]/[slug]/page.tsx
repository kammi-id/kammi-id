import { cache } from 'react'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound, permanentRedirect } from 'next/navigation'
import { resolveStrukturForPermalinkFromParams } from '~/app/(main)/_data/struktur'
import { getMetadataSettings } from '~/app/(main)/_data/site-settings'
import { articleQuery } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { articlePermalinkHistoryQuery } from '~/db/query/article-permalink-history'
import { readOrganization } from '~/db/query/organization'
import {
  resolveGalleryImages,
  resolveSiteImage,
  resolveAbsoluteSiteImage
} from '~/lib/utils/site-image'
import {
  formatTanggalTerbit,
  toWibIsoString
} from '~/lib/publikasi/tanggal-terbit'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import { deriveSummary, buildArticle, buildBreadcrumb } from '~/lib/seo'
import { ArticleBodyRenderer } from '~/components/article-body-renderer'
import { ImageGalleryGrid } from '~/components/image-gallery-grid'
import {
  resolvePermalinkBerita,
  buildPermalinkBerita,
  canonicalPermalinkForHistoryTarget
} from './_components/_permalink-berita'
import { InactiveStrukturPermalinkFrame } from './_components/inactive-struktur-permalink-frame'
import { ArticleShareButtons } from './_components/article-share-buttons'

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

// `cache()` React lagi — `generateMetadata` dan komponen halaman keduanya
// butuh kategori untuk `Ringkasan turunan` dan `articleSection` (tiket 03),
// dan berbagi satu lookup DB ketimbang menduplikasinya, sama seperti
// `loadBeritaBySlug`/`loadStrukturOrg` di atas.
const loadArticleCategory = cache(
  async (categoryId: string) => await articleCategoryQuery.getById(categoryId)
)

/**
 * Ringkasan turunan + tanggal Diubah efektif (tiket 03), dipakai baik oleh
 * `generateMetadata` maupun badan halaman — satu tempat supaya keduanya
 * selalu menampilkan angka dan teks yang sama persis.
 */
const resolveDescriptionAndDates = async (
  organizationId: string,
  articleRow: NonNullable<ResolvedOutcome['articleRow']>,
  org: NonNullable<ResolvedOutcome['org']>
) => {
  const [category, metadataSettings] = await Promise.all([
    articleRow.categoryId ? loadArticleCategory(articleRow.categoryId) : null,
    getMetadataSettings(organizationId)
  ])

  const description = deriveSummary(articleRow.body, {
    categoryName: category?.name ?? null,
    strukturName: org.name,
    strukturDescription: metadataSettings.metaDescription || null
  })

  // `outcome.kind === 'ok'` menjamin `publishedAt` terisi (resolvePermalinkBerita
  // menjawab 'not-found' selama itu kosong) — setiap pemanggil di bawah ini
  // hanya pernah dipanggil setelah gerbang itu lolos.
  const publishedAt = articleRow.publishedAt as Date
  const dateModified =
    articleRow.updatedAt.getTime() < publishedAt.getTime()
      ? publishedAt
      : articleRow.updatedAt

  return { category, description, publishedAt, dateModified }
}

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
  const { tahun, bulan, slug } = await params
  const { organizationId, articleRow, org, outcome } =
    await resolveOutcome(params)

  if (!organizationId || !articleRow || !org || outcome?.kind !== 'ok')
    return {}

  const { category, description, publishedAt, dateModified } =
    await resolveDescriptionAndDates(organizationId, articleRow, org)

  // `openGraph.images` sengaja TIDAK diisi di sini (beda dari sebelum ticket
  // 04): begitu kuncinya ada di objek ini — walau nilainya `undefined` —
  // Next tidak lagi menimpanya dengan output `opengraph-image.tsx` (lihat
  // `mergeStaticMetadata` di `next/dist/lib/metadata/resolve-metadata.js`,
  // yang mengecek `hasOwnProperty('images')`, bukan truthiness). Membiarkan
  // kunci ini kosong sepenuhnya membuat file convention di folder yang sama
  // yang menang — kartu bagimu bergambar penuh, bukan foto mentah.
  return {
    title: articleRow.title,
    description,
    // `outcome.kind === 'ok'` only when the requested tahun/bulan/slug are
    // already canonical (`resolvePermalinkBerita` redirects otherwise) — the
    // URL params themselves are the canonical path here.
    alternates: {
      canonical: `/berita/${tahun}/${bulan}/${slug}`,
      // Tiket 06 (ADR 0024, Salinan Markdown) — Next.js 16 menerima MIME
      // arbitrer di `alternates.types` tanpa kode kustom (sama seperti
      // `'application/rss+xml'` pada `/berita/page.tsx`).
      types: {
        'text/markdown': `/berita/${tahun}/${bulan}/${slug}.md`
      }
    },
    openGraph: {
      title: articleRow.title,
      description,
      type: 'article',
      publishedTime: toWibIsoString(publishedAt),
      modifiedTime: toWibIsoString(dateModified),
      ...(articleRow.penulis ? { authors: [articleRow.penulis] } : {}),
      ...(category ? { section: category.name } : {}),
      ...(articleRow.tags.length > 0 ? { tags: articleRow.tags } : {})
    },
    twitter: { description },
    robots: outcome.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true }
  }
}

const BeritaDetailPage = async ({ params }: BeritaDetailPageProps) => {
  await connection()
  const { tahun, bulan, slug } = await params
  const { organizationId, isNonActive, articleRow, org, outcome } =
    await resolveOutcome(params)

  if (!organizationId) notFound()
  if (!outcome || outcome.kind === 'not-found') notFound()
  if (outcome.kind === 'redirect') permanentRedirect(outcome.to)

  // outcome.kind === 'ok' dari sini — dan resolvePermalinkBerita hanya
  // menjawab 'ok' ketika `articleRow` ada dan `publishedAt`-nya terisi.
  if (!articleRow || !articleRow.publishedAt || !org) notFound()

  const { category, description, publishedAt, dateModified } =
    await resolveDescriptionAndDates(organizationId, articleRow, org)

  const imagePath = articleRow.featuredImage
    ? await resolveSiteImage(articleRow.featuredImage)
    : null

  const imageAbsoluteUrl = articleRow.featuredImage
    ? await resolveAbsoluteSiteImage(articleRow.featuredImage, org)
    : undefined

  const galleryImageUrls = await resolveGalleryImages(articleRow.galleryImages)

  const permalinkPath = buildPermalinkBerita(Number(tahun), Number(bulan), slug)
  const permalinkUrl = `https://${resolveStrukturHost(org)}${permalinkPath}`

  // Ticket 03: Berita ber-`noindex` (Struktur Non-Aktif, ADR 0013) tetap
  // memasang JSON-LD — `noindex` menyangkut pengindeksan, bukan penyangkalan
  // bahwa tulisannya pernah ada. Dirender sebelum `InactiveStrukturPermalinkFrame`
  // sengaja menutup navigasi internal, agar itu tidak menyentuh skrip ini.
  const jsonLdScripts = (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticle({
              headline: articleRow.title,
              description,
              ...(imageAbsoluteUrl ? { image: imageAbsoluteUrl } : {}),
              datePublished: toWibIsoString(publishedAt),
              dateModified: toWibIsoString(dateModified),
              ...(category ? { articleSection: category.name } : {}),
              keywords: articleRow.tags,
              url: permalinkUrl,
              publisher: { type: org.type, slug: org.slug },
              authorName: articleRow.penulis
            })
          )
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb(
              [
                { name: 'Beranda', url: '/' },
                { name: 'Berita', url: '/berita' },
                { name: articleRow.title, url: permalinkPath }
              ],
              org
            )
          )
        }}
      />
    </>
  )

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

      <ArticleShareButtons title={articleRow.title} />

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
    <>
      {jsonLdScripts}
      <InactiveStrukturPermalinkFrame organizationName={org.name}>
        {content}
      </InactiveStrukturPermalinkFrame>
    </>
  ) : (
    <>
      {jsonLdScripts}
      {content}
    </>
  )
}

export default BeritaDetailPage
