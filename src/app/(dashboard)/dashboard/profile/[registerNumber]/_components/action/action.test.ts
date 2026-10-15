import { describe, it, expect, afterAll, mock } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { member as memberTable } from '~/db/schema/member.sql'
import { organization as organizationTable } from '~/db/schema/organization.sql'
import { user as userTable } from '~/db/schema/user.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { updateMemberProfileAction, updateMemberPhotoAction } =
  await import('./action')

/**
 * ADR 0027 / Ticket 02 — Celah 1 & 3. Celah 1: `updateMemberProfileAction`
 * memilih skema dari peran, bukan dari isi FormData, jadi seorang `member`
 * tidak pernah menaikkan jenjangnya sendiri sekalipun POST-nya rakitan
 * tangan. Celah 3: BPK hanya boleh menyunting Kader di dalam Cakupannya —
 * jalur sunting dikomposisikan lewat `requireMemberEditAccess`, gerbang yang
 * sama dengan jalur baca.
 *
 * Fixture bersufiks, dibereskan sendiri di `afterAll` — bukan TRUNCATE.
 * Berkas ini menyentuh basis data staging bersama, yang juga disentuh
 * berkas tes lain yang berjalan paralel di worktree lain; TRUNCATE
 * memutus baris punya proses lain di tengah jalan (lihat
 * `db/query/member.test.ts`).
 */
const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const orgIds: string[] = []
const memberIds: string[] = []

afterAll(async () => {
  // `createOrganization` menyemai Akun kepengurusan (bph/bpk/bpw/humas)
  // terhubung ke tiap org — itu harus pergi lebih dulu, sebelum org-nya
  // sendiri dihapus, atau FK `user.connected_organization_id` menahannya.
  // Begitu juga `createMember`, yang menyemai Akun Kader terhubung.
  if (memberIds.length > 0) {
    await db
      .delete(userTable)
      .where(inArray(userTable.connectedMemberId, memberIds))
    await db.delete(memberTable).where(inArray(memberTable.id, memberIds))
  }
  if (orgIds.length > 0) {
    await db
      .delete(userTable)
      .where(inArray(userTable.connectedOrganizationId, orgIds))
    await db
      .delete(organizationTable)
      .where(inArray(organizationTable.id, orgIds))
  }
})

let orgCounter = 0
const seedOrg = async (
  type: 'pw' | 'pk',
  parentId: string | null
): Promise<string> => {
  orgCounter += 1
  const unique = `${suffix}-${orgCounter}`
  const [row] = await createOrganization({
    name: `Org ${unique}`,
    slug: `org-${unique}`,
    code: `C-${unique}`,
    type,
    parentId,
    isNonActive: false
  })
  orgIds.unshift(row.id)
  return row.id
}

let memberCounter = 0
const seedMember = async (
  organizationId: string,
  overrides: Partial<{
    status: 'ab1' | 'ab2' | 'ab3'
    isSuspended: boolean
    name: string
  }> = {}
) => {
  memberCounter += 1
  const [created] = await createMember({
    name: overrides.name ?? `Anggota Test ${suffix}-${memberCounter}`,
    registerNumber: `RN-${suffix}-${memberCounter}`,
    organizationId,
    status: overrides.status ?? 'ab1',
    gender: 'ikhwan',
    yearOfEntry: 2020,
    isSuspended: overrides.isSuspended ?? false
  })
  memberIds.unshift(created.id)
  return created
}

const memberRow = async (memberId: string) => {
  const [row] = await db
    .select()
    .from(memberTable)
    .where(eq(memberTable.id, memberId))
  return row
}

const formDataOf = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return fd
}

describe('updateMemberProfileAction', () => {
  it('menolak member yang mengirim status: ab3 untuk dirinya sendiri, baris tidak berubah', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId, { status: 'ab1' })
    mockSession = {
      user: { role: 'member', connectedMember: { id: created.id } }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({ name: created.name, gender: 'ikhwan', status: 'ab3' })
    )

    // Skema sunting-sendiri tidak punya `status` sama sekali, jadi parse-nya
    // tetap lolos — yang tidak boleh terjadi adalah baris itu berubah.
    expect(result.success).toBe(true)
    const row = await memberRow(created.id)
    expect(row?.status).toBe('ab1')
  })

  it('menolak member yang mengirim isSuspended: false saat sedang kena Sanksi', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId, { isSuspended: true })
    mockSession = {
      user: { role: 'member', connectedMember: { id: created.id } }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({ name: created.name, gender: 'ikhwan', isSuspended: 'false' })
    )

    expect(result.success).toBe(true)
    const row = await memberRow(created.id)
    expect(row?.isSuspended).toBe(true)
  })

  it('mengizinkan member menyunting kolom miliknya sendiri (nama)', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId)
    mockSession = {
      user: { role: 'member', connectedMember: { id: created.id } }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({ name: `Nama Dikoreksi ${suffix}`, gender: 'ikhwan' })
    )

    expect(result.success).toBe(true)
    const row = await memberRow(created.id)
    expect(row?.name).toBe(`Nama Dikoreksi ${suffix}`)
  })

  it('menolak member yang menyunting profil Kader lain', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId)
    mockSession = {
      user: { role: 'member', connectedMember: { id: 'lain-orangnya' } }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({ name: 'Rampasan', gender: 'ikhwan' })
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Akses ditolak.')
    const row = await memberRow(created.id)
    expect(row?.name).toBe(created.name)
  })

  it('menolak BPK PK menyunting Kader di luar Cakupannya', async () => {
    const pwA = await seedOrg('pw', null)
    const pwB = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)
    const pkOther = await seedOrg('pk', pwB)
    const created = await seedMember(pkOther, { status: 'ab1' })
    mockSession = {
      user: {
        role: 'bpk',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({
        name: created.name,
        gender: 'ikhwan',
        status: 'ab3',
        yearOfEntry: '2020'
      })
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Akses ditolak.')
    const row = await memberRow(created.id)
    expect(row?.status).toBe('ab1')
  })

  it('mengizinkan BPK PK menyunting kolom terkelola untuk Kader di dalam Cakupannya', async () => {
    const pwA = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)
    const created = await seedMember(pkMine, { status: 'ab1' })
    mockSession = {
      user: {
        role: 'bpk',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({
        name: created.name,
        gender: 'ikhwan',
        status: 'ab3',
        yearOfEntry: '2020'
      })
    )

    expect(result.success).toBe(true)
    const row = await memberRow(created.id)
    expect(row?.status).toBe('ab3')
  })

  it('mengizinkan root menyunting kolom terkelola untuk Kader di organisasi mana pun', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId, { status: 'ab1' })
    mockSession = { user: { role: 'root', connectedMember: null } }

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({
        name: created.name,
        gender: 'ikhwan',
        status: 'ab2',
        yearOfEntry: '2020'
      })
    )

    expect(result.success).toBe(true)
    const row = await memberRow(created.id)
    expect(row?.status).toBe('ab2')
  })

  it('menolak saat tidak ada sesi aktif', async () => {
    const pkId = await seedOrg('pk', null)
    const created = await seedMember(pkId)
    mockSession = undefined

    const result = await updateMemberProfileAction(
      created.id,
      {},
      formDataOf({ name: 'Rampasan', gender: 'ikhwan' })
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Tidak terautentikasi.')
  })
})

describe('updateMemberPhotoAction', () => {
  it('menolak BPK PK yang mengganti foto Kader di luar Cakupannya', async () => {
    const pwA = await seedOrg('pw', null)
    const pwB = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)
    const pkOther = await seedOrg('pk', pwB)
    const created = await seedMember(pkOther)
    mockSession = {
      user: {
        role: 'bpk',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }

    await expect(
      updateMemberPhotoAction(created.id, '/uploads/foto-baru.webp')
    ).rejects.toThrow('Akses ditolak.')

    const [row] = await db
      .select({ photo: memberTable.photo })
      .from(memberTable)
      .where(eq(memberTable.id, created.id))
    expect(row?.photo).toBeNull()
  })

  it('mengizinkan BPK PK mengganti foto Kader di dalam Cakupannya', async () => {
    const pwA = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)
    const created = await seedMember(pkMine)
    mockSession = {
      user: {
        role: 'bpk',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }

    await updateMemberPhotoAction(created.id, '/uploads/foto-baru.webp')

    const [row] = await db
      .select({ photo: memberTable.photo })
      .from(memberTable)
      .where(eq(memberTable.id, created.id))
    expect(row?.photo).toBe('/uploads/foto-baru.webp')
  })
})
