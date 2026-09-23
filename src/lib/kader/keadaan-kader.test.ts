import { describe, expect, test } from 'bun:test'
import { deriveKeadaanKader, keadaanKaderLabel } from './keadaan-kader'

describe('deriveKeadaanKader', () => {
  test('returns aktif when no flag is set', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: false,
        isSuspended: false,
        isNonActive: false
      })
    ).toBe('aktif')
  })

  test('returns sanksi when isSuspended is set', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: false,
        isSuspended: true,
        isNonActive: false
      })
    ).toBe('sanksi')
  })

  test('returns non-aktif when isNonActive is set', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: false,
        isSuspended: false,
        isNonActive: true
      })
    ).toBe('non-aktif')
  })

  test('returns alumni when isAlumn is set', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: true,
        isSuspended: false,
        isNonActive: false
      })
    ).toBe('alumni')
  })

  // Alumni "menggantikan Keadaan sebelumnya" (CONTEXT.md) — takes precedence
  // over any other flag left set alongside it.
  test('alumni takes precedence over isSuspended and isNonActive', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: true,
        isSuspended: true,
        isNonActive: true
      })
    ).toBe('alumni')
  })

  test('sanksi takes precedence over non-aktif', () => {
    expect(
      deriveKeadaanKader({
        isAlumn: false,
        isSuspended: true,
        isNonActive: true
      })
    ).toBe('sanksi')
  })
})

describe('keadaanKaderLabel', () => {
  test('maps every Keadaan to its Indonesian label', () => {
    expect(keadaanKaderLabel.aktif).toBe('Aktif')
    expect(keadaanKaderLabel.sanksi).toBe('Sanksi')
    expect(keadaanKaderLabel['non-aktif']).toBe('Non-Aktif')
    expect(keadaanKaderLabel.alumni).toBe('Alumni')
  })
})
