// Logika murni form Artikel: autogenerate Permalink dari Judul, dan kapan ia
// membeku (issue 04). Terpisah dari `article-form.tsx` supaya kedua aturan
// ini testable tanpa merender form.

// Sama persis dengan `article-category-manager`'s slugify — pengulangan
// enam baris ini disengaja, bukan diekstrak ke `src/lib/` (yang punya
// konvensi flat sendiri) untuk dua pemanggil kecil yang kebetulan mirip.
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export type ArticlePernahTerbitInput = {
  type: 'page' | 'blog'
  status: 'draft' | 'published' | 'archived'
  publishedAt: Date | null
}

/**
 * Permalink hanya boleh autogenerate dari Judul selagi artikel BELUM PERNAH
 * Terbit (issue 04, ADR 0014). Begitu benar-benar sempat terbaca publik, ia
 * beku — hanya berubah lewat aksi manual yang disengaja.
 *
 * "Terbit" beda makna per tipe:
 * - **Halaman** (`type: 'page'`) tak bertanggal (CONTEXT.md) — begitu
 *   `status` pernah 'published' atau 'archived', alamatnya sudah pernah bisa
 *   dibaca publik.
 * - **Berita** (`type: 'blog'`) mengikuti definisi ADR 0014 yang sama dengan
 *   `wasPermalinkBeritaLive` (~/lib/publikasi/permalink-riwayat): 'archived'
 *   selalu terhitung pernah Terbit; 'published' terhitung hanya kalau
 *   `publishedAt`-nya sudah lewat — draft dan terjadwal-di-masa-depan belum
 *   pernah punya alamat publik yang perlu dibekukan.
 */
export const articlePernahTerbit = (
  article: ArticlePernahTerbitInput,
  now: Date = new Date()
): boolean => {
  if (article.type === 'page')
    return article.status === 'published' || article.status === 'archived'

  if (article.status === 'archived') return true
  if (article.status === 'published')
    return article.publishedAt !== null && article.publishedAt <= now
  return false
}
