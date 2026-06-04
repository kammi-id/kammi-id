import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { readSession as readSessionFromDB } from '~/db/query/session'
import { createSession } from '~/lib/auth/api'
import { createUser } from '~/db/query/user'
import { hashPassword } from '~/lib/utils/user'

const truncate = async () => {
  await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)
}

const makeUser = async () => {
  const hash = await hashPassword('pw')
  const [u] = await createUser({
    name: `user-${Date.now()}`,
    displayName: 'Test User',
    passwordHash: hash,
    role: 'root',
    connectedOrganizationId: null,
    connectedMemberId: null
  })
  return u
}

describe('createSession', () => {
  beforeEach(truncate)

  it('creates a session and returns a token', async () => {
    const u = await makeUser()
    const session = await createSession(u.id)
    expect(session).toBeDefined()
    expect(session!.id).toBeDefined()
    expect(session!.userId).toBe(u.id)
    expect(session!.token).toMatch(/^[0-9a-f-]+\.[0-9a-f-]+$/i)
  })

  it('token has two parts separated by a dot', async () => {
    const u = await makeUser()
    const session = await createSession(u.id)
    const parts = session!.token.split('.')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toBeTruthy()
    expect(parts[1]).toBeTruthy()
  })
})

describe('readSession (DB layer)', () => {
  beforeEach(truncate)

  it('reads a session by ID after creation', async () => {
    const u = await makeUser()
    const created = await createSession(u.id)
    const [found] = await readSessionFromDB([created!.id])
    expect(found.id).toBe(created!.id)
    expect(found.userId).toBe(u.id)
  })

  it('returns empty for non-existent session ID', async () => {
    const result = await readSessionFromDB([
      '00000000-0000-0000-0000-000000000000'
    ])
    expect(result).toHaveLength(0)
  })

  it('persists secretHash for the created session', async () => {
    const u = await makeUser()
    const created = await createSession(u.id)
    const [found] = await readSessionFromDB([created!.id])
    expect(found.secretHash).toBeDefined()
    expect(typeof found.secretHash).toBe('string')
    expect(found.secretHash.length).toBeGreaterThan(0)
  })
})
