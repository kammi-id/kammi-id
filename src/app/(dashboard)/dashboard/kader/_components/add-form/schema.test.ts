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
