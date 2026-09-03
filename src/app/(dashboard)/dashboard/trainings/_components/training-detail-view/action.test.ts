import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { and, eq, sql } from 'drizzle-orm'
import { trainingAttendants } from '~/db/schema/training.sql'
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

const {
  addAttendantAction,
  updateAttendantStatusAction,
  removeAttendantAction,
  searchTrainingAttendantsAction,
  searchTrainingInstructorsAction
} = await import('./action')

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
    overrides: {
      startDate: string
      endDate: string
      type?: 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'
    }
  ) => {
    const created = await trainingQuery.create({
      organizationId,
      name: 'DM1 Test',
      startDate: overrides.startDate,
      endDate: overrides.endDate,
      type: overrides.type ?? 'dm1'
    })
    return created
  }

  const createTestInstructor = async (
    organizationId: string,
    overrides: {
      status?: 'ab1' | 'ab2' | 'ab3'
      isCertifiedInstructor?: boolean
      registerNumber?: string
    } = {}
  ) => {
    const [created] = await createMember({
      name: 'Instruktur Test',
      registerNumber: overrides.registerNumber ?? 'PK01-0002',
      organizationId,
      status: overrides.status ?? 'ab3',
      gender: 'ikhwan',
      yearOfEntry: 2015,
      isCertifiedInstructor: overrides.isCertifiedInstructor ?? true
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

  // Mengeluarkan Peserta adalah pintu kedua menuju pencabutan Kelulusan. Yang
  // diuji di sini adalah percabangannya: hanya Peserta ber-Kelulusan yang
  // tunduk pada Masa Penetapan; sisanya koreksi roster biasa.
  describe('removeAttendantAction', () => {
    const seedAttendant = async (
      organizationId: string,
      dates: { startDate: string; endDate: string },
      isPassing: boolean
    ) => {
      const training = await createTraining(organizationId, dates)
      const member = await createTestMember(organizationId)
      await trainingQuery.addAttendant(training.id, member.id)
      if (isPassing)
        await trainingQuery.updateAttendantStatus(training.id, member.id, true)
      return { training, member }
    }

    // `readAttendantPassing` memetakan baris hilang ke `false`, jadi ia tidak
    // bisa membedakan "terhapus" dari "tidak lulus". Kasus yang berhasil
    // butuh pertanyaan yang lain.
    const attendantExists = async (trainingId: string, memberId: string) => {
      const rows = await db
        .select({ memberId: trainingAttendants.memberId })
        .from(trainingAttendants)
        .where(
          and(
            eq(trainingAttendants.trainingId, trainingId),
            eq(trainingAttendants.memberId, memberId)
          )
        )
      return rows.length > 0
    }

    it('rejects removing an attendant who holds a passing mark once the window has closed', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkItbId,
        { startDate: daysAgo(45), endDate: daysAgo(31) },
        true
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Batas waktu 30 hari setelah daurah selesai telah terlampaui.'
      )
      expect(
        await trainingQuery.readAttendantPassing(training.id, member.id)
      ).toBe(true)
    })

    // Sisi lain dari jendela yang tertutup. Bisa terjadi kalau Root menandai
    // Kelulusan sebelum Daurah selesai, lalu BPK mencoba mengeluarkan
    // Pesertanya. Pesannya memang berbicara soal Kelulusan, bukan soal
    // mengeluarkan Peserta — memang itu yang sedang dijaga.
    it('rejects removing an attendant who holds a passing mark before the training has ended', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkItbId,
        { startDate: daysFromNow(1), endDate: daysFromNow(3) },
        true
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Kelulusan hanya dapat diubah setelah daurah selesai.'
      )
      expect(await attendantExists(training.id, member.id)).toBe(true)
    })

    it('allows removing an attendant without a passing mark at any time', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkItbId,
        { startDate: daysAgo(45), endDate: daysAgo(31) },
        false
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(true)
      expect(await attendantExists(training.id, member.id)).toBe(false)
    })

    // Daurah yang belum selesai menutup Masa Penetapan lewat alasan yang lain.
    // Roster-nya tetap harus bisa dikoreksi selama daurah berlangsung.
    it('allows removing an unmarked attendant from a training that has not ended', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkItbId,
        { startDate: daysFromNow(1), endDate: daysFromNow(3) },
        false
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(true)
      expect(await attendantExists(training.id, member.id)).toBe(false)
    })

    it('allows removing a marked attendant while the window is still open', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkItbId,
        { startDate: daysAgo(10), endDate: daysAgo(5) },
        true
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(true)
      expect(await attendantExists(training.id, member.id)).toBe(false)
    })

    it('lets root remove a marked attendant long after the window has closed', async () => {
      mockSession = {
        user: { id: 'root1', role: 'root', connectedOrganizationId: null }
      }
      const { training, member } = await seedAttendant(
        pkOtherId,
        { startDate: daysAgo(45), endDate: daysAgo(31) },
        true
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(true)
      expect(await attendantExists(training.id, member.id)).toBe(false)
    })

    it('lets root remove an unmarked attendant long after the window has closed', async () => {
      mockSession = {
        user: { id: 'root1', role: 'root', connectedOrganizationId: null }
      }
      const { training, member } = await seedAttendant(
        pkOtherId,
        { startDate: daysAgo(45), endDate: daysAgo(31) },
        false
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(true)
      expect(await attendantExists(training.id, member.id)).toBe(false)
    })

    it('rejects removing an attendant from a training outside the org scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const { training, member } = await seedAttendant(
        pkOtherId,
        { startDate: daysFromNow(5), endDate: daysFromNow(7) },
        false
      )

      const result = await removeAttendantAction(training.id, member.id)

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      )
    })
  })

  describe('searchTrainingAttendantsAction', () => {
    it('rejects when there is no active session', async () => {
      mockSession = undefined
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      await createTestMember(pkItbId)

      const result = await searchTrainingAttendantsAction(
        training.id,
        'dm1',
        'Anggota'
      )

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })

    it('rejects searching a training outside the org scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkOtherId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      await createTestMember(pkOtherId)

      const result = await searchTrainingAttendantsAction(
        training.id,
        'dm1',
        'Anggota'
      )

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      )
    })

    it('searches when the training is in scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      const member = await createTestMember(pkItbId)

      const result = await searchTrainingAttendantsAction(
        training.id,
        'dm1',
        'Anggota'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toContain(member.id)
    })

    // Mengunci urutannya: gate harus mendahului pintasan panjang query. Tanpa
    // kasus ini, memindahkan gate ke bawah pintasan tetap membuat tes hijau.
    it('rejects a query too short to search before short-circuiting', async () => {
      mockSession = undefined
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })

      const result = await searchTrainingAttendantsAction(
        training.id,
        'dm1',
        'a'
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })
  })

  describe('searchTrainingInstructorsAction', () => {
    it('rejects when there is no active session', async () => {
      mockSession = undefined
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Anggota'
      )

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })

    it('rejects searching a training outside the org scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkOtherId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Anggota'
      )

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      )
    })

    it('searches when the training is in scope', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })
      const instructor = await createTestInstructor(pkItbId)

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Instruktur'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toContain(instructor.id)
    })

    it('rejects a query too short to search before short-circuiting', async () => {
      mockSession = undefined
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7)
      })

      const result = await searchTrainingInstructorsAction(training.id, 'a')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })

    // ADR 0022: jenjang minimum perangkat bergantung jenis Daurah yang
    // sedang dikelola, bukan satu angka global. Jalur Master calon (tiket
    // 03, add-training-modal) sudah diuji; ini jalur kedua — menambah
    // Instruktur ke Daurah yang SUDAH ada, dari halaman detailnya.
    it('accepts an AB2 certified instructor for DM1', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: 'dm1'
      })
      const instructor = await createTestInstructor(pkItbId, { status: 'ab2' })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Instruktur'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toContain(instructor.id)
    })

    it('rejects an AB2 certified instructor for DM3', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: 'dm3'
      })
      const instructor = await createTestInstructor(pkItbId, { status: 'ab2' })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Instruktur'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).not.toContain(instructor.id)
    })

    it('still accepts an AB3 certified instructor for DM3', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: 'dm3'
      })
      const instructor = await createTestInstructor(pkItbId, { status: 'ab3' })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Instruktur'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toContain(instructor.id)
    })

    it('never returns an AB2 without Instruktur certification, in any Daurah type', async () => {
      mockSession = {
        user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
      }
      const training = await createTraining(pkItbId, {
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: 'dm1'
      })
      const uncertified = await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: false
      })

      const result = await searchTrainingInstructorsAction(
        training.id,
        'Instruktur'
      )

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).not.toContain(uncertified.id)
    })
  })
})
