import { describe, it, expect } from 'bun:test'
import {
  deriveTahunBulanTerbit,
  isTerbit,
  wibWallClockToPublishedAt,
  publishedAtToWibWallClock,
  formatTanggalTerbit,
  toWibIsoString
} from './tanggal-terbit'

describe('deriveTahunBulanTerbit', () => {
  it('mengunci contoh ADR 0014: Berita pukul 06.00 WIB 1 Januari jatuh ke Januari, bukan Desember tahun sebelumnya', () => {
    // Driver membaca `timestamp` tanpa-zona dengan digit mentah = jam
    // dinding WIB langsung di slot UTC `Date` (lihat komentar di
    // tanggal-terbit.ts) — jadi `Date.UTC(2026, 0, 1, 6, 0, 0)` di sini
    // MEWAKILI baris DB "2026-01-01 06:00:00", persis nilai yang akan dibaca
    // kembali lewat drizzle.
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))

    const { tahun, bulan } = deriveTahunBulanTerbit(publishedAt)

    expect(tahun).toBe(2026)
    expect(bulan).toBe(1) // Januari — BUKAN 12 (Desember 2025)
  })

  it('menurunkan tengah hari dengan benar juga (kasus yang tidak pernah menangkap bug ini)', () => {
    const publishedAt = new Date(Date.UTC(2026, 5, 15, 12, 0, 0))
    expect(deriveTahunBulanTerbit(publishedAt)).toEqual({
      tahun: 2026,
      bulan: 6
    })
  })

  it('menurunkan akhir Desember dengan benar', () => {
    const publishedAt = new Date(Date.UTC(2026, 11, 31, 23, 59, 0))
    expect(deriveTahunBulanTerbit(publishedAt)).toEqual({
      tahun: 2026,
      bulan: 12
    })
  })
})

describe('isTerbit', () => {
  it('Berita dengan tanggal terbit di masa lalu adalah Terbit', () => {
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
    // Instan sungguhan Berita ini adalah 2025-12-31T23:00:00Z (WIB - 7 jam).
    const now = new Date('2026-01-01T00:00:00Z') // sudah lewat instan sungguhannya
    expect(isTerbit(publishedAt, now)).toBe(true)
  })

  it('Berita terjadwal di masa depan bukan Terbit', () => {
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
    const now = new Date('2025-12-31T22:00:00Z') // sebelum instan sungguhannya
    expect(isTerbit(publishedAt, now)).toBe(false)
  })

  it('null publishedAt bukan Terbit', () => {
    expect(isTerbit(null)).toBe(false)
  })

  it('tepat pada instan terbitnya sudah dianggap Terbit (lewat, bukan sesudah)', () => {
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
    const now = new Date('2025-12-31T23:00:00Z')
    expect(isTerbit(publishedAt, now)).toBe(true)
  })
})

describe('wibWallClockToPublishedAt / publishedAtToWibWallClock', () => {
  it('adalah pasangan yang saling membalik untuk jam dinding WIB', () => {
    const local = '2026-01-01T06:00'
    const asDate = wibWallClockToPublishedAt(local)
    expect(asDate).not.toBeNull()
    expect(publishedAtToWibWallClock(asDate as Date)).toBe(local)
  })

  it('menaruh digit langsung ke slot UTC, bukan mengonversi lewat TZ proses', () => {
    const asDate = wibWallClockToPublishedAt('2026-01-01T06:00')
    expect(asDate?.getUTCFullYear()).toBe(2026)
    expect(asDate?.getUTCMonth()).toBe(0)
    expect(asDate?.getUTCDate()).toBe(1)
    expect(asDate?.getUTCHours()).toBe(6)
  })

  it('menghasilkan tahun/bulan yang benar lewat deriveTahunBulanTerbit setelah roundtrip', () => {
    const asDate = wibWallClockToPublishedAt('2026-01-01T06:00')
    expect(deriveTahunBulanTerbit(asDate as Date)).toEqual({
      tahun: 2026,
      bulan: 1
    })
  })

  it('mengembalikan null untuk string yang tidak cocok pola', () => {
    expect(wibWallClockToPublishedAt('bukan-tanggal')).toBeNull()
  })
})

describe('formatTanggalTerbit', () => {
  it('memformat 06:00 WIB 1 Januari 2026 sebagai "1 Januari 2026", bukan 31 Desember 2025', () => {
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
    expect(formatTanggalTerbit(publishedAt)).toBe('1 Januari 2026')
  })

  it('memformat bulan lain dengan benar', () => {
    const publishedAt = new Date(Date.UTC(2026, 7, 17, 10, 0, 0))
    expect(formatTanggalTerbit(publishedAt)).toBe('17 Agustus 2026')
  })
})

describe('toWibIsoString', () => {
  it('membubuhkan offset +07:00 eksplisit dari digit yang sama, bukan mengonversi ulang', () => {
    const publishedAt = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
    expect(toWibIsoString(publishedAt)).toBe('2026-01-01T06:00:00+07:00')
  })
})
