import { describe, expect, test } from 'bun:test'
import { profileSchema } from './schema'

const baseProfile = {
  name: 'Fulan',
  gender: 'ikhwan',
  status: 'ab2',
  yearOfEntry: '2020'
}

describe('profileSchema — tanggal lahir opsional', () => {
  test('koreksi nama dengan tanggal lahir kosong menghasilkan NULL untuk database', () => {
    const formData = new FormData()
    for (const [key, value] of Object.entries({
      ...baseProfile,
      name: 'Nama Dikoreksi',
      status: 'ab3',
      isCertifiedMentor: 'true',
      isCertifiedInstructor: 'true',
      birthDate: ''
    })) {
      formData.set(key, value)
    }

    const result = profileSchema.parse(Object.fromEntries(formData.entries()))
    expect(result.name).toBe('Nama Dikoreksi')
    expect(result.birthDate).toBeNull()
  })

  test.each([null, undefined, '1998-05-12', '2000-02-29'])(
    'mempertahankan tanggal lahir %s',
    (birthDate) => {
      expect(profileSchema.parse({ ...baseProfile, birthDate }).birthDate).toBe(
        birthDate
      )
    }
  )

  test.each(['bukan-tanggal', '12/05/1998', '2023-02-29', '2024-04-31'])(
    'tanggal tidak valid %s menjadi galat field',
    (birthDate) => {
      const result = profileSchema.safeParse({ ...baseProfile, birthDate })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.flatten().fieldErrors.birthDate).toEqual([
        'Tanggal lahir tidak valid. Gunakan format YYYY-MM-DD.'
      ])
    }
  )
})

describe('profileSchema — AB1 tidak pernah Pemandu maupun Instruktur', () => {
  test('AB1 + Pemandu ditolak', () => {
    const result = profileSchema.safeParse({
      ...baseProfile,
      status: 'ab1',
      isCertifiedMentor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('AB1 + Instruktur ditolak', () => {
    const result = profileSchema.safeParse({
      ...baseProfile,
      status: 'ab1',
      isCertifiedInstructor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('galat menempel pada kedua field sertifikasi', () => {
    const result = profileSchema.safeParse({
      ...baseProfile,
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
    const result = profileSchema.safeParse({ ...baseProfile, status: 'ab1' })
    expect(result.success).toBe(true)
  })

  test('AB1 tanpa field sertifikasi sama sekali (block dihilangkan dari form) default ke false dan tetap sah', () => {
    const result = profileSchema.safeParse({
      name: 'Fulan',
      gender: 'ikhwan',
      status: 'ab1',
      yearOfEntry: '2020'
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.isCertifiedMentor).toBe(false)
    expect(result.data.isCertifiedInstructor).toBe(false)
  })

  test('AB2/AB3 dengan sertifikasi tetap sah', () => {
    expect(
      profileSchema.safeParse({
        ...baseProfile,
        status: 'ab2',
        isCertifiedMentor: 'true'
      }).success
    ).toBe(true)
    expect(
      profileSchema.safeParse({
        ...baseProfile,
        status: 'ab3',
        isCertifiedInstructor: 'true'
      }).success
    ).toBe(true)
  })
})
