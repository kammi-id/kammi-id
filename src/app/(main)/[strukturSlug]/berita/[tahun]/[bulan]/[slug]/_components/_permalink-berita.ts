import {
  deriveTahunBulanTerbit,
  isTerbit
} from '~/lib/publikasi/tanggal-terbit'

// Bebas efek samping (murni, tanpa DB/sesi) — sanksi AGENTS.md untuk berkas
// bergaris-bawah di akar `_components/`. Halaman `page.tsx` yang memanggilnya
// sudah membawa baris Berita (lewat `articleQuery.getBlogArticleBySlug`,
// yang SENGAJA tidak menyaring status/tanggal) — seluruh aturan Terbit dan
// pengalihan kanonik hidup di sini, satu tempat, teruji lepas dari DB.

const pad2 = (n: number): string => String(n).padStart(2, '0')

export const buildPermalinkBerita = (
  tahun: number,
  bulan: number,
  slug: string
): string => `/berita/${tahun}/${pad2(bulan)}/${slug}`

type ArticleLikeRow = {
  status: 'draft' | 'published' | 'archived'
  publishedAt: Date | null
}

export type PermalinkBeritaOutcome =
  | { kind: 'not-found' }
  | { kind: 'redirect'; to: string }
  | { kind: 'ok'; noindex: boolean }

/**
 * Aturan lengkap Permalink Berita (ticket 05, ADR 0014), murni:
 *
 * - Tidak ada baris, atau draft, atau (Terbit tapi tanggalnya belum lewat) →
 *   tidak ditemukan. "Terbit" menuntut DUA hal — dinyatakan terbit DAN
 *   tanggalnya sudah lewat (spec §"Artikel di permukaan publik").
 * - Diarsipkan selalu melayani Permalink-nya, ditandai noindex — tidak
 *   disaring tanggal (ia sudah pernah terbit; itu prasyarat untuk sampai ke
 *   status ini).
 * - Tahun/bulan pada URL yang tidak kanonik (dibanding yang diturunkan dari
 *   `publishedAt` lewat `deriveTahunBulanTerbit`) → pengalihan permanen ke
 *   bentuk kanoniknya. Slug SENDIRI yang menentukan baris mana yang dilayani
 *   — tahun/bulan murni kosmetik (ADR 0014).
 */
export const resolvePermalinkBerita = (params: {
  requestedTahun: string
  requestedBulan: string
  slug: string
  article: ArticleLikeRow | undefined
  now?: Date
}): PermalinkBeritaOutcome => {
  const { requestedTahun, requestedBulan, slug, article, now } = params

  if (!article) return { kind: 'not-found' }
  if (article.status === 'draft') return { kind: 'not-found' }
  if (!article.publishedAt) return { kind: 'not-found' }

  if (article.status === 'published' && !isTerbit(article.publishedAt, now)) {
    return { kind: 'not-found' } // terjadwal — tanggal terbitnya belum lewat
  }

  const { tahun, bulan } = deriveTahunBulanTerbit(article.publishedAt)
  const isCanonical =
    requestedTahun === String(tahun) && requestedBulan === pad2(bulan)

  if (!isCanonical) {
    return { kind: 'redirect', to: buildPermalinkBerita(tahun, bulan, slug) }
  }

  return { kind: 'ok', noindex: article.status === 'archived' }
}
