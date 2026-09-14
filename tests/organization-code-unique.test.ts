import { describe, it, expect, afterAll } from 'bun:test'
import { like, eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'

/**
 * Tiket 16 — Migrasi C: unique `code` (spec §4.1, §4.2, §4.6, §4.7).
 *
 * `code` unik lintas **SEMUA** baris, Terhapus termasuk — bukan partial,
 * beda dari `slug` (tiket 15). ADR 0004 mengunci `code` selamanya karena
 * Struktur "nol Member" masih bisa menggantung Member terhapus yang Nomor
 * Induknya sudah tercetak dari `code` itu. Jadi berbeda dari slug, Struktur
 * baru **tidak boleh** memungut `code` milik Struktur Terhapus.
 *
 * Berkas ini memakai fixture bersufiks dan **tidak menyapu tabel** — ia
 * membuat code-nya sendiri berbenturan, bukan meminjam milik `db:seed`.
 */

const suffix = Date.now().toString(36)
const CONSTRAINT_NAME = 'organization_code_unique'

/** Menyisipkan langsung, bukan lewat `createOrganization` — lihat alasan
 * yang sama di `tests/organization-slug-unique.test.ts`. */
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
 * SQLSTATE-nya. Lihat alasan lengkap di `tests/organization-slug-unique.test.ts`.
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
    'basis data menerima perintah yang seharusnya ditolak — constraint-nya hilang atau terlalu longgar'
  )
}

const countByCode = async (code: string) => {
  const rows = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.code, code))
  return rows.length
}

// Tidak ada `beforeAll`: tiap tes menyemai barisnya sendiri, karena yang diuji
// justru penyisipannya.
describe('Keunikan code Struktur', () => {
  afterAll(async () => {
    await db.delete(organization).where(like(organization.code, `%-${suffix}`))
  })

  it('menolak dua Struktur hidup ber-code sama dengan 23505', async () => {
    const code = `KEMBAR-${suffix}`
    await insertOrg({
      name: `PD Kembar A ${suffix}`,
      slug: `kembar-a-${suffix}`,
      code
    })

    const failure = await expectRejection(() =>
      db.insert(organization).values({
        name: `PD Kembar B ${suffix}`,
        slug: `kembar-b-${suffix}`,
        code,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
    )

    expect(failure.sqlState).toBe('23505')
    expect(failure.constraint).toBe(CONSTRAINT_NAME)
    expect(await countByCode(code)).toBe(1)
  })

  it('menolak Struktur baru yang mencoba memungut code milik Struktur Terhapus', async () => {
    // Beda dari `slug`: keunikan `code` melintasi semua baris, jadi Struktur
    // Terhapus tetap menyandera code-nya. ADR 0004 — Member terhapus yang
    // menggantung di Struktur itu masih memegang Nomor Induk dari code ini.
    const code = `WARIS-${suffix}`
    await insertOrg({
      name: `PD Terhapus ${suffix}`,
      slug: `waris-lama-${suffix}`,
      code,
      deletedAt: new Date()
    })

    const failure = await expectRejection(() =>
      db.insert(organization).values({
        name: `PD Pewaris ${suffix}`,
        slug: `waris-baru-${suffix}`,
        code,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
    )

    expect(failure.sqlState).toBe('23505')
    expect(failure.constraint).toBe(CONSTRAINT_NAME)
    expect(await countByCode(code)).toBe(1)
  })

  it('memasang code sebagai UNIQUE constraint betulan di basis data, bukan cuma di TS', async () => {
    const rows = (await db.execute(sql`
      SELECT contype
      FROM pg_constraint
      WHERE conrelid = 'organization'::regclass AND conname = ${CONSTRAINT_NAME}
    `)) as unknown as { contype: string }[]

    expect(rows).toHaveLength(1)
    expect(rows[0].contype).toBe('u')
  })
})
