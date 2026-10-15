import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql, eq } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import {
  createMember,
  deleteMember,
  readMember,
  readMemberByRegisterNumber
} from '~/db/query/member'
import { user as userTable } from '~/db/schema/user.sql'

describe('deleteMember', () => {
  let orgId: string

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

    const [org] = await createOrganization({
      name: 'PK Test',
      slug: 'pk-test',
      code: 'PK-99',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    orgId = org.id
  })

  const createTestMember = async (registerNumber: string) => {
    const [created] = await createMember({
      name: 'Anggota Test',
      registerNumber,
      organizationId: orgId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    return created
  }

  it('marks the member as deleted and soft-deletes their login account (ADR 0021)', async () => {
    const created = await createTestMember('PK99-0001')

    const [userBefore] = await db
      .select({ id: userTable.id, deletedAt: userTable.deletedAt })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))
    expect(userBefore).toBeDefined()
    expect(userBefore.deletedAt).toBeNull()

    await deleteMember(created.id)

    // The Akun row survives — restoring it is what Lapis 2 depends on.
    // Only `deleted_at` moves; discarding the row is the bug ADR 0021
    // fixes (the person came back, but never their login).
    const [userAfter] = await db
      .select({ id: userTable.id, deletedAt: userTable.deletedAt })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))
    expect(userAfter).toBeDefined()
    expect(userAfter.deletedAt).not.toBeNull()
  })

  it('excludes deleted members from readMember', async () => {
    const created = await createTestMember('PK99-0002')
    await deleteMember(created.id)

    const results = await readMember({ id: [created.id] })
    expect(results).toHaveLength(0)
  })

  it('returns null from readMemberByRegisterNumber for deleted members', async () => {
    const created = await createTestMember('PK99-0003')
    await deleteMember(created.id)

    const found = await readMemberByRegisterNumber('PK99-0003')
    expect(found).toBeNull()
  })
})
