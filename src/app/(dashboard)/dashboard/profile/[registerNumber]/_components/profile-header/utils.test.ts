import { describe, expect, test } from 'bun:test'
import { formatAge } from './utils'

const pad = (n: number) => String(n).padStart(2, '0')

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`

// Referensi independen: hitung total bulan sejak lahir (bukan tahun+bulan
// yang dikurangi lalu dipinjam seperti `formatAge`), lalu pecah jadi
// tahun+sisa bulan. Kalau `formatAge` benar, keduanya harus selalu setuju —
// termasuk pada kasus peminjaman bulan/tanggal yang sengaja dites di bawah.
const referenceAge = (
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  now: Date
): string => {
  let totalMonths =
    (now.getFullYear() - birthYear) * 12 + (now.getMonth() - birthMonth)
  if (now.getDate() < birthDay) totalMonths -= 1
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  return `${years} tahun, ${months} bulan`
}

describe('formatAge', () => {
  test('birthDate null -> null', () => {
    expect(formatAge(null)).toBeNull()
  })

  test('string tanggal yang tidak valid -> null', () => {
    expect(formatAge('bukan-tanggal')).toBeNull()
  })

  test('tepat N tahun, tanpa sisa bulan (bulan & tanggal lahir sama dengan hari ini)', () => {
    const now = new Date()
    const years = 20
    const birthDate = toIsoDate(now.getFullYear() - years, now.getMonth(), now.getDate())

    expect(formatAge(birthDate)).toBe(`${years} tahun, 0 bulan`)
  })

  test('meminjam tahun saat bulan lahir jatuh setelah bulan sekarang', () => {
    const now = new Date()
    const years = 18
    const birthYear = now.getFullYear() - years
    const birthMonth = (now.getMonth() + 3) % 12
    const birthDay = now.getDate()
    const birthDate = toIsoDate(birthYear, birthMonth, birthDay)

    expect(formatAge(birthDate)).toBe(
      referenceAge(birthYear, birthMonth, birthDay, now)
    )
  })

  test('meminjam tanggal: lahir tanggal 30, dicek pada bulan yang lebih pendek atau tanggal lebih awal', () => {
    const now = new Date()
    const years = 25
    const birthYear = now.getFullYear() - years
    const birthMonth = now.getMonth()
    const birthDay = 30
    const birthDate = toIsoDate(birthYear, birthMonth, birthDay)

    expect(formatAge(birthDate)).toBe(
      referenceAge(birthYear, birthMonth, birthDay, now)
    )
  })

  test('konsisten dengan referensi independen untuk rentang tanggal lahir', () => {
    const now = new Date()
    const samples: Array<[number, number, number]> = [
      [now.getFullYear() - 30, 0, 1],
      [now.getFullYear() - 17, 11, 31],
      [now.getFullYear() - 45, 5, 15],
      [now.getFullYear() - 1, now.getMonth(), 1]
    ]

    for (const [year, month, day] of samples) {
      const birthDate = toIsoDate(year, month, day)
      expect(formatAge(birthDate)).toBe(referenceAge(year, month, day, now))
    }
  })
})
