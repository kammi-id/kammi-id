import { pgTable, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { article } from './article.sql'
import { organization } from './organization.sql'

/**
 * Riwayat alamat Berita (ticket 10, ADR 0014). Satu baris = satu Permalink
 * LAMA yang pernah sah untuk sebuah Berita Terbit/Diarsipkan, ditulis SEBELUM
 * `slug` atau `published_at`-nya diubah lewat form (lihat
 * `article-form/action.ts`) — supaya alamat yang telanjur tersebar tetap
 * mengantar ke bentuk kanonik yang baru lewat pengalihan permanen.
 *
 * Pola dan gaya kolom meniru `organization-history.sql.ts` (jejak, bukan
 * tabel riwayat penuh bertanggal mulai/selesai) — di sini jejaknya adalah
 * "alamat apa yang dulu berlaku, menunjuk ke Berita mana".
 *
 * `article_id` SENGAJA `onDelete: 'cascade'` — Berita di sini dihapus keras
 * (lihat `delete-article-button/action.ts`, `articleQuery.delete`), dan
 * riwayat alamat yang menunjuk ke Berita yang sudah tiada bukan riwayat,
 * cuma sampah.
 *
 * `old_tahun`/`old_bulan` disimpan untuk audit (supaya baris ini terbaca
 * manusia sebagai "alamat lama ini pernah begini") meski TIDAK ikut jadi
 * kunci pencarian jalur baca — ADR 0014 menegaskan tahun/bulan murni
 * kosmetik, jadi pencarian riwayat pun cukup mencocokkan `organization_id` +
 * `old_slug` saja (lihat `article-permalink-history.ts`,
 * `findCurrentArticleForOldPermalink`). Mencocokkan tahun/bulan juga di sana
 * akan membuat Berita yang sekaligus menggeser tanggal DAN dipakai ulang
 * slug lamanya oleh Berita lain gagal ditemukan lewat slug-nya — persis opsi
 * yang ADR 0014 tolak.
 */
export const articlePermalinkHistory = pgTable(
  'article_permalink_history',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    articleId: t
      .uuid('article_id')
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    oldSlug: t.text('old_slug').notNull(),
    oldTahun: t.integer('old_tahun').notNull(),
    oldBulan: t.integer('old_bulan').notNull(),
    createdAt: t
      .timestamp('created_at')
      .default(sql`now()`)
      .notNull()
  }),
  (table) => [
    index('article_permalink_history_lookup_idx').on(
      table.organizationId,
      table.oldSlug
    )
  ]
)
