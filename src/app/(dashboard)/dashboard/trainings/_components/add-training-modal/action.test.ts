import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import {
  trainingQuery,
  searchEligibleInstructors,
  type TrainingType
} from '~/db/query/training'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { searchMasterCandidatesAction, createTrainingAction } =
  await import('./action')

// Bentuknya mengikuti `withSessionCTE` (`db/query/cte/session.ts`), yang
// menyusun `connectedOrganization` sebagai objek — bukan `connectedOrganizationId`.
// `mockSession` bertipe `unknown`, jadi tsc tidak akan menegur fixture yang
// berbohong; bentuknya dijaga di sini.
const sessionOf = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    name: 'penguji',
    displayName: 'Penguji',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null,
    connectedMember: null
  }
})

const toFormData = (fields: Record<string, string>): FormData => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return fd
}

const daysFromNow = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('add-training-modal actions', () => {
  let pkItbId: string

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

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id
  })

  let memberSeq = 0
  const createTestInstructor = async (
    organizationId: string,
    overrides: {
      status?: 'ab1' | 'ab2' | 'ab3'
      isCertifiedInstructor?: boolean
    } = {}
  ) => {
    memberSeq += 1
    const [created] = await createMember({
      name: 'Instruktur Test',
      registerNumber: `PK01-${String(memberSeq).padStart(4, '0')}`,
      organizationId,
      status: overrides.status ?? 'ab3',
      gender: 'ikhwan',
      yearOfEntry: 2015,
      isCertifiedInstructor: overrides.isCertifiedInstructor ?? true
    })
    return created
  }

  describe('searchMasterCandidatesAction', () => {
    it('rejects when there is no active session', async () => {
      mockSession = undefined
      await createTestInstructor(pkItbId)

      const result = await searchMasterCandidatesAction('Instruktur', 'dm1')

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
    })

    it('rejects a role that may not hold a daurah', async () => {
      mockSession = sessionOf('bpw', pkItbId)
      await createTestInstructor(pkItbId)

      const result = await searchMasterCandidatesAction('Instruktur', 'dm1')

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
    })

    // Aksi ini endpoint POST tersendiri; pemanggilnya belum tentu form yang
    // sudah menyaring di sisi klien. Gate harus mendahului pintasan
    // `query.length < 2`, bukan bersembunyi di baliknya.
    it('runs the gate before the short-query shortcut', async () => {
      mockSession = undefined

      const result = await searchMasterCandidatesAction('a', 'dm1')

      expect(result.success).toBe(false)
    })

    it('keeps the short-query shortcut for a caller that may hold a daurah', async () => {
      mockSession = sessionOf('bpk', pkItbId)

      const result = await searchMasterCandidatesAction('a', 'dm1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('searches when the caller may hold a daurah', async () => {
      mockSession = sessionOf('bpk', pkItbId)
      const instructor = await createTestInstructor(pkItbId)

      const result = await searchMasterCandidatesAction('Instruktur', 'dm1')

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toEqual([instructor.id])
    })

    it('allows root as well', async () => {
      mockSession = sessionOf('root', null)
      const instructor = await createTestInstructor(pkItbId)

      const result = await searchMasterCandidatesAction('Instruktur', 'dm1')

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toEqual([instructor.id])
    })

    // ADR 0022 / tiket 03: jenjang minimum perangkat bergantung jenis Daurah
    // yang sedang dibuat. Master of Training ikut longgar — bukan
    // dikecualikan, seperti diputuskan (dan opsi pengecualiannya ditolak)
    // dalam ADR.
    it('accepts an AB2 certified instructor as Master candidate for DM1', async () => {
      mockSession = sessionOf('bpk', pkItbId)
      const candidate = await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: true
      })

      const result = await searchMasterCandidatesAction('Instruktur', 'dm1')

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toEqual([candidate.id])
    })

    it('rejects an AB2 candidate as Master of Training for DM3', async () => {
      mockSession = sessionOf('bpk', pkItbId)
      await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: true
      })

      const result = await searchMasterCandidatesAction('Instruktur', 'dm3')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('still accepts an AB3 certified instructor as Master candidate for DM3', async () => {
      mockSession = sessionOf('bpk', pkItbId)
      const candidate = await createTestInstructor(pkItbId, {
        status: 'ab3',
        isCertifiedInstructor: true
      })

      const result = await searchMasterCandidatesAction('Instruktur', 'dm3')

      expect(result.success).toBe(true)
      expect(result.data.map((m) => m.id)).toEqual([candidate.id])
    })

    it('never returns an AB2 without Instruktur certification, whatever the Daurah type', async () => {
      mockSession = sessionOf('bpk', pkItbId)
      await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: false
      })

      const dm1Result = await searchMasterCandidatesAction('Instruktur', 'dm1')
      const dm3Result = await searchMasterCandidatesAction('Instruktur', 'dm3')

      expect(dm1Result.data).toEqual([])
      expect(dm3Result.data).toEqual([])
    })
  })

  // `searchEligibleInstructors` menyaring Instruktur untuk Daurah yang sudah
  // ada, menurunkan jenjang minimum dari `trainingId`-nya sendiri (bukan
  // parameter terpisah) — lihat tiket 03 & ADR 0022.
  describe('searchEligibleInstructors (jenjang per jenis Daurah)', () => {
    const createTestTraining = async (type: TrainingType) => {
      const daysFromNowLocal = (days: number) => {
        const d = new Date()
        d.setDate(d.getDate() + days)
        return d.toISOString().slice(0, 10)
      }
      return trainingQuery.create({
        organizationId: pkItbId,
        name: `${type.toUpperCase()} Test`,
        startDate: daysFromNowLocal(5),
        endDate: daysFromNowLocal(7),
        type
      })
    }

    it.each(['dm1', 'dm2', 'dpmk', 'tfi'] as const)(
      'lets a certified AB2 instructor through for %s',
      async (type) => {
        const training = await createTestTraining(type)
        const candidate = await createTestInstructor(pkItbId, {
          status: 'ab2',
          isCertifiedInstructor: true
        })

        const results = await searchEligibleInstructors(
          training.id,
          'Instruktur'
        )

        expect(results.map((m) => m.id)).toEqual([candidate.id])
      }
    )

    it('excludes a certified AB2 instructor for DM3', async () => {
      const training = await createTestTraining('dm3')
      await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: true
      })

      const results = await searchEligibleInstructors(training.id, 'Instruktur')

      expect(results).toEqual([])
    })

    it('still lets a certified AB3 instructor through for DM3', async () => {
      const training = await createTestTraining('dm3')
      const candidate = await createTestInstructor(pkItbId, {
        status: 'ab3',
        isCertifiedInstructor: true
      })

      const results = await searchEligibleInstructors(training.id, 'Instruktur')

      expect(results.map((m) => m.id)).toEqual([candidate.id])
    })

    it('never returns an AB2 without Instruktur certification, in any Daurah type', async () => {
      const dm1Training = await createTestTraining('dm1')
      const dm3Training = await createTestTraining('dm3')
      await createTestInstructor(pkItbId, {
        status: 'ab2',
        isCertifiedInstructor: false
      })

      const dm1Results = await searchEligibleInstructors(
        dm1Training.id,
        'Instruktur'
      )
      const dm3Results = await searchEligibleInstructors(
        dm3Training.id,
        'Instruktur'
      )

      expect(dm1Results).toEqual([])
      expect(dm3Results).toEqual([])
    })
  })

  // Jalur Kewenangan aksi ini ikut dialihkan ke `requireDaurahCreationAccess`
  // bersama tiket 04, jadi ketiga jalurnya dikunci di sini.
  describe('createTrainingAction', () => {
    const validForm = async () => {
      const master = await createTestInstructor(pkItbId)
      return toFormData({
        organizationId: pkItbId,
        name: 'DM1 Test',
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: 'dm1',
        masterId: master.id
      })
    }

    it('rejects when there is no active session', async () => {
      mockSession = undefined

      const result = await createTrainingAction(
        { success: false, message: '' },
        await validForm()
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Sesi tidak ditemukan.')
    })

    it('rejects a role that may not hold a daurah', async () => {
      mockSession = sessionOf('bpw', pkItbId)

      const result = await createTrainingAction(
        { success: false, message: '' },
        await validForm()
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Antum tidak memiliki hak akses untuk menambah daurah.'
      )
    })

    it('creates a daurah when the caller may hold one', async () => {
      mockSession = sessionOf('bpk', pkItbId)

      const result = await createTrainingAction(
        { success: false, message: '' },
        await validForm()
      )

      expect(result.success).toBe(true)
    })
  })
})
