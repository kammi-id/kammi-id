import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { trainingQuery } from '~/db/query/training'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { addAttendantAction, updateAttendantStatusAction } =
  await import('./action')

const toFormData = (fields: Record<string, string>): FormData => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return fd
}

const daysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const daysFromNow = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('training-detail-view actions', () => {
  let pkItbId: string
  let pkOtherId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", training, training_attendants, organization CASCADE`
    )
    mockSession = undefined

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar',
      code: 'PW-01',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim',
      code: 'PW-02',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other',
      code: 'PK-02',
      type: 'pk',
      parentId: pwJatim.id,
      isNonActive: false
    })
    pkOtherId = pkOther.id
  })

  const createTraining = async (
    organizationId: string,
    overrides: { startDate: string; endDate: string }
  ) => {
    const created = await trainingQuery.create({
      organizationId,
      name: 'DM1 Test',
      startDate: overrides.startDate,
      endDate: overrides.endDate,
      type: 'dm1'
    })
    return created
  }

  const createTestMember = async (organizationId: string) => {
    const [created] = await createMember({
      name: 'Anggota Test',
      registerNumber: 'PK01-0001',
      organizationId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    return created
  }

  describe('assertCanManage (via addAttendantAction)', () => {
    it('rejects when there is no active session', async () => {
      mockSession = undefined
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      const member = await createTestMember(pkItbId)

      const result = await addAttendantAction(
        undefined,
        toFormData({ trainingId: training.id, memberId: member.id })
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })

    it('rejects managing a training outside the org scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkOtherId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      const member = await createTestMember(pkOtherId)

      const result = await addAttendantAction(
        undefined,
        toFormData({ trainingId: training.id, memberId: member.id })
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      )
    })

    it('adds an attendant when the training is in scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      const member = await createTestMember(pkItbId)

      const result = await addAttendantAction(
        undefined,
        toFormData({ trainingId: training.id, memberId: member.id })
      )

      expect(result.success).toBe(true)
    })
  })

  // Aturan Masa Penetapan Kelulusan sendiri — kedua sisi jendela, batas hari
  // ke-30/31, dan pengecualian Root — diuji di
  // `src/lib/daurah/masa-penetapan-kelulusan.test.ts`. Yang tersisa di sini
  // adalah jahitannya: bahwa gate ini benar-benar memanggil modul itu, dan
  // bahwa kedua alasan tertutup dipetakan ke pesan yang benar.
  describe('assertCanEditPassing (via updateAttendantStatusAction)', () => {
    it('rejects grading before the training has ended', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(1),
        endDate: daysFromNow(3)
      })
      const member = await createTestMember(pkItbId)
      await trainingQuery.addAttendant(training.id, member.id)

      const result = await updateAttendantStatusAction(
        undefined,
        toFormData({
          trainingId: training.id,
          memberId: member.id,
          isPassing: 'true'
        })
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Kelulusan hanya dapat diubah setelah daurah selesai.'
      )
    })

    it('allows grading within the 30-day window after the training ends', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysAgo(10),
        endDate: daysAgo(5)
      })
      const member = await createTestMember(pkItbId)
      await trainingQuery.addAttendant(training.id, member.id)

      const result = await updateAttendantStatusAction(
        undefined,
        toFormData({
          trainingId: training.id,
          memberId: member.id,
          isPassing: 'true'
        })
      )

      expect(result.success).toBe(true)
    })

    it('rejects grading more than 30 days after the training ends', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysAgo(45),
        endDate: daysAgo(31)
      })
      const member = await createTestMember(pkItbId)
      await trainingQuery.addAttendant(training.id, member.id)

      const result = await updateAttendantStatusAction(
        undefined,
        toFormData({
          trainingId: training.id,
          memberId: member.id,
          isPassing: 'true'
        })
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Batas waktu 30 hari setelah daurah selesai telah terlampaui.'
      )
    })

    it('rejects grading for a training outside the org scope even within the window', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkOtherId, {
        startDate: daysAgo(10),
        endDate: daysAgo(5)
      })
      const member = await createTestMember(pkOtherId)
      await trainingQuery.addAttendant(training.id, member.id)

      const result = await updateAttendantStatusAction(
        undefined,
        toFormData({
          trainingId: training.id,
          memberId: member.id,
          isPassing: 'true'
        })
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      )
    })
  })
})
