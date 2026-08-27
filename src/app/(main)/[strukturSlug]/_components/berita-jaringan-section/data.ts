import { cacheLife, cacheTag } from 'next/cache'
import {
  listLatestBeritaJaringan,
  type BeritaJaringanItem
} from '~/db/query/article'

/**
 * Beranda PP's "Berita Jaringan" section (spec "Template Situs") — 12
 * terbaru lintas Struktur.
 *
 * Tag `berita-jaringan` terpisah dari `article-<idStruktur>` yang dipakai
 * bagian per-Struktur (ADR 0012: "penandaan cache per-Struktur menjadi
 * tanggung jawab penulis kode") — surface ini tidak dimiliki satu
 * organizationId, jadi mem-bust satu tag per-Struktur di sini tidak berarti
 * apa-apa. Broad tag `articles` dipertahankan untuk alasan yang sama seperti
 * `berita-preview-section`/`berita-archive`: itu satu-satunya yang sudah
 * dibust setiap publish Berita hari ini.
 *
 * ADR 0013 menuntut lebih: perubahan Keadaan Struktur (nonaktif/aktif/hapus)
 * dan sakelar Situs Aktif ikut mem-bust `berita-jaringan` — lihat
 * `updateTag('berita-jaringan')` di action Kestrukturan dan Situs Aktif.
 */
export const getBeritaJaringanPreview = async (): Promise<
  BeritaJaringanItem[]
> => {
  'use cache'
  cacheLife('days')
  cacheTag('articles', 'berita-jaringan')

  try {
    return await listLatestBeritaJaringan(12)
  } catch {
    return []
  }
}
