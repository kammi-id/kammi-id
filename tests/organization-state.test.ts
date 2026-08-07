import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql, eq } from 'drizzle-orm'
import { createOrganization, readOrganization } from '~/db/query/organization'
import { organization } from '~/db/schema/organization.sql'
import { user as userTable } from '~/db/schema/user.sql'

/**
 * Tiket 13 — Migrasi A. Keadaan Struktur dibaca dari basis data, bukan dihitung
 * ulang di pemanggil, dan hard delete berhenti dijaga ingatan manusia.
 *
 * Ketiga hal ini hanya bisa dibuktikan terhadap basis data yang sudah dimigrasi
 * — tipe TypeScript-nya bisa benar sementara kolomnya mendarat nullable, dan
 * itu persis jebakan yang tiket ini dibuat untuk menghindari.
 */
describe('Keadaan Struktur', () => {
  let orgId: string

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)

    const [org] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp',
      code: 'PP',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    orgId = org.id
  })

  const readState = async (id: string) => {
    const [row] = await db
      .select({ state: organization.state })
      .from(organization)
      .where(eq(organization.id, id))
    return row?.state
  }

  it('menandai Struktur yang baru dibuat sebagai aktif', async () => {
    expect(await readState(orgId)).toBe('aktif')
  })

  it('menandai Struktur ber-is_non_active sebagai non_aktif', async () => {
    await db
      .update(organization)
      .set({ isNonActive: true, nonActiveAt: new Date() })
      .where(eq(organization.id, orgId))

    expect(await readState(orgId)).toBe('non_aktif')
  })

  it('menandai Struktur ber-deleted_at sebagai terhapus', async () => {
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, orgId))

    expect(await readState(orgId)).toBe('terhapus')
  })

  it('mendahulukan terhapus saat kedua kolom menyala bersamaan', async () => {
    await db
      .update(organization)
      .set({ isNonActive: true, deletedAt: new Date() })
      .where(eq(organization.id, orgId))

    expect(await readState(orgId)).toBe('terhapus')
  })

  it('kembali ke aktif saat kedua kolom dikosongkan', async () => {
    await db
      .update(organization)
      .set({ isNonActive: true, deletedAt: new Date() })
      .where(eq(organization.id, orgId))
    await db
      .update(organization)
      .set({ isNonActive: false, deletedAt: null })
      .where(eq(organization.id, orgId))

    expect(await readState(orgId)).toBe('aktif')
  })

  it('memasang kolom Keadaan sebagai NOT NULL di basis data, bukan cuma di TS', async () => {
    const rows = (await db.execute(sql`
      SELECT is_nullable, is_generated
      FROM information_schema.columns
      WHERE table_name = 'organization' AND column_name = 'state'
    `)) as unknown as { is_nullable: string; is_generated: string }[]

    expect(rows).toHaveLength(1)
    expect(rows[0].is_nullable).toBe('NO')
    expect(rows[0].is_generated).toBe('ALWAYS')
  })

  it('membawa Keadaan lewat pembaca terpusat', async () => {
    const [row] = await readOrganization({ id: [orgId] })
    expect(row.state).toBe('aktif')
  })

  it('menyaring lewat pembaca terpusat tanpa menyusun ulang derivasinya', async () => {
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, orgId))

    expect(await readOrganization({ state: ['aktif'] })).toHaveLength(0)
    expect(await readOrganization({ state: ['terhapus'] })).toHaveLength(1)
  })

  it('mencatat siapa yang menghapus dan siapa yang menonaktifkan', async () => {
    // `createOrganization` mencetak Akun kepengurusan bersama Strukturnya, jadi
    // selalu ada pelaku untuk ditunjuk.
    const [actor] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .limit(1)
    expect(actor).toBeDefined()

    await db
      .update(organization)
      .set({
        deletedAt: new Date(),
        deletedBy: actor.id,
        nonActiveAt: new Date(),
        nonActiveBy: actor.id
      })
      .where(eq(organization.id, orgId))

    const [row] = await db
      .select({
        deletedBy: organization.deletedBy,
        nonActiveBy: organization.nonActiveBy
      })
      .from(organization)
      .where(eq(organization.id, orgId))

    expect(row.deletedBy).toBe(actor.id)
    expect(row.nonActiveBy).toBe(actor.id)
  })
})

describe('hard delete Struktur', () => {
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)
  })

  /**
   * Sebelum cascade dicabut, perintah ini berhasil diam-diam dan membawa serta
   * Akun kepengurusannya. Sekarang ia gagal dengan nol baris berubah — ADR 0004
   * dijaga skema, bukan konvensi.
   */
  it('gagal dengan 23503 dan nol baris berubah saat Struktur punya Akun', async () => {
    const [org] = await createOrganization({
      name: 'PW Test',
      slug: 'pw-test',
      code: 'PW-01',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })

    // Drizzle membungkus galatnya; SQLSTATE-nya ada di `cause.errno` milik
    // PostgresError bawaan Bun, bukan di `code` seperti driver lain.
    let sqlState: string | undefined
    let constraint: string | undefined
    try {
      await db.execute(sql`DELETE FROM organization WHERE id = ${org.id}`)
    } catch (error) {
      const cause = (
        error as { cause?: { errno?: unknown; constraint?: string } }
      ).cause
      sqlState = String(cause?.errno)
      constraint = cause?.constraint
    }

    expect(sqlState).toBe('23503')
    expect(constraint).toBe(
      'user_connected_organization_id_organization_id_fkey'
    )

    const [survivor] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, org.id))
    expect(survivor).toBeDefined()
  })
})
