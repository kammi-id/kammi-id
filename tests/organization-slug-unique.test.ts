import { describe, it, expect, afterAll } from 'bun:test'
import { like, eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'

/**
 * Tiket 15 — Migrasi B: partial unique index `slug` (spec §4.2, §4.3).
 *
 * `slug` unik **hanya di antara baris yang belum Terhapus**. Bentuknya tidak
 * bisa dibuktikan dari tipe TypeScript-nya: `UNIQUE (slug, deleted_at)` lolos
 * tipe, terlihat benar, dan tidak menangkap apa pun — dua baris hidup
 * sama-sama ber-`deleted_at = NULL`, dan NULL tidak pernah sama dengan NULL.
 * Jadi seluruh berkas ini menghantam basis data yang sudah dimigrasi.
 *
 * Berkas ini memakai fixture bersufiks dan **tidak menyapu tabel** — ia
 * membuat slugnya sendiri berbenturan, bukan meminjam milik `db:seed`.
 */

const suffix = Date.now().toString(36)
const INDEX_NAME = 'organization_slug_live_unique'

/** Menyisipkan langsung, bukan lewat `createOrganization` — Akun kepengurusan
 * yang ikut tercetak punya `user.name` bersumber slug dan akan bertabrakan
 * lebih dulu, menutupi constraint yang justru sedang diuji. */
const insertOrg = async (values: {
  name: string
  slug: string
  code: string
  deletedAt?: Date | null
}) => {
  const [row] = await db
    .insert(organization)
    .values({
      name: values.name,
      slug: values.slug,
      code: values.code,
      type: 'pd',
      parentId: null,
      isNonActive: false,
      deletedAt: values.deletedAt ?? null
    })
    .returning({ id: organization.id })
  return row
}

/**
 * Menjalankan sesuatu yang **wajib** ditolak basis data, dan mengembalikan
 * SQLSTATE-nya. Sukses adalah kegagalan tes, dan dikatakan begitu: tanpa
 * lemparan ini, indeks yang hilang muncul sebagai
 * `expected undefined to be '23505'` — gejala, bukan sebabnya.
 *
 * Drizzle membungkus galatnya; SQLSTATE-nya ada di `cause.errno` milik
 * PostgresError bawaan Bun, bukan di `code` seperti driver lain.
 */
const expectRejection = async (run: () => Promise<unknown>) => {
  try {
    await run()
  } catch (error) {
    const cause = (
      error as { cause?: { errno?: unknown; constraint?: string } }
    ).cause
    return { sqlState: String(cause?.errno), constraint: cause?.constraint }
  }
  throw new Error(
    'basis data menerima perintah yang seharusnya ditolak — indeksnya hilang atau terlalu longgar'
  )
}

const countBySlug = async (slug: string) => {
  const rows = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
  return rows.length
}

// Tidak ada `beforeAll`: tiap tes menyemai barisnya sendiri, karena yang diuji
// justru penyisipannya.
describe('Keunikan slug Struktur', () => {
  // Menyapu lewat sufiks, bukan lewat daftar id yang dikumpulkan. Sebagian
  // besar penyisipan di berkas ini memang dirancang gagal; daftar id akan
  // melewatkan persis baris yang lolos padahal seharusnya tidak — yaitu baris
  // yang paling perlu disapu.
  afterAll(async () => {
    await db.delete(organization).where(like(organization.slug, `%-${suffix}`))
  })

  it('menolak dua Struktur hidup ber-slug sama dengan 23505', async () => {
    const slug = `slug-kembar-${suffix}`
    await insertOrg({
      name: `PD Kembar A ${suffix}`,
      slug,
      code: `KEMBAR-A-${suffix}`
    })

    const failure = await expectRejection(() =>
      db.insert(organization).values({
        name: `PD Kembar B ${suffix}`,
        slug,
        code: `KEMBAR-B-${suffix}`,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
    )

    expect(failure.sqlState).toBe('23505')
    expect(failure.constraint).toBe(INDEX_NAME)
    expect(await countBySlug(slug)).toBe(1)
  })

  it('meloloskan Struktur Non-Aktif — Non-Aktif tetap hidup', async () => {
    // Indeksnya membaca `deleted_at`, bukan Keadaan. Struktur Non-Aktif masih
    // memegang slugnya, dan itu memang maunya.
    const slug = `slug-nonaktif-${suffix}`
    await insertOrg({
      name: `PD NonAktif ${suffix}`,
      slug,
      code: `NONAKTIF-${suffix}`
    })
    await db
      .update(organization)
      .set({ isNonActive: true, nonActiveAt: new Date() })
      .where(eq(organization.slug, slug))

    const failure = await expectRejection(() =>
      db.insert(organization).values({
        name: `PD Perebut NonAktif ${suffix}`,
        slug,
        code: `PEREBUT-NONAKTIF-${suffix}`,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
    )

    expect(failure.sqlState).toBe('23505')
    expect(failure.constraint).toBe(INDEX_NAME)
  })

  it('membiarkan Struktur baru memungut slug milik Struktur Terhapus', async () => {
    const slug = `slug-warisan-${suffix}`
    await insertOrg({
      name: `PD Terhapus ${suffix}`,
      slug,
      code: `WARIS-LAMA-${suffix}`,
      deletedAt: new Date()
    })

    // Ini **sah**, bukan bug: spec §4.2 membebaskan slug setelah penghapusan.
    await insertOrg({
      name: `PD Pewaris ${suffix}`,
      slug,
      code: `WARIS-BARU-${suffix}`
    })

    expect(await countBySlug(slug)).toBe(2)
  })

  it('membiarkan dua Struktur Terhapus berbagi slug yang sama', async () => {
    const slug = `slug-dua-mayat-${suffix}`
    await insertOrg({
      name: `PD Mayat A ${suffix}`,
      slug,
      code: `MAYAT-A-${suffix}`,
      deletedAt: new Date()
    })
    await insertOrg({
      name: `PD Mayat B ${suffix}`,
      slug,
      code: `MAYAT-B-${suffix}`,
      deletedAt: new Date()
    })

    expect(await countBySlug(slug)).toBe(2)
  })

  it('menolak pemulihan Struktur Terhapus yang slugnya sudah dipungut', async () => {
    // Spec §4.3: galatnya mendarat di `UPDATE` pemulihan — bukan saat
    // penghapusan, dan bukan saat Struktur kedua dibuat.
    const slug = `slug-pulihkan-${suffix}`
    const terhapus = await insertOrg({
      name: `PD Pulihkan Lama ${suffix}`,
      slug,
      code: `PULIH-LAMA-${suffix}`,
      deletedAt: new Date()
    })
    await insertOrg({
      name: `PD Pulihkan Pemungut ${suffix}`,
      slug,
      code: `PULIH-BARU-${suffix}`
    })

    const failure = await expectRejection(() =>
      db
        .update(organization)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(organization.id, terhapus.id))
    )

    expect(failure.sqlState).toBe('23505')
    expect(failure.constraint).toBe(INDEX_NAME)

    const [row] = await db
      .select({ deletedAt: organization.deletedAt })
      .from(organization)
      .where(eq(organization.id, terhapus.id))
    expect(row.deletedAt).not.toBeNull()
  })

  it('memasang indeksnya sebagai unique dan parsial di basis data, bukan cuma di TS', async () => {
    const rows = (await db.execute(sql`
      SELECT indexdef
      FROM pg_indexes
      WHERE tablename = 'organization' AND indexname = ${INDEX_NAME}
    `)) as unknown as { indexdef: string }[]

    expect(rows).toHaveLength(1)
    expect(rows[0].indexdef).toContain('CREATE UNIQUE INDEX')
    expect(rows[0].indexdef).toContain('WHERE (deleted_at IS NULL)')
  })

  it('tidak memasang constraint apa pun pada code_slug', async () => {
    // Keunikan `code` tidak menurunkan keunikan `code_slug`, dan spec §4.2
    // sengaja membiarkannya tanpa constraint — nol pembaca.
    const rows = (await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'organization' AND indexdef LIKE '%code_slug%'
    `)) as unknown as { indexname: string }[]

    expect(rows).toHaveLength(0)
  })
})
