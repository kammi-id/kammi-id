import { ogImage, ogImageConfig } from '~/components/og-image'
import { resolveAbsoluteSiteImage } from '~/lib/utils/site-image'
import { formatTanggalTerbit } from '~/lib/publikasi/tanggal-terbit'
import { resolveOutcome, type BeritaDetailParams } from './page'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

type ImageProps = { params: BeritaDetailParams }

// `alt` STATIS, bukan `generateImageMetadata` (yang dipakai tiket 04 item 7
// untuk memberi setiap Artikel `alt` berisi judulnya sendiri).
//
// Sebab: kehadiran `generateImageMetadata` memindahkan rute gambar ini dari
// ƒ (Dynamic) ke ● (SSG) pada `next build` — Next memperlakukannya seperti
// `generateStaticParams` untuk segmen `[__metadata_id__]`. Begitu rutenya
// statis, SETIAP pembacaan IO tak-tercache di dalamnya (di sini: query DB
// lewat `resolveOutcome`) melempar `DYNAMIC_SERVER_USAGE` saat diminta, dan
// rutenya membalas `500 Internal Server Error` — kartu bagikan Artikel mati
// total di production, bukan sekadar kehilangan `alt`.
//
// `connection()` TIDAK bisa menyelamatkan: di dalam `generateImageMetadata`
// ia ditolak `next build` ("used `connection()` inside
// `generateStaticParams`"), dan di dalam komponen `Image` ia tidak lagi
// membuat rutenya dinamis begitu `generateImageMetadata` ada.
//
// Diverifikasi lewat rute repro minimal pada production build: dengan
// `generateImageMetadata` → ● dan 500; tanpa → ƒ dan 200 image/png.
//
// Mengembalikan `alt` per-Artikel menuntut seluruh pembacaan rute ini pindah
// ke `'use cache'` (+ `updateTag` saat Artikel disunting) supaya rutenya sah
// tetap prerender — pekerjaan tersendiri, bukan bagian dari perbaikan ini.
export const alt = 'KAMMI.id'

const Image = async ({ params }: ImageProps) => {
  const { articleRow, org, outcome } = await resolveOutcome(params)

  if (outcome?.kind !== 'ok' || !articleRow || !org) {
    return ogImage({ title: 'KAMMI.id', strukturName: 'KAMMI.id' })
  }

  const [logoUrl, imageUrl] = await Promise.all([
    resolveAbsoluteSiteImage(org.logo, org),
    resolveAbsoluteSiteImage(articleRow.featuredImage, org)
  ])

  return ogImage({
    title: articleRow.title,
    strukturName: org.name,
    logoUrl,
    imageUrl,
    publishedAt: articleRow.publishedAt
      ? formatTanggalTerbit(articleRow.publishedAt)
      : undefined
  })
}

export default Image
