import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  mock
} from 'bun:test'
import { db } from '~/db/db'
import { eq, inArray } from 'drizzle-orm'
import { organization } from '~/db/schema/organization.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { member } from '~/db/schema/member.sql'
import { training, trainingAttendants } from '~/db/schema/training.sql'
import { memberMutation } from '~/db/schema/member-mutation.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { hardDeleteMemberAction, readHardDeleteMemberRefusal } =
  await import('./action')
const { confirmationSentenceFor } = await import('./schema')

/**
 * ADR 0021. Bukan pengulangan `checkHardDeletionMember`'s own unit tests
 * (`src/lib/kekaderan/keadaan.test.ts`) — di sini yang diuji adalah bahwa
 * `readHardDeleteMemberRefusal`/`hardDeleteMemberAction` sungguhan
 * menyambungkannya ke enam tabel nyata, dan gerbangnya (Root + BPK PP).
 */
describe('aksi Hapus Selamanya Kader', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const memberIds: string[] = []
  const trainingIds: string[] = []
  let actorId: string
  let ppId: string
  let pkId: string

  const seedDeletedMember = async (name: string, registerNumber: string) => {
    const [row] = await db
      .insert(member)
      .values({
        name,
        organizationId: pkId,
        registerNumber,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2020,
        deletedAt: new Date()
      })
      .returning({ id: member.id })
    memberIds.push(row.id)
    return row.id
  }

  const memberExists = async (id: string) => {
    const [row] = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.id, id))
    return row !== undefined
  }

  const sessionOf = (role: string, organizationId: string | null) => ({
    user: {
      id: actorId,
      role,
      connectedOrganization: organizationId ? { id: organizationId } : null,
      connectedMember: null
    }
  })

  beforeAll(async () => {
    const [actor] = await db
      .insert(userTable)
      .values({
        name: `pelaku-hapus-selamanya-kader-${suffix}`,
        displayName: `Pelaku Hapus Selamanya Kader ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id

    const [pp] = await db
      .insert(organization)
      .values({
        name: `PP Hapus Kader Selamanya ${suffix}`,
        slug: `pp-hapus-kader-selamanya-${suffix}`,
        code: `PP-HKS-${suffix}`,
        type: 'pp',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    ppId = pp.id
    orgIds.push(pp.id)

    const [pk] = await db
      .insert(organization)
      .values({
        name: `PK Hapus Kader Selamanya ${suffix}`,
        slug: `pk-hapus-kader-selamanya-${suffix}`,
        code: `PK-HKS-${suffix}`,
        type: 'pk',
        parentId: pp.id,
        isNonActive: false
      })
      .returning({ id: organization.id })
    pkId = pk.id
    orgIds.push(pk.id)
  })

  afterAll(async () => {
    if (trainingIds.length) {
      await db
        .delete(trainingAttendants)
        .where(inArray(trainingAttendants.trainingId, trainingIds))
      await db.delete(training).where(inArray(training.id, trainingIds))
    }
    if (memberIds.length) {
      await db
        .delete(memberMutation)
        .where(inArray(memberMutation.memberId, memberIds))
      await db.delete(member).where(inArray(member.id, memberIds))
    }
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(() => {
    mockSession = sessionOf('root', null)
  })

  it('menolak Kader yang masih punya riwayat Daurah sebagai peserta', async () => {
    const memberId = await seedDeletedMember(
      `Kader Berdaurah ${suffix}`,
      `KDR-DRH-${suffix}`
    )
    const [trainingRow] = await db
      .insert(training)
      .values({
        organizationId: pkId,
        name: `Daurah Penahan Kader ${suffix}`,
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        type: 'dm1',
        identifier: 1
      })
      .returning({ id: training.id })
    trainingIds.push(trainingRow.id)
    await db
      .insert(trainingAttendants)
      .values({ trainingId: trainingRow.id, memberId })

    const refusal = await readHardDeleteMemberRefusal({ id: memberId })
    expect(refusal?.counts.trainingAttendant).toBe(1)

    const result = await hardDeleteMemberAction(
      memberId,
      confirmationSentenceFor(`Kader Berdaurah ${suffix}`),
      `KDR-DRH-${suffix}`
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('riwayat Daurah sebagai peserta')
    expect(await memberExists(memberId)).toBe(true)
  })

  it('menolak Kader yang masih punya riwayat mutasi', async () => {
    const memberId = await seedDeletedMember(
      `Kader Bermutasi ${suffix}`,
      `KDR-MUT-${suffix}`
    )
    await db.insert(memberMutation).values({
      memberId,
      fromOrganizationId: pkId,
      toOrganizationId: ppId,
      movedBy: actorId
    })

    const result = await hardDeleteMemberAction(
      memberId,
      confirmationSentenceFor(`Kader Bermutasi ${suffix}`),
      `KDR-MUT-${suffix}`
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('riwayat mutasi')
    expect(await memberExists(memberId)).toBe(true)
  })

  describe('gate — Root dan BPK PP saja', () => {
    it('menolak BPK yang terhubung ke PK, bukan PP', async () => {
      const memberId = await seedDeletedMember(
        `Kader Gate BPK ${suffix}`,
        `KDR-GT1-${suffix}`
      )
      mockSession = sessionOf('bpk', pkId)

      const result = await hardDeleteMemberAction(
        memberId,
        confirmationSentenceFor(`Kader Gate BPK ${suffix}`),
        `KDR-GT1-${suffix}`
      )

      expect(result.success).toBe(false)
      expect(await memberExists(memberId)).toBe(true)
    })

    it('menolak BPH, BPW, dan Humas', async () => {
      const memberId = await seedDeletedMember(
        `Kader Gate Lain ${suffix}`,
        `KDR-GT2-${suffix}`
      )
      for (const role of ['bph', 'bpw', 'humas']) {
        mockSession = sessionOf(role, ppId)
        const result = await hardDeleteMemberAction(
          memberId,
          confirmationSentenceFor(`Kader Gate Lain ${suffix}`),
          `KDR-GT2-${suffix}`
        )
        expect(result.success).toBe(false)
      }
      expect(await memberExists(memberId)).toBe(true)
    })

    it('menolak tanpa sesi', async () => {
      const memberId = await seedDeletedMember(
        `Kader Gate Sesi ${suffix}`,
        `KDR-GT3-${suffix}`
      )
      mockSession = undefined

      const result = await hardDeleteMemberAction(
        memberId,
        confirmationSentenceFor(`Kader Gate Sesi ${suffix}`),
        `KDR-GT3-${suffix}`
      )

      expect(result.success).toBe(false)
      expect(await memberExists(memberId)).toBe(true)
    })

    it('menerima BPK yang terhubung ke PP', async () => {
      const memberId = await seedDeletedMember(
        `Kader Gate BPK PP ${suffix}`,
        `KDR-GT4-${suffix}`
      )
      mockSession = sessionOf('bpk', ppId)

      const result = await hardDeleteMemberAction(
        memberId,
        confirmationSentenceFor(`Kader Gate BPK PP ${suffix}`),
        `KDR-GT4-${suffix}`
      )

      expect(result.success).toBe(true)
      expect(await memberExists(memberId)).toBe(false)
    })
  })

  it('menolak kalimat konfirmasi yang tidak sesuai', async () => {
    const memberId = await seedDeletedMember(
      `Kader Salah Kalimat ${suffix}`,
      `KDR-SK-${suffix}`
    )

    const result = await hardDeleteMemberAction(
      memberId,
      'Saya ingin menghapus Kader yang salah selamanya',
      `KDR-SK-${suffix}`
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe(
      'Kalimat konfirmasi yang dimasukkan tidak sesuai.'
    )
    expect(await memberExists(memberId)).toBe(true)
  })

  it('menolak NIA konfirmasi yang tidak sesuai, meski kalimatnya benar', async () => {
    const memberId = await seedDeletedMember(
      `Kader Salah NIA ${suffix}`,
      `KDR-SN-${suffix}`
    )

    const result = await hardDeleteMemberAction(
      memberId,
      confirmationSentenceFor(`Kader Salah NIA ${suffix}`),
      'NIA-SALAH'
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('NIA yang dimasukkan tidak sesuai.')
    expect(await memberExists(memberId)).toBe(true)
  })

  it('menolak Kader yang belum di-soft-delete sama sekali', async () => {
    const [row] = await db
      .insert(member)
      .values({
        name: `Kader Belum Terhapus ${suffix}`,
        organizationId: pkId,
        registerNumber: `KDR-BT-${suffix}`,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2020
      })
      .returning({ id: member.id })
    memberIds.push(row.id)

    const result = await hardDeleteMemberAction(
      row.id,
      confirmationSentenceFor(`Kader Belum Terhapus ${suffix}`),
      `KDR-BT-${suffix}`
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Kader tidak ditemukan.')
    expect(await memberExists(row.id)).toBe(true)
  })

  it('berhasil menghapus Kader tanpa riwayat, dan Akun-nya ikut lenyap lewat cascade', async () => {
    const name = `Kader Benar Kosong ${suffix}`
    const registerNumber = `KDR-KOSONG-${suffix}`
    const memberId = await seedDeletedMember(name, registerNumber)

    const [akun] = await db
      .insert(userTable)
      .values({
        name: registerNumber,
        displayName: name,
        passwordHash: 'x',
        role: 'member',
        connectedMemberId: memberId,
        deletedAt: new Date()
      })
      .returning({ id: userTable.id })

    const result = await hardDeleteMemberAction(
      memberId,
      confirmationSentenceFor(name),
      registerNumber
    )

    expect(result.success).toBe(true)
    expect(await memberExists(memberId)).toBe(false)

    const remainingAccount = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.id, akun.id))
    expect(remainingAccount).toHaveLength(0)
  })
})
