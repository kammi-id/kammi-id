import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { articlePermalinkHistory } from '~/db/schema/article-permalink-history.sql'
import { organizationNotDeleted } from '~/db/query/organization'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Ticket 10 (Riwayat alamat Berita, ADR 0014). Dijaga TERPISAH dari
 * `article.ts` — tiket 07 (paralel) juga menyunting berkas itu, dan
 * memisahkan fungsi riwayat ke berkasnya sendiri di sini menghindarkan dua
 * sesi menabrak baris yang sama saat digabung.
 */
export const articlePermalinkHistoryQuery = {
  /**
   * Menyimpan satu Permalink LAMA. Dipanggil dari `article-form/action.ts`
   * SEBELUM `articleQuery.update` menimpa `slug`/`published_at` sebuah
   * Berita yang permalink-nya sudah pernah live (`wasPermalinkBeritaLive`) —
   * lihat komentar di `article-permalink-history.sql.ts` untuk kenapa
   * `old_tahun`/`old_bulan` tidak ikut jadi kunci pencarian.
   */
  record: async (values: typeof articlePermalinkHistory.$inferInsert) => {
    const [created] = await db
      .insert(articlePermalinkHistory)
      .values(values)
      .returning()
    return created
  },

  /**
   * Dipanggil HANYA di jalur "tidak ditemukan" halaman publik Permalink
   * Berita (`(main)/.../berita/[tahun]/[bulan]/[slug]/page.tsx`) — pembacaan
   * normal (lookup langsung by slug berhasil) tidak pernah menyentuh fungsi
   * ini sama sekali.
   *
   * Mengembalikan baris `article` SEGAR (bukan snapshot beku dari saat
   * riwayat ditulis) milik pemetaan riwayat TERBARU (`ORDER BY created_at
   * DESC LIMIT 1`) untuk `(organizationId, oldSlug)` — bukan baris riwayat
   * pertama yang cocok. Itulah yang membuat sebuah alamat lama yang dipakai
   * ulang oleh Berita LAIN (yang kemudian pindah lagi sendiri) tetap
   * melayani Berita yang benar-benar aktif sekarang, bukan pemilik lama
   * alamat itu (ticket 10).
   *
   * Pemanggil WAJIB menyaring ulang keadaan Terbit/Diarsipkan baris yang
   * dikembalikan (lihat `canonicalPermalinkForHistoryTarget` di
   * `_permalink-berita.ts`) — baris riwayat menjamin Berita tujuannya ADA,
   * bukan bahwa ia masih boleh dibaca publik saat ini.
   */
  findCurrentArticleForOldPermalink: async (
    organizationId: string,
    oldSlug: string
  ) => {
    const [row] = await db
      .select({ article })
      .from(articlePermalinkHistory)
      .innerJoin(article, eq(articlePermalinkHistory.articleId, article.id))
      .where(
        and(
          eq(articlePermalinkHistory.organizationId, organizationId),
          eq(articlePermalinkHistory.oldSlug, oldSlug),
          organizationNotDeleted(article.organizationId)
        )
      )
      .orderBy(desc(articlePermalinkHistory.createdAt))
      .limit(1)
    return row?.article
  }
}
