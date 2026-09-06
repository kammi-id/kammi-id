import { describe, expect, test } from 'bun:test'
import { memberSchema } from './schema'

// ADR-0001: seorang Kader berada pada tepat satu Keadaan. Aktif diwakili oleh
// ketiadaan ketiga boolean, jadi aturannya di sini: paling banyak satu yang
// menyala. UI mengunci hal yang sama, tapi UI bukan pintu satu-satunya —
// `createMemberAction` menerima FormData mentah.
const baseMember = {
  name: 'Fulan',
  gender: 'ikhwan',
  status: 'ab2',
  yearOfEntry: '2020',
  organizationId: '5f1d2c3b-4a59-4c8e-9f10-2b3c4d5e6f70'
}

describe('memberSchema — tanggal lahir opsional', () => {
  test('tambah dan edit kader dengan tanggal lahir kosong menghasilkan NULL', () => {
    for (const id of [undefined, '11111111-1111-4111-8111-111111111111']) {
      const result = memberSchema.parse({ ...baseMember, id, birthDate: '' })
      expect(result.birthDate).toBeNull()
    }
  })

  test.each([null, undefined, '1998-05-12', '2000-02-29'])(
    'mempertahankan tanggal lahir %s',
    (birthDate) => {
      expect(memberSchema.parse({ ...baseMember, birthDate }).birthDate).toBe(
        birthDate
      )
    }
  )

  test.each(['bukan-tanggal', '12/05/1998', '2023-02-29', '2024-04-31'])(
    'tanggal tidak valid %s menjadi galat field',
    (birthDate) => {
      const result = memberSchema.safeParse({ ...baseMember, birthDate })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.flatten().fieldErrors.birthDate).toEqual([
        'Tanggal lahir tidak valid. Gunakan format YYYY-MM-DD.'
      ])
    }
  )
})

const parseKeadaan = (keadaan: {
  isAlumn?: string
  isNonActive?: string
  isSuspended?: string
}) => memberSchema.safeParse({ ...baseMember, ...keadaan })

describe('memberSchema — Keadaan Kader saling meniadakan', () => {
  test('ketiganya padam berarti Aktif, dan itu sah', () => {
    expect(parseKeadaan({}).success).toBe(true)
  })

  test.each([['isAlumn'], ['isNonActive'], ['isSuspended']])(
    'tepat satu Keadaan (%s) sah',
    (key) => {
      expect(parseKeadaan({ [key]: 'true' }).success).toBe(true)
    }
  )

  test.each([
    ['Alumni + Non-Aktif', { isAlumn: 'true', isNonActive: 'true' }],
    ['Alumni + Sanksi', { isAlumn: 'true', isSuspended: 'true' }],
    ['Non-Aktif + Sanksi', { isNonActive: 'true', isSuspended: 'true' }]
  ])('dua Keadaan sekaligus ditolak (%s)', (_label, keadaan) => {
    expect(parseKeadaan(keadaan).success).toBe(false)
  })

  test('ketiga Keadaan sekaligus ditolak', () => {
    const result = parseKeadaan({
      isAlumn: 'true',
      isNonActive: 'true',
      isSuspended: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('penolakan menempel pada ketiga field, supaya form bisa menandainya', () => {
    const result = parseKeadaan({ isAlumn: 'true', isSuspended: 'true' })
    if (result.success) throw new Error('seharusnya gagal')

    const fieldErrors = result.error.flatten().fieldErrors
    expect(fieldErrors.isAlumn).toBeDefined()
    expect(fieldErrors.isNonActive).toBeDefined()
    expect(fieldErrors.isSuspended).toBeDefined()
  })
})

// AB1 tidak pernah memegang Perangkat Pengkaderan — aturan bersama di
// `src/lib/validation/member.ts`, diuji lagi di sini sebagai titik integrasi
// pada `memberSchema` (UI mengunci hal yang sama, tapi bukan pintu satu-satunya).
describe('memberSchema — AB1 tidak pernah Pemandu maupun Instruktur', () => {
  test('AB1 + Pemandu ditolak', () => {
    const result = memberSchema.safeParse({
      ...baseMember,
      status: 'ab1',
      isCertifiedMentor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('AB1 + Instruktur ditolak', () => {
    const result = memberSchema.safeParse({
      ...baseMember,
      status: 'ab1',
      isCertifiedInstructor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('galat menempel pada kedua field sertifikasi', () => {
    const result = memberSchema.safeParse({
      ...baseMember,
      status: 'ab1',
      isCertifiedMentor: 'true',
      isCertifiedInstructor: 'true'
    })
    if (result.success) throw new Error('seharusnya gagal')

    const fieldErrors = result.error.flatten().fieldErrors
    expect(fieldErrors.isCertifiedMentor).toBeDefined()
    expect(fieldErrors.isCertifiedInstructor).toBeDefined()
  })

  test('AB1 tanpa sertifikasi tetap sah', () => {
    const result = memberSchema.safeParse({ ...baseMember, status: 'ab1' })
    expect(result.success).toBe(true)
  })

  test('AB2/AB3 dengan sertifikasi tetap sah', () => {
    expect(
      memberSchema.safeParse({
        ...baseMember,
        status: 'ab2',
        isCertifiedMentor: 'true'
      }).success
    ).toBe(true)
    expect(
      memberSchema.safeParse({
        ...baseMember,
        status: 'ab3',
        isCertifiedInstructor: 'true'
      }).success
    ).toBe(true)
  })
})
