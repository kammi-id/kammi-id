import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'
import { deleteSessionsByUser } from './session'

/**
 * Memutus seluruh sesi seorang pengguna — separuh "reset password mematikan
 * sesi yang hidup" dari ADR 0028.
 *
 * `exceptSessionId` ada untuk satu pemanggil saja: Kader yang mengganti
 * password sendiri dan tidak boleh menendang dirinya keluar di tengah aksinya.
 * Reset oleh pengurus memanggilnya tanpa argumen kedua, dan yang diadili di
 * sini adalah bahwa kedua bentuk itu berhenti tepat pada satu pengguna —
 * sebuah `DELETE` yang lupa `WHERE user_id` menghapus sesi seluruh instalasi
 * dan tetap lolos tes yang hanya memeriksa sesi si pemilik sendiri.
 *
 * Fixture bersufiks, nol `TRUNCATE` — alasannya sama dengan
 * `tests/sesi-kedaluwarsa.test.ts`.
 */

const suffix = Date.now().toString(36)

describe('deleteSessionsByUser', () => {
  let userId: string
  let otherUserId: string
  const userIds: string[] = []

  /** Satu baris sesi mentah; isinya tidak relevan selain pemiliknya. */
  const seedSession = async (ownerId: string): Promise<string> => {
    const id = crypto.randomUUID()
    await db.insert(sessionTable).values({
      id,
      secretHash: 'x',
      createdAt: new Date(),
      lastVerifiedAt: new Date(),
      userId: ownerId
    })
    return id
  }

  const liveSessionIds = async (ownerId: string): Promise<string[]> => {
    const rows = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.userId, ownerId))
    return rows.map((row) => row.id)
  }

  beforeAll(async () => {
    const rows = await db
      .insert(userTable)
      .values([
        {
          name: `sesi-pemilik-${suffix}`,
          displayName: `Sesi Pemilik ${suffix}`,
          passwordHash: 'x',
          role: 'member'
        },
        {
          name: `sesi-orang-lain-${suffix}`,
          displayName: `Sesi Orang Lain ${suffix}`,
          passwordHash: 'x',
          role: 'member'
        }
      ])
      .returning({ id: userTable.id })
    userId = rows[0].id
    otherUserId = rows[1].id
    userIds.push(rows[0].id, rows[1].id)
  })

  // Setiap tes menyemai sesinya sendiri, jadi sisa tes sebelumnya akan
  // terhitung sebagai sesi yang lolos dari penghapusan — persis kegagalan yang
  // berkas ini cari.
  beforeEach(async () => {
    await db.delete(sessionTable).where(inArray(sessionTable.userId, userIds))
  })

  afterAll(async () => {
    if (userIds.length === 0) return
    await db.delete(sessionTable).where(inArray(sessionTable.userId, userIds))
    await db.delete(userTable).where(inArray(userTable.id, userIds))
  })

  it('memutus seluruh sesi pengguna itu', async () => {
    await seedSession(userId)
    await seedSession(userId)
    expect(await liveSessionIds(userId)).toHaveLength(2)

    await deleteSessionsByUser(userId)

    expect(await liveSessionIds(userId)).toHaveLength(0)
  })

  it('tidak menyentuh sesi pengguna lain', async () => {
    await seedSession(userId)
    const asing = await seedSession(otherUserId)

    await deleteSessionsByUser(userId)

    expect(await liveSessionIds(otherUserId)).toEqual([asing])
  })

  it('menyisakan sesi yang dikecualikan, dan hanya itu', async () => {
    const dipertahankan = await seedSession(userId)
    await seedSession(userId)
    await seedSession(userId)

    await deleteSessionsByUser(userId, dipertahankan)

    expect(await liveSessionIds(userId)).toEqual([dipertahankan])
  })

  // `exceptSessionId` milik pengguna lain tidak boleh menyelamatkan apa pun,
  // dan tidak boleh pula menghapus apa pun di luar `userId`.
  it('mengabaikan pengecualian yang bukan milik pengguna itu', async () => {
    await seedSession(userId)
    const asing = await seedSession(otherUserId)

    await deleteSessionsByUser(userId, asing)

    expect(await liveSessionIds(userId)).toHaveLength(0)
    expect(await liveSessionIds(otherUserId)).toEqual([asing])
  })

  it('tidak galat ketika pengguna itu tidak punya sesi sama sekali', async () => {
    expect(await liveSessionIds(userId)).toHaveLength(0)

    await deleteSessionsByUser(userId)

    expect(await liveSessionIds(userId)).toHaveLength(0)
  })
})
