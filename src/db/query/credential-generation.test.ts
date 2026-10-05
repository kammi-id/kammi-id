import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { user } from '~/db/schema/user.sql'

const generatedPassword = 'apple-abc12'

mock.module('~/lib/utils/user', () => ({
  generatePassword: () => generatedPassword,
  hashPassword: async (password: string) => await Bun.password.hash(password)
}))

const { createOrganization } = await import('./organization')
const { createMember } = await import('./member')

describe('pembuatan Akun memakai password generator', () => {
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)
  })

  test('pembuatan Struktur menyimpan hash untuk setiap plaintext kredensial', async () => {
    const [organization] = await createOrganization({
      name: 'PK Test',
      slug: 'pk-test',
      code: 'PK-TEST',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })

    for (const credential of organization.credentials) {
      const [account] = await db
        .select({ passwordHash: user.passwordHash })
        .from(user)
        .where(eq(user.name, credential.name))

      expect(
        await Bun.password.verify(
          credential.password,
          account?.passwordHash ?? ''
        )
      ).toBe(true)
    }
  })

  test('pembuatan Member menyimpan hash untuk password generator', async () => {
    const [organization] = await createOrganization({
      name: 'PK Test',
      slug: 'pk-test',
      code: 'PK-TEST',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    const [member] = await createMember({
      name: 'Kader Test',
      registerNumber: 'PKTEST-001',
      organizationId: organization.id,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2026
    })
    const [account] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.connectedMemberId, member.id))

    expect(
      await Bun.password.verify(generatedPassword, account?.passwordHash ?? '')
    ).toBe(true)
  })

  test('createMember mengembalikan plaintext yang cocok dengan hash tersimpan', async () => {
    const [organization] = await createOrganization({
      name: 'PK Test',
      slug: 'pk-test-plaintext',
      code: 'PK-TEST2',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    const [member] = await createMember({
      name: 'Kader Test',
      registerNumber: 'PKTEST2-001',
      organizationId: organization.id,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2026
    })

    expect(member.credential.registerNumber).toBe(member.registerNumber)
    expect(member.credential.displayName).toBe(member.name)
    expect(member.credential.password).toBe(generatedPassword)

    const [account] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.connectedMemberId, member.id))

    expect(
      await Bun.password.verify(
        member.credential.password,
        account?.passwordHash ?? ''
      )
    ).toBe(true)
  })
})
