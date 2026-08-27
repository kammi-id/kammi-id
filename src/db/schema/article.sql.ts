import { pgTable, unique, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'
import { articleCategory } from './article-category.sql'

export const article = pgTable(
  'article',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    type: t.text({ enum: ['page', 'blog'] }).notNull(),
    title: t.text().notNull(),
    slug: t.text().notNull(),
    body: t.jsonb().notNull(),
    featuredImage: t.text('featured_image'),
    // Nama Penulis (CONTEXT.md): teks bebas, BUKAN rujukan ke Member/Akun —
    // penulis Berita sering bukan pemegang Akun. Nullable: artikel lama dan
    // Halaman (yang tidak wajib punya Penulis) tidak punya nilai di sini.
    penulis: t.text(),
    publishedAt: t.timestamp('published_at'),
    status: t
      .text({ enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    tags: t
      .text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    categoryId: t
      .uuid('category_id')
      .references(() => articleCategory.id, { onDelete: 'restrict' }),
    createdAt: t
      .timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: t
      .timestamp('updated_at')
      .default(sql`now()`)
      .notNull()
  }),
  (table) => [
    unique().on(table.organizationId, table.slug),
    /**
     * Ticket 07 (arsip Berita per Situs Struktur): `listBeritaArsipForOrg`
     * menyaring satu `organizationId` lalu mengurutkan
     * `publishedAt DESC, id DESC` — persis bentuk index ini. Parsial, bukan
     * menyeluruh: hanya baris yang benar-benar bisa menjadi "Berita Terbit"
     * (`type = 'blog'`, `status = 'published'`) yang pernah muncul di arsip
     * publik mana pun, jadi draft/terjadwal/Halaman tidak perlu ikut
     * menggemukkan index yang tak pernah mereka pakai.
     *
     * BELUM di-generate jadi migrasi fisik di sini secara sengaja — sesi
     * integrasi terpisah yang menggabungkan migrasi tiket-tiket paralel akan
     * men-generate-nya. Definisi skema ini cukup untuk kebenaran fungsional
     * (Postgres tetap bisa menjalankan query tanpa index-nya ada secara
     * fisik, hanya lebih lambat).
     */
    index('article_terbit_kronologis_idx')
      .on(table.organizationId, table.publishedAt.desc(), table.id.desc())
      .where(sql`${table.type} = 'blog' AND ${table.status} = 'published'`),
    /**
     * Ticket 08 (Berita Jaringan): `listBeritaJaringan` mengurutkan
     * `publishedAt DESC, id DESC` LINTAS seluruh Struktur — tanpa
     * `organizationId` sebagai kolom pertama, berbeda dari index arsip
     * per-Struktur di atas. Penyaringan Struktur (Terhapus, Situs belum
     * Aktif — ADR 0013) tidak bisa masuk predikat index ini karena predikat
     * partial index hanya boleh merujuk kolom `article` sendiri, bukan
     * `organization` yang di-JOIN; itu tetap ditegakkan lewat WHERE runtime.
     */
    index('article_terbit_jaringan_idx')
      .on(table.publishedAt.desc(), table.id.desc())
      .where(sql`${table.type} = 'blog' AND ${table.status} = 'published'`)
  ]
)
