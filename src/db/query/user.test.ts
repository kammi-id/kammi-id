import { describe, it, expect, afterAll } from 'bun:test'
import { db } from '~/db/db'
import { eq } from 'drizzle-orm'
import { user as userTable } from '~/db/schema/user.sql'
import { readUserCredential } from './user'

/**
 * ADR 0021 — sisi login dari Lapis 1: Akun Kader yang soft-deleted tidak
 * boleh masuk, dan pesannya harus identik dengan "username tidak ditemukan"
 * (spec §5.5 sudah menetapkan pola ini untuk Keadaan Struktur; deletedAt
 * Akun sendiri mengikutinya).
 */
describe('readUserCredential', () => {
  const suffix = Date.now().toString(36)
  const userIds: string[] = []

  afterAll(async () => {
    if (userIds.length === 0) return
    await db.delete(userTable).where(eq(userTable.id, userIds[0]))
    if (userIds[1])
      await db.delete(userTable).where(eq(userTable.id, userIds[1]))
  })

  it('finds a live account by name', async () => {
    const name = `akun-hidup-${suffix}`
    const [row] = await db
      .insert(userTable)
      .values({
        name,
        displayName: 'Akun Hidup',
        passwordHash: 'x',
        role: 'member'
      })
      .returning({ id: userTable.id })
    userIds.push(row.id)

    const [found] = await readUserCredential(name)
    expect(found?.id).toBe(row.id)
  })

  it('treats a soft-deleted account as not found — Lapis 1, ADR 0021', async () => {
    const name = `akun-terhapus-${suffix}`
    const [row] = await db
      .insert(userTable)
      .values({
        name,
        displayName: 'Akun Terhapus',
        passwordHash: 'x',
        role: 'member',
        deletedAt: new Date()
      })
      .returning({ id: userTable.id })
    userIds.push(row.id)

    const found = await readUserCredential(name)
    expect(found).toHaveLength(0)
  })
})
