import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'
import { createSession, readSession, validateSession } from '~/lib/auth/api'

/**
 * Kedaluwarsa sesi karena tidak aktif — 3 hari, ditegakkan **di server**.
 *
 * Sebelum berkas ini `validateSession` tidak pernah menolak sesi karena umur:
 * satu-satunya penegaknya ada di `readSession`, yang nol pemanggil. `maxAge`
 * tiga hari pada cookie mengikat peramban dan tidak mengikat apa pun lagi, jadi
 * sebuah token yang keluar dari peramban berlaku selamanya. Itu yang diuji di
 * sini, bukan perilaku cookie-nya.
 *
 * Waktunya digeser dengan menulis `last_verified_at` ke masa lalu, bukan dengan
 * memalsukan jam: yang diadili fungsinya, dan menunggu tiga hari bukan tes.
 *
 * Fixture bersufiks, nol `TRUNCATE` — alasannya sama dengan
 * `tests/organization-read-invariant.test.ts`.
 */

const suffix = Date.now().toString(36)
const oneDayMS = 1000 * 60 * 60 * 24

describe('Kedaluwarsa sesi karena tidak aktif', () => {
  let orgId: string
  let userId: string
  const userIds: string[] = []

  /** Sesi baru yang `last_verified_at`-nya dimundurkan sekian hari. */
  const sessionAgedByDays = async (days: number) => {
    const created = await createSession(userId)
    const token = created!.token
    await db
      .update(sessionTable)
      .set({ lastVerifiedAt: new Date(Date.now() - days * oneDayMS) })
      .where(eq(sessionTable.id, created!.id))
    return { token, id: created!.id }
  }

  const sessionRowExists = async (id: string) => {
    const rows = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.id, id))
    return rows.length > 0
  }

  beforeAll(async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `PD Kedaluwarsa ${suffix}`,
        slug: `pd-kedaluwarsa-${suffix}`,
        code: `PD-KEDALUWARSA-${suffix}`,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id

    const [row] = await db
      .insert(userTable)
      .values({
        name: `bph-kedaluwarsa-${suffix}`,
        displayName: `BPH Kedaluwarsa ${suffix}`,
        passwordHash: 'x',
        role: 'bph',
        connectedOrganizationId: orgId
      })
      .returning({ id: userTable.id })
    userId = row.id
    userIds.push(row.id)
  })

  afterAll(async () => {
    if (userIds.length)
      await db.delete(sessionTable).where(inArray(sessionTable.userId, userIds))
    if (userIds.length)
      await db.delete(userTable).where(inArray(userTable.id, userIds))
    await db.delete(organization).where(eq(organization.id, orgId))
  })

  describe('validateSession', () => {
    it('menolak sesi yang sudah diam lebih dari tiga hari', async () => {
      const { token } = await sessionAgedByDays(4)

      expect(await validateSession(token)).toBeUndefined()
    })

    it('meloloskan sesi yang diamnya masih di bawah tiga hari', async () => {
      const { token } = await sessionAgedByDays(2)

      expect(await validateSession(token)).toBeDefined()
    })

    // Sesi yang lewat ambang batas juga lewat jendela penyegaran 6 jam. Kalau
    // penyegarannya ditanya lebih dulu, ia justru memperpanjang sesi yang
    // seharusnya pensiun — dan tesnya tetap hijau kalau cuma `undefined` yang
    // diperiksa. Jadi yang dituntut di sini adalah barisnya hilang.
    it('menghapus barisnya, bukan sekadar menolaknya', async () => {
      const { token, id } = await sessionAgedByDays(4)
      expect(await sessionRowExists(id)).toBe(true)

      await validateSession(token)

      expect(await sessionRowExists(id)).toBe(false)
    })

    it('tidak menyegarkan sesi yang sudah kedaluwarsa alih-alih menghapusnya', async () => {
      const { token, id } = await sessionAgedByDays(4)

      await validateSession(token)

      const rows = await db
        .select({ lastVerifiedAt: sessionTable.lastVerifiedAt })
        .from(sessionTable)
        .where(eq(sessionTable.id, id))
      expect(rows).toHaveLength(0)
    })

    // Id sesi bukan rahasia — ia separuh pertama token dan ikut ke mana pun
    // token itu pernah lewat. Kalau umur ditanya sebelum rahasianya, siapa pun
    // yang memegang id bisa membuat pembaca ini menghapus baris orang lain.
    it('tidak menghapus apa pun saat rahasianya salah, walau sesinya sudah kedaluwarsa', async () => {
      const { token, id } = await sessionAgedByDays(4)
      const [sessionId] = token.split('.')
      const tokenRahasiaSalah = [sessionId, crypto.randomUUID()].join('.')

      expect(await validateSession(tokenRahasiaSalah)).toBeUndefined()
      expect(await sessionRowExists(id)).toBe(true)
    })
  })

  describe('readSession', () => {
    it('menolak dan menghapus sesi yang sudah diam lebih dari tiga hari', async () => {
      const { id } = await sessionAgedByDays(4)

      expect(await readSession(id)).toBeUndefined()
      expect(await sessionRowExists(id)).toBe(false)
    })

    it('meloloskan sesi yang diamnya masih di bawah tiga hari', async () => {
      const { id } = await sessionAgedByDays(2)

      expect(await readSession(id)).toBeDefined()
    })
  })
})
