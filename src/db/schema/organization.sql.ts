import {
  pgTable,
  unique,
  uniqueIndex,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'
import { isNull, sql, type SQL } from 'drizzle-orm'
import { user } from './user.sql'

export const organization = pgTable(
  'organization',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    name: t.text().notNull(),
    slug: t.text().notNull(),
    code: t.text().notNull(),
    codeSlug: t
      .text('code_slug')
      .generatedAlwaysAs((): SQL => sql`replace(lower(${sql`code`}), '.', '-')`)
      .notNull(),
    type: t.text({ enum: ['pp', 'pw', 'pdln', 'pd', 'pk'] }).notNull(),
    level: t
      .integer()
      .generatedAlwaysAs(
        (): SQL =>
          sql`CASE
          WHEN type = 'pp' THEN 1
          WHEN type = 'pw' THEN 2
          WHEN type IN ('pd', 'pdln') THEN 3
          WHEN type = 'pk' THEN 4
          ELSE NULL
        END`
      )
      .notNull(),
    logo: t.text(),
    parentId: t
      .uuid('parent_id')
      .references((): AnyPgColumn => organization.id),
    isNonActive: t.boolean('is_non_active').default(false).notNull(),
    // Jejak, bukan tabel riwayat penuh. Preseden Kader (`member.sql.ts`) cuma
    // punya `deleted_at`; Struktur beda taruhannya, jadi `*_by` ikut dipasang.
    //
    // Keduanya sengaja NO ACTION, bukan `onDelete: 'set null'`: jejak yang bisa
    // dikosongkan diam-diam oleh penghapusan baris lain bukan jejak. Harganya,
    // baris `user` yang pernah menghapus atau menonaktifkan sebuah Struktur tidak
    // bisa di-hard-delete — dan itu memang arah repo ini (ADR 0004). Hari ini nol
    // biaya: `deleteUser` punya nol call-site, dan `deleteMember` cuma menyapu
    // Akun Kader, yang tidak punya satu pun kewenangan atas Struktur.
    nonActiveAt: t.timestamp('non_active_at'),
    nonActiveBy: t.uuid('non_active_by').references((): AnyPgColumn => user.id),
    deletedAt: t.timestamp('deleted_at'),
    deletedBy: t.uuid('deleted_by').references((): AnyPgColumn => user.id),
    /**
     * Keadaan Struktur: satu sumbu di domain, dua kolom di simpanan (ADR 0005).
     * Terhapus mendominasi Non-Aktif — `is_non_active` sengaja dibiarkan menyala
     * di bawah `deleted_at`, sebab mendominasi bukan berarti menghapus.
     *
     * Turunan, mengikuti pola `level` dan `code_slug` di tabel yang sama, supaya
     * derivasinya tidak dihitung ulang di tiap pemanggil. Ia membuat Keadaan bisa
     * dibaca; ia tidak membuat orang ingat menyaringnya — itu tetap tugas pembaca
     * terpusat di `src/db/query/organization.ts`.
     */
    state: t
      .text({ enum: ['aktif', 'non_aktif', 'terhapus'] })
      .generatedAlwaysAs(
        (): SQL =>
          sql`CASE
          WHEN deleted_at IS NOT NULL THEN 'terhapus'
          WHEN is_non_active THEN 'non_aktif'
          ELSE 'aktif'
        END`
      )
      .notNull()
  }),
  (table) => [
    /**
     * `code` unik lintas **semua** baris, Terhapus termasuk — ADR 0004
     * mengunci `code` selamanya karena Struktur "nol Member" masih bisa
     * menggantung Member terhapus yang Nomor Induknya sudah tercetak dari
     * `code` itu. `unique()` biasa, bukan partial: aturannya tanpa syarat.
     *
     * Namanya dieja tangan untuk alasan yang sama dengan index slug —
     * penanganan `23505` di jalur tulis membedakannya dari pelanggaran slug.
     */
    unique('organization_code_unique').on(table.code),
    /**
     * `slug` unik **hanya di antara baris yang belum Terhapus** — ia cuma URL,
     * dan spec §4.2 membebaskannya begitu Strukturnya dihapus.
     *
     * Partial unique index, bukan constraint, karena PostgreSQL tidak punya
     * bentuk constraint untuk keunikan parsial. Dua alternatifnya sudah gugur
     * berdasarkan bukti: `UNIQUE (slug, deleted_at)` bawaan tidak menangkap
     * apa pun (dua baris hidup sama-sama ber-`deleted_at = NULL`, dan NULL
     * tidak pernah sama dengan NULL), sementara `NULLS NOT DISTINCT` menolak
     * dua penghapusan pada timestamp identik dan menaruh kolom audit ke dalam
     * kunci.
     *
     * Namanya dieja tangan: nama turunan berubah diam-diam kalau kolomnya
     * bergeser, sementara penanganan `23505` di §4.3 menyebutnya langsung.
     *
     * Non-Aktif **tidak** dilonggarkan — indeksnya membaca `deleted_at`, bukan
     * Keadaan, jadi Struktur Non-Aktif tetap memegang slugnya.
     */
    uniqueIndex('organization_slug_live_unique')
      .on(table.slug)
      .where(isNull(table.deletedAt))
  ]
)
