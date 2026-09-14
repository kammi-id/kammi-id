// Bebas efek samping (murni, tanpa DB/sesi) — sanksi AGENTS.md untuk berkas
// bergaris-bawah di akar `_components/`. Mengikuti pola
// `berita/[tahun]/[bulan]/[slug]/_components/_permalink-berita.ts` (tiket
// 05), disederhanakan: Halaman "tidak bertanggal" (CONTEXT.md) — tidak ada
// `publishedAt`, tidak ada gerbang Terbit berbasis tanggal, tidak ada
// tahun/bulan di alamatnya untuk dikanonikkan/dialihkan. Slug SENDIRI adalah
// seluruh alamatnya (`/<slug>`).

type ArticleLikeRow = {
  status: 'draft' | 'published' | 'archived'
}

export type PermalinkHalamanOutcome =
  | { kind: 'not-found' }
  | { kind: 'ok'; noindex: boolean }

/**
 * Aturan Permalink Halaman (tiket 09):
 *
 * - Tidak ada baris, atau draft → tidak ditemukan.
 * - Published → ok, terindeks.
 * - Diarsipkan → tetap melayani Permalink-nya (ia sudah pernah terbit),
 *   ditandai noindex — sama seperti Permalink Berita (ADR 0014's
 *   `resolvePermalinkBerita`).
 */
export const resolvePermalinkHalaman = (params: {
  article: ArticleLikeRow | undefined
}): PermalinkHalamanOutcome => {
  const { article } = params

  if (!article) return { kind: 'not-found' }
  if (article.status === 'draft') return { kind: 'not-found' }

  return { kind: 'ok', noindex: article.status === 'archived' }
}
