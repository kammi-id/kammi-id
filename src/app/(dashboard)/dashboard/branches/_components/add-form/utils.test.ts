import { expect, test, describe } from 'bun:test'
import { isSlugChangeHazardous } from './utils'

describe('isSlugChangeHazardous', () => {
  test('false saat menambah Struktur baru (tidak ada editData)', () => {
    expect(isSlugChangeHazardous(null, 'apa-saja')).toBe(false)
  })

  test('false saat slug tidak berubah', () => {
    expect(
      isSlugChangeHazardous({ slug: 'tetap', isSiteActive: true }, 'tetap')
    ).toBe(false)
  })

  test('false saat slug berubah tapi Situsnya belum aktif', () => {
    expect(
      isSlugChangeHazardous({ slug: 'lama', isSiteActive: false }, 'baru')
    ).toBe(false)
  })

  test('true saat slug berubah DAN Situsnya sudah aktif', () => {
    expect(
      isSlugChangeHazardous({ slug: 'lama', isSiteActive: true }, 'baru')
    ).toBe(true)
  })
})
