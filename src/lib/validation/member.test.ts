import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import {
  booleanFormField,
  isAb1WithCertification,
  refineAb1Certification
} from './member'

describe('booleanFormField', () => {
  test('coerces the FormData strings "true"/"false", case-insensitively', () => {
    expect(booleanFormField.parse('true')).toBe(true)
    expect(booleanFormField.parse('True')).toBe(true)
    expect(booleanFormField.parse('false')).toBe(false)
    expect(booleanFormField.parse('False')).toBe(false)
  })

  test('passes an already-boolean value through unchanged', () => {
    expect(booleanFormField.parse(true)).toBe(true)
    expect(booleanFormField.parse(false)).toBe(false)
  })

  test('rejects a string that is neither "true" nor "false"', () => {
    expect(booleanFormField.safeParse('yes').success).toBe(false)
  })
})

describe('isAb1WithCertification', () => {
  test('AB1 tanpa sertifikasi apa pun bukan pelanggaran', () => {
    expect(
      isAb1WithCertification({
        status: 'ab1',
        isCertifiedMentor: false,
        isCertifiedInstructor: false
      })
    ).toBe(false)
  })

  test('AB1 + Pemandu adalah pelanggaran', () => {
    expect(
      isAb1WithCertification({ status: 'ab1', isCertifiedMentor: true })
    ).toBe(true)
  })

  test('AB1 + Instruktur adalah pelanggaran', () => {
    expect(
      isAb1WithCertification({ status: 'ab1', isCertifiedInstructor: true })
    ).toBe(true)
  })

  test('AB1 + keduanya tetap satu pelanggaran', () => {
    expect(
      isAb1WithCertification({
        status: 'ab1',
        isCertifiedMentor: true,
        isCertifiedInstructor: true
      })
    ).toBe(true)
  })

  test('AB2/AB3 dengan sertifikasi bukan pelanggaran', () => {
    expect(
      isAb1WithCertification({ status: 'ab2', isCertifiedMentor: true })
    ).toBe(false)
    expect(
      isAb1WithCertification({ status: 'ab3', isCertifiedInstructor: true })
    ).toBe(false)
  })
})

const testSchema = z
  .object({
    status: z.enum(['ab1', 'ab2', 'ab3']),
    isCertifiedMentor: z.boolean().default(false),
    isCertifiedInstructor: z.boolean().default(false)
  })
  .superRefine(refineAb1Certification)

describe('refineAb1Certification lewat .superRefine', () => {
  test('menolak AB1 + Pemandu, galat menempel pada kedua field', () => {
    const result = testSchema.safeParse({
      status: 'ab1',
      isCertifiedMentor: true
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const fieldErrors = result.error.flatten().fieldErrors
    expect(fieldErrors.isCertifiedMentor).toBeDefined()
    expect(fieldErrors.isCertifiedInstructor).toBeDefined()
  })

  test('menolak AB1 + Instruktur', () => {
    const result = testSchema.safeParse({
      status: 'ab1',
      isCertifiedInstructor: true
    })
    expect(result.success).toBe(false)
  })

  test('menerima AB1 tanpa sertifikasi', () => {
    const result = testSchema.safeParse({ status: 'ab1' })
    expect(result.success).toBe(true)
  })

  test('menerima AB2/AB3 dengan sertifikasi', () => {
    expect(
      testSchema.safeParse({ status: 'ab2', isCertifiedMentor: true }).success
    ).toBe(true)
    expect(
      testSchema.safeParse({ status: 'ab3', isCertifiedInstructor: true })
        .success
    ).toBe(true)
  })
})
