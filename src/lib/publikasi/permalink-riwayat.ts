import { deriveTahunBulanTerbit, isTerbit } from './tanggal-terbit'

/**
 * Ticket 10 (Riwayat alamat Berita, ADR 0014). Dua pembantu murni yang
 * dipakai jalur TULIS (`article-form/action.ts`, di rute dasbor) untuk
 * memutuskan kapan sebuah penyuntingan wajib meninggalkan jejak riwayat
 * sebelum menimpa `slug`/`published_at` sebuah Berita.
 *
 * Sengaja tidak hidup di `_permalink-berita.ts` (folder `_components/`
 * halaman publik `(main)/.../[slug]/`) — AGENTS.md melarang impor lintas
 * rute yang menembus folder `_components/` rute lain, dan berkas TULIS ini
 * dipanggil dari rute `(dashboard)`. `src/lib/` tidak terikat aturan itu.
 */

export type ArticlePermalinkState = {
  type: 'page' | 'blog'
  status: 'draft' | 'published' | 'archived'
  slug: string
  publishedAt: Date | null
}

/**
 * Sebuah Permalink Berita LAMA layak dilindungi riwayat hanya kalau ia
 * pernah benar-benar bisa dibaca publik: Terbit (published DAN tanggalnya
 * sudah lewat) atau Diarsipkan (yang tetap melayani Permalink-nya menurut
 * CONTEXT.md — tidak disaring tanggal, sama seperti `resolvePermalinkBerita`
 * di jalur baca). Draft dan terjadwal (published tapi belum lewat
 * tanggalnya) tidak pernah punya alamat publik yang bisa "telanjur tersebar"
 * — tidak ada yang perlu dilindungi. Halaman (`type: 'page'`) di luar skema
 * Permalink ini sama sekali.
 */
export const wasPermalinkBeritaLive = (
  before: ArticlePermalinkState,
  now: Date = new Date()
): boolean => {
  if (before.type !== 'blog') return false
  if (!before.publishedAt) return false
  if (before.status === 'archived') return true
  if (before.status === 'published') return isTerbit(before.publishedAt, now)
  return false
}

export type PermalinkBeritaSlice = { slug: string; publishedAt: Date }

/**
 * Membandingkan bentuk Permalink LAMA vs BARU lewat komponen yang benar-benar
 * menyusunnya (ADR 0014: slug berkuasa, tahun/bulan murni turunan tanggal
 * terbit) — bukan membandingkan `publishedAt` mentah. Menggeser tanggal
 * terbit dalam bulan Asia/Jakarta yang sama TIDAK mengubah Permalink;
 * melompat ke bulan atau tahun lain, atau mengubah slug, MENGUBAHnya.
 */
export const permalinkBeritaBerubah = (
  before: PermalinkBeritaSlice,
  after: PermalinkBeritaSlice
): boolean => {
  if (before.slug !== after.slug) return true
  const beforeDerived = deriveTahunBulanTerbit(before.publishedAt)
  const afterDerived = deriveTahunBulanTerbit(after.publishedAt)
  return (
    beforeDerived.tahun !== afterDerived.tahun ||
    beforeDerived.bulan !== afterDerived.bulan
  )
}
