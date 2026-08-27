import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

export { buildPaginationItems } from '~/lib/utils/pagination'

/**
 * `/berita/<tahun>/<bulan>/<slug>`, ABSOLUT ke host Situs Struktur
 * penerbitnya — sama alasan dan komposisi persis dengan
 * `berita-jaringan-section/utils.ts`'s `beritaJaringanPermalinkUrl` (kartu
 * arsip ini tampil di Situs PP tapi harus mengantar ke Situs Struktur
 * penerbitnya, ADR 0012). Duplikat sengaja, bukan dipromosikan jadi berkas
 * bersama — mengikuti preseden `beritaPermalinkPath`/`beritaArsipPermalinkPath`
 * (tiket 07, "duplikasi kecil ... dibiarkan sebagai judgement call").
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

/**
 * Page 1 stays at the bare `/berita/jaringan` — no `?page=1` noise. Anything
 * below 1 clamps to the same bare path. Mirrors `beritaArsipPageHref`
 * (`berita-archive/utils.ts`), pointed at this archive's own address.
 */
export const beritaJaringanPageHref = (page: number): string =>
  page <= 1 ? '/berita/jaringan' : `/berita/jaringan?page=${page}`
