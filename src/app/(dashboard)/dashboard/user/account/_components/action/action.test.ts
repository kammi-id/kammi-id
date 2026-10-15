import { describe, it, expect, afterAll, mock } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'

let mockValidatedSession: unknown = undefined

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'kammi_id_session' ? { value: 'fake-token' } : undefined
  })
}))

mock.module('~/lib/auth/api', () => ({
  validateSession: async () => mockValidatedSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { updateProfileAction, updatePasswordAction } = await import('./action')

/**
 * ADR 0027, Celah 4 — bagi Akun Kader, `user.name` ADALAH NIA-nya (ADR
 * 0020): identitas permanen sekaligus identitas login. `updateProfileAction`
 * membuang `name` dari nilai yang ditulis untuk `role === 'member'`, apa pun
 * yang dibawa FormData-nya. Akun Kepengurusan tetap boleh menggantinya.
 *
 * Juga menguji "Sekalian": ganti password sendiri memutus sesi LAIN,
 * mengecualikan sesi yang sedang dipakai.
 *
 * Fixture bersufiks, dibereskan sendiri di `afterAll` — bukan TRUNCATE
 * (basis data staging dipakai bersama proses tes lain yang berjalan
 * paralel).
 */
const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const userIds: string[] = []
const sessionIds: string[] = []

afterAll(async () => {
  if (sessionIds.length > 0)
    await db.delete(sessionTable).where(inArray(sessionTable.id, sessionIds))
  if (userIds.length > 0)
    await db.delete(userTable).where(inArray(userTable.id, userIds))
})

let userCounter = 0
const seedUser = async (
  role: 'member' | 'root' | 'bpk' | 'bph' | 'bpw' | 'humas',
  overrides: Partial<{ name: string; passwordHash: string }> = {}
) => {
  userCounter += 1
  const unique = `${suffix}-${userCounter}`
  const [row] = await db
    .insert(userTable)
    .values({
      name: overrides.name ?? `user-${unique}`,
      displayName: `Nama ${unique}`,
      passwordHash:
        overrides.passwordHash ?? (await Bun.password.hash('rahasia123')),
      role
    })
    .returning({ id: userTable.id, name: userTable.name })
  userIds.unshift(row.id)
  return row
}

const seedSession = async (userId: string) => {
  const id = Bun.randomUUIDv7()
  const now = new Date()
  await db.insert(sessionTable).values({
    id,
    secretHash: 'irrelevant-hash',
    createdAt: now,
    lastVerifiedAt: now,
    userId
  })
  sessionIds.unshift(id)
  return id
}

const countSessionsFor = async (userId: string) => {
  const rows = await db
    .select({ id: sessionTable.id })
    .from(sessionTable)
    .where(eq(sessionTable.userId, userId))
  return rows.length
}

const formDataOf = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return fd
}

describe('updateProfileAction', () => {
  it('menolak mengubah user.name (NIA) seorang member, meski FormData membawanya', async () => {
    const user = await seedUser('member')
    const sessionId = await seedSession(user.id)
    mockValidatedSession = {
      id: sessionId,
      userId: user.id,
      user: { id: user.id, role: 'member' }
    }

    const result = await updateProfileAction(
      { success: false },
      formDataOf({ name: 'NIA-RAMPASAN', displayName: 'Nama Baru' })
    )

    expect(result.success).toBe(true)
    const [row] = await db
      .select({ name: userTable.name, displayName: userTable.displayName })
      .from(userTable)
      .where(eq(userTable.id, user.id))
    expect(row?.name).toBe(user.name)
    expect(row?.displayName).toBe('Nama Baru')
  })

  it('mengizinkan Akun Kepengurusan mengganti user.name-nya', async () => {
    const user = await seedUser('bpk')
    const sessionId = await seedSession(user.id)
    mockValidatedSession = {
      id: sessionId,
      userId: user.id,
      user: { id: user.id, role: 'bpk' }
    }

    const newName = `bpk-diganti-${suffix}`
    const result = await updateProfileAction(
      { success: false },
      formDataOf({ name: newName, displayName: 'Nama BPK' })
    )

    expect(result.success).toBe(true)
    const [row] = await db
      .select({ name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, user.id))
    expect(row?.name).toBe(newName)
  })
})

describe('updatePasswordAction — Sekalian: ganti password sendiri memutus sesi lain', () => {
  it('menyisakan sesi yang sedang dipakai, memutus sesi lain', async () => {
    const passwordHash = await Bun.password.hash('sandiLama123')
    const user = await seedUser('member', { passwordHash })
    const currentSessionId = await seedSession(user.id)
    const otherSessionId = await seedSession(user.id)

    mockValidatedSession = {
      id: currentSessionId,
      userId: user.id,
      user: { id: user.id, role: 'member' }
    }

    expect(await countSessionsFor(user.id)).toBe(2)

    const result = await updatePasswordAction(
      { success: false },
      formDataOf({
        currentPassword: 'sandiLama123',
        newPassword: 'sandiBaru456',
        confirmPassword: 'sandiBaru456'
      })
    )

    expect(result.success).toBe(true)

    const remaining = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.userId, user.id))
    expect(remaining.map((r) => r.id)).toEqual([currentSessionId])
    expect(remaining.map((r) => r.id)).not.toContain(otherSessionId)
  })
})
