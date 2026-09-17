import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

/**
 * `/berita/<tahun>/<bulan>/<slug>`, tapi ABSOLUT ke host Situs Struktur
 * PENERBITNYA — beda dari `beritaPermalinkPath`/`beritaArsipPermalinkPath`
 * (relatif, benar hanya di bawah tenant yang sedang melayani). Sebuah kartu
 * Berita Jaringan tampil di Situs PP tapi harus mengantar ke Situs Struktur
 * penerbitnya (spec "Berita Jaringan"), jadi path saja tidak cukup.
 *
 * Komposisi `https://${host}${path}` sama persis dengan yang dipakai halaman
 * Permalink Berita untuk Open Graph image
 * (`berita/[tahun]/[bulan]/[slug]/page.tsx`) — `resolveStrukturHost` ada
 * justru untuk kasus ini: host Struktur yang BENAR, bukan host request yang
 * sedang menjawab (proxy sudah me-rewrite-nya, ADR 0012).
 */
export const beritaJaringanPermalinkUrl = (item: {
  slug: string
  publishedAt: Date
  organization: { type: string; slug: string }
}): string => {
  const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
  const path = `/berita/${tahun}/${String(bulan).padStart(2, '0')}/${item.slug}`
  return `https://${resolveStrukturHost(item.organization)}${path}`
}
