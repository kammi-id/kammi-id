import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { trainingQuery } from '~/db/query/training'

describe('trainingQuery.hasDependents', () => {
  let orgId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", training, training_attendants, training_instructors, organization CASCADE`
    )

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

  const createTestTraining = async () => {
    return await trainingQuery.create({
      organizationId: orgId,
      name: 'DM1 Batch 1',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      type: 'dm1',
      registrationStartDate: null,
      registrationDeadline: null
    })
  }

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

  it('returns false when a training has no attendants or instructors', async () => {
    const training = await createTestTraining()

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(false)
  })

  it('returns true when a training has an attendant', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0001')
    await trainingQuery.addAttendant(training.id, member.id)

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(true)
  })

  it('returns true when a training has an instructor', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0002')
    await trainingQuery.addInstructor(training.id, member.id, 'lecturer')

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(true)
  })

  it('returns false again once attendants and instructors are removed', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0003')
    await trainingQuery.addAttendant(training.id, member.id)
    await trainingQuery.removeAttendant(training.id, member.id)

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(false)
  })
})
