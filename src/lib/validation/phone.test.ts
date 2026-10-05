import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import {
  decideBackfillPhone,
  isValidE164,
  normalizePhoneToE164,
  phoneFormField,
  toValidWaMeDigits,
  toWaMeDigits
} from './phone'

// ADR-0026 — tabel aturan: karakter pertama (sesudah pemisah dibuang)
// menentukan kode negaranya.
describe('normalizePhoneToE164 — tabel aturan ADR-0026', () => {
  test.each([
    ['08123456789', '+628123456789'],
    ['8123456789', '+628123456789'],
    ['628123456789', '+628123456789'],
    ['+971501234567', '+971501234567'],
    ['00971501234567', '+971501234567']
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhoneToE164(input)).toBe(expected)
  })

  test('spasi, tanda hubung, dan tanda kurung dibuang sebelum aturan dijalankan', () => {
    expect(normalizePhoneToE164('0812-3456-6710')).toBe('+6281234566710')
    expect(normalizePhoneToE164('(0812) 3456 6710')).toBe('+6281234566710')
    expect(normalizePhoneToE164('+62 812-3456-6710')).toBe('+6281234566710')
  })

  test('string kosong atau hanya-spasi kembali sebagai string kosong', () => {
    expect(normalizePhoneToE164('')).toBe('')
    expect(normalizePhoneToE164('   ')).toBe('')
  })
})

describe('phoneFormField — kelima baris tabel aturan menghasilkan keluaran yang tepat', () => {
  test.each([
    ['08123456789', '+628123456789'],
    ['8123456789', '+628123456789'],
    ['628123456789', '+628123456789'],
    ['+971501234567', '+971501234567'],
    ['00971501234567', '+971501234567']
  ])('%s -> %s, sah', (input, expected) => {
    const result = phoneFormField.safeParse(input)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toBe(expected)
  })
})

describe('phoneFormField — kolom kosong tetap sah', () => {
  test.each([undefined, null, ''])('%s sah', (value) => {
    expect(phoneFormField.safeParse(value).success).toBe(true)
  })
})

describe('phoneFormField — nomor Indonesia divalidasi ketat', () => {
  test('+62 tanpa awalan 8 ditolak dengan pesan yang bisa dibaca operator', () => {
    const result = phoneFormField.safeParse('+6271234567')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0].message).toContain('+62')
    expect(result.error.issues[0].message).toContain('8')
  })

  test('081234567 (kurang dari 9 digit lokal) ditolak', () => {
    // stripped: '081234567' -> +62 + '81234567' (8 digit lokal, < 9)
    expect(phoneFormField.safeParse('081234567').success).toBe(false)
  })

  test('nomor lokal 9 digit (batas bawah) sah', () => {
    // '8' + 8 digit = 9 digit lokal
    expect(phoneFormField.safeParse('812345678').success).toBe(true)
  })

  test('nomor lokal 13 digit (batas atas) sah', () => {
    // '8' + 12 digit = 13 digit lokal
    expect(phoneFormField.safeParse('0812345678901').success).toBe(true)
  })

  test('nomor lokal 14 digit (melebihi batas atas) ditolak', () => {
    expect(phoneFormField.safeParse('081234567890123').success).toBe(false)
  })
})

describe('phoneFormField — nomor asing hanya dicek bentuk E.164 umum', () => {
  test('nomor asing di luar 8-15 digit ditolak (terlalu pendek)', () => {
    // '+123456' -> 6 digit setelah '+', di bawah 8
    expect(phoneFormField.safeParse('+123456').success).toBe(false)
  })

  test('nomor asing di luar 8-15 digit ditolak (terlalu panjang)', () => {
    // 16 digit setelah '+'
    expect(phoneFormField.safeParse('+9715012345678901').success).toBe(false)
  })

  test('nomor asing 8 digit (batas bawah) sah', () => {
    expect(phoneFormField.safeParse('+12345678').success).toBe(true)
  })

  test('nomor asing 15 digit (batas atas) sah', () => {
    expect(phoneFormField.safeParse('+123456789012345').success).toBe(true)
  })
})

describe('phoneFormField — dipakai di dalam objek, galat menempel pada field-nya', () => {
  test('galat phone menempel pada path "phone"', () => {
    const schema = z.object({ name: z.string(), phone: phoneFormField })
    const result = schema.safeParse({ name: 'Fulan', phone: '+6271234567' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.flatten().fieldErrors.phone).toBeDefined()
  })
})

describe('decideBackfillPhone — hanya baris aman yang dikonversi (ADR-0026 Backfill)', () => {
  test.each([
    ['08123456789', '+628123456789'],
    ['8123456789', '+628123456789'],
    ['628123456789', '+628123456789'],
    ['0812-3456-6710', '+6281234566710']
  ])('%s -> %s', (input, expected) => {
    expect(decideBackfillPhone(input)).toBe(expected)
  })

  test.each([
    '0628123456789', // 062… ganda
    '+971501234567', // nomor asing, sengaja tidak disentuh backfill
    '-', // sisa karakter aneh
    '0812345', // terlalu pendek
    '0812345678901234' // terlalu panjang
  ])('%s dibiarkan utuh (null)', (input) => {
    expect(decideBackfillPhone(input)).toBeNull()
  })

  test('idempoten: hasil konversi tidak lagi cocok dengan pola aman, jadi dijalankan dua kali tidak mengubah apa pun', () => {
    const once = decideBackfillPhone('08123456789')
    expect(once).toBe('+628123456789')
    expect(decideBackfillPhone(once as string)).toBeNull()
  })
})

describe('isValidE164 — bentuk mentah diperiksa TANPA normalisasi (ADR-0026)', () => {
  test.each(['+628123456789', '+971501234567', '+12345678'])(
    '%s sah',
    (value) => {
      expect(isValidE164(value)).toBe(true)
    }
  )

  test.each([
    '0628123456789', // prefiks dobel — dibiarkan utuh oleh backfill
    '08123456789', // belum dinormalisasi, tanpa '+'
    '', // kosong
    '+6271234567', // +62 tanpa awalan 8
    '-' // sisa karakter aneh
  ])('%s tidak sah', (value) => {
    expect(isValidE164(value)).toBe(false)
  })
})

describe('toWaMeDigits — E.164 tanpa "+" untuk tautan wa.me (ADR-0026 Consequences)', () => {
  test.each([
    ['08123456789', '628123456789'],
    ['+971501234567', '971501234567'],
    ['+628123456789', '628123456789']
  ])('%s -> %s', (input, expected) => {
    expect(toWaMeDigits(input)).toBe(expected)
  })
})

describe('toValidWaMeDigits — satu pintu untuk member.phone -> digit wa.me, atau tidak ada tautan sama sekali', () => {
  test.each([
    ['+628123456789', '628123456789'],
    ['+971501234567', '971501234567'],
    ['  +628123456789  ', '628123456789'] // spasi di pinggir dibuang sebelum diperiksa
  ])('%s -> %s', (input, expected) => {
    expect(toValidWaMeDigits(input)).toBe(expected)
  })

  test.each([
    undefined,
    null,
    '',
    '   ',
    '08123456789', // belum dinormalisasi ke E.164 sama sekali
    '0628123456789' // prefiks dobel — dibiarkan utuh oleh backfill
  ])('%s -> undefined (tidak ada tautan)', (input) => {
    expect(toValidWaMeDigits(input)).toBeUndefined()
  })
})
