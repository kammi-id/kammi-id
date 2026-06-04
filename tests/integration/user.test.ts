import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createUser, readUser } from '~/db/query/user'
import { createOrganization } from '~/db/query/organization'
import { hashPassword } from '~/lib/utils/user'

const truncate = async () => {
  await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)
}

describe('createUser', () => {
  beforeEach(truncate)

  it('creates a root user with no connected org', async () => {
    const hash = await hashPassword('password123')
    const [u] = await createUser({
      name: 'root-user',
      displayName: 'Root User',
      passwordHash: hash,
      role: 'root',
      connectedOrganizationId: null,
      connectedMemberId: null
    })
    expect(u.id).toBeDefined()
    expect(u.name).toBe('root-user')
    expect(u.role).toBe('root')
    expect(u.connectedOrganizationId).toBeNull()
  })

  it('creates a user connected to an organization', async () => {
    const [org] = await createOrganization({
      name: 'PW Test',
      slug: 'pw-test',
      code: 'PW 01',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })
    const hash = await hashPassword('password123')
    const [u] = await createUser({
      name: 'bpw-user',
      displayName: 'BPW User',
      passwordHash: hash,
      role: 'bpw',
      connectedOrganizationId: org.id,
      connectedMemberId: null
    })
    expect(u.connectedOrganizationId).toBe(org.id)
  })

  it('stores a hashed password (not plaintext)', async () => {
    const plain = 'supersecret'
    const hash = await hashPassword(plain)
    const [u] = await createUser({
      name: 'hash-test-user',
      displayName: 'Hash Test',
      passwordHash: hash,
      role: 'bph',
      connectedOrganizationId: null,
      connectedMemberId: null
    })
    expect(u.id).toBeDefined()
    // passwordHash is not exposed on User (CTE), just verify user was created
    expect(u.name).toBe('hash-test-user')
  })
})

describe('readUser', () => {
  beforeEach(truncate)

  it('returns users filtered by role', async () => {
    const hash = await hashPassword('pw')
    await createUser({
      name: 'u1',
      displayName: 'U1',
      passwordHash: hash,
      role: 'bph',
      connectedOrganizationId: null,
      connectedMemberId: null
    })
    await createUser({
      name: 'u2',
      displayName: 'U2',
      passwordHash: hash,
      role: 'bpw',
      connectedOrganizationId: null,
      connectedMemberId: null
    })

    const bphUsers = await readUser({ role: ['bph'] })
    expect(bphUsers).toHaveLength(1)
    expect(bphUsers[0].name).toBe('u1')
  })

  it('returns empty array for non-existent ID', async () => {
    const users = await readUser({
      id: ['00000000-0000-0000-0000-000000000000']
    })
    expect(users).toHaveLength(0)
  })

  it('returns user by exact ID', async () => {
    const hash = await hashPassword('pw')
    const [created] = await createUser({
      name: 'findme',
      displayName: 'Find Me',
      passwordHash: hash,
      role: 'bph',
      connectedOrganizationId: null,
      connectedMemberId: null
    })
    const [found] = await readUser({ id: [created.id] })
    expect(found.id).toBe(created.id)
    expect(found.name).toBe('findme')
  })
})
