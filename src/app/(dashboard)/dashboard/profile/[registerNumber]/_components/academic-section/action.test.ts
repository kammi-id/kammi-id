import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { readMemberAcademic } from '~/db/query/academic'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { saveAcademicAction } = await import('./action')

describe('saveAcademicAction', () => {
  let memberId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", organization, member_academic CASCADE`
    )

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

    const member = await createMember({
      name: 'Anggota Test',
      registerNumber: 'PK01-0001',
      organizationId: pkItb.id,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    memberId = member[0].id

    mockSession = { user: { id: 'u1', role: 'root' } }
  })

  const buildFormData = (overrides: Record<string, string> = {}) => {
    const formData = new FormData()
    const fields: Record<string, string> = {
      degree: 's1',
      studyProgram: 'Teknik Informatika',
      institutionName: 'Universitas Fiktif Tanpa Vendor',
      institutionData: '{}',
      yearStart: '2020',
      yearEnd: '',
      isGraduated: 'false',
      ...overrides
    }
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value)
    }
    return formData
  }

  it('menyimpan entri manual (kampus tidak ada di indeks vendor) dengan institution_data kosong', async () => {
    const formData = buildFormData({
      institutionName: 'Universitas Kampus Belum Terdaftar Vendor',
      institutionData: '{}'
    })

    const result = await saveAcademicAction(memberId, {}, formData)

    expect(result.success).toBe(true)
    const rows = await readMemberAcademic(memberId)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.institutionName).toBe(
      'Universitas Kampus Belum Terdaftar Vendor'
    )
    expect(rows[0]?.institutionData).toEqual({})
  })

  it('memilih dari daftar vendor tetap menyimpan institution_data lengkap', async () => {
    const vendorData = {
      group: 'PTN',
      address: 'Jl. Veteran No. 1',
      name: 'Universitas Brawijaya',
      short_name: 'UB',
      province: 'Jawa Timur',
      province_code: '35',
      regency: 'Kota Malang',
      regency_code: '3573',
      long: 112.617,
      lat: -7.953,
      university_type: 'negeri'
    }
    const formData = buildFormData({
      institutionName: vendorData.name,
      institutionData: JSON.stringify(vendorData)
    })

    const result = await saveAcademicAction(memberId, {}, formData)

    expect(result.success).toBe(true)
    const rows = await readMemberAcademic(memberId)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.institutionName).toBe(vendorData.name)
    expect(rows[0]?.institutionData).toEqual(vendorData)
  })

  it('vendor sedang 429 (institutionData dikirim sebagai objek kosong oleh combobox) — formulir tetap tersimpan', async () => {
    // Ini meniru apa yang benar-benar dikirim UniversityCombobox saat vendor
    // membalas 429: dataField berisi '{}' sementara nameField tetap berisi
    // teks bebas yang diketik operator. saveAcademicAction sendiri tidak
    // pernah memanggil vendor, jadi ini membuktikan penyimpanan lepas total
    // dari ketersediaan use.api.co.id.
    const formData = buildFormData({
      institutionName: 'Kampus Yang Diketik Saat Vendor Down',
      institutionData: '{}'
    })

    const result = await saveAcademicAction(memberId, {}, formData)

    expect(result.success).toBe(true)
    expect(result.message).toBe('Data akademik ditambahkan.')
    const rows = await readMemberAcademic(memberId)
    expect(rows[0]?.institutionData).toEqual({})
  })
})
