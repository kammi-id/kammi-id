import { describe, it, expect } from 'bun:test'
import {
  resolvePermalinkBerita,
  buildPermalinkBerita,
  canonicalPermalinkForHistoryTarget
} from './_permalink-berita'

// Instan sungguhan Berita "06:00 WIB 1 Jan 2026" (lihat tanggal-terbit.ts)
// adalah 2025-12-31T23:00:00Z. `now` di bawah dipilih relatif terhadap itu.
const publishedJan1_0600WIB = new Date(Date.UTC(2026, 0, 1, 6, 0, 0))
const setelahTerbit = new Date('2026-01-02T00:00:00Z')
const sebelumTerbit = new Date('2025-12-31T00:00:00Z')

describe('buildPermalinkBerita', () => {
  it('memformat bulan dua digit', () => {
    expect(buildPermalinkBerita(2026, 1, 'contoh')).toBe(
      '/berita/2026/01/contoh'
    )
    expect(buildPermalinkBerita(2026, 12, 'contoh')).toBe(
      '/berita/2026/12/contoh'
    )
  })
})

describe('resolvePermalinkBerita', () => {
  it('tidak ditemukan ketika baris tidak ada', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '01',
      slug: 'contoh',
      article: undefined
    })
    expect(outcome).toEqual({ kind: 'not-found' })
  })

  it('tidak ditemukan untuk draft', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '01',
      slug: 'contoh',
      article: { status: 'draft', publishedAt: publishedJan1_0600WIB },
      now: setelahTerbit
    })
    expect(outcome).toEqual({ kind: 'not-found' })
  })

  it('tidak ditemukan untuk Berita terjadwal (published tapi tanggalnya belum lewat)', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '01',
      slug: 'contoh',
      article: { status: 'published', publishedAt: publishedJan1_0600WIB },
      now: sebelumTerbit
    })
    expect(outcome).toEqual({ kind: 'not-found' })
  })

  it('ok untuk Berita Terbit (published dan tanggalnya sudah lewat) di alamat kanonik', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '01',
      slug: 'contoh',
      article: { status: 'published', publishedAt: publishedJan1_0600WIB },
      now: setelahTerbit
    })
    expect(outcome).toEqual({ kind: 'ok', noindex: false })
  })

  it('pengalihan permanen ketika tahun URL tidak kanonik', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2025', // salah — kanoniknya 2026
      requestedBulan: '01',
      slug: 'contoh',
      article: { status: 'published', publishedAt: publishedJan1_0600WIB },
      now: setelahTerbit
    })
    expect(outcome).toEqual({ kind: 'redirect', to: '/berita/2026/01/contoh' })
  })

  it('pengalihan permanen ketika bulan URL tidak kanonik (termasuk yang tidak zero-padded)', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '1', // bukan bentuk kanonik "01"
      slug: 'contoh',
      article: { status: 'published', publishedAt: publishedJan1_0600WIB },
      now: setelahTerbit
    })
    expect(outcome).toEqual({ kind: 'redirect', to: '/berita/2026/01/contoh' })
  })

  it('Diarsipkan selalu ok (tanpa syarat tanggal) dan ditandai noindex', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2026',
      requestedBulan: '01',
      slug: 'contoh',
      article: { status: 'archived', publishedAt: publishedJan1_0600WIB },
      now: sebelumTerbit // bahkan "sebelum" instan terbitnya — tetap tidak disaring tanggal
    })
    expect(outcome).toEqual({ kind: 'ok', noindex: true })
  })

  it('Diarsipkan dengan alamat tidak kanonik tetap dialihkan, bukan langsung ok', () => {
    const outcome = resolvePermalinkBerita({
      requestedTahun: '2020',
      requestedBulan: '06',
      slug: 'contoh',
      article: { status: 'archived', publishedAt: publishedJan1_0600WIB }
    })
    expect(outcome).toEqual({ kind: 'redirect', to: '/berita/2026/01/contoh' })
  })
})

describe('canonicalPermalinkForHistoryTarget', () => {
  it('null untuk Berita tujuan yang draft — riwayat menjamin baris ADA, bukan boleh dibaca publik', () => {
    expect(
      canonicalPermalinkForHistoryTarget({
        status: 'draft',
        publishedAt: publishedJan1_0600WIB,
        slug: 'contoh'
      })
    ).toBeNull()
  })

  it('null untuk Berita tujuan yang terjadwal (published tapi tanggalnya belum lewat)', () => {
    expect(
      canonicalPermalinkForHistoryTarget(
        {
          status: 'published',
          publishedAt: publishedJan1_0600WIB,
          slug: 'contoh'
        },
        sebelumTerbit
      )
    ).toBeNull()
  })

  it('permalink kanonik BARU untuk Berita tujuan yang Terbit', () => {
    expect(
      canonicalPermalinkForHistoryTarget(
        {
          status: 'published',
          publishedAt: publishedJan1_0600WIB,
          slug: 'slug-terkini'
        },
        setelahTerbit
      )
    ).toBe('/berita/2026/01/slug-terkini')
  })

  it('permalink kanonik BARU untuk Berita tujuan yang Diarsipkan, tanpa syarat tanggal', () => {
    expect(
      canonicalPermalinkForHistoryTarget(
        {
          status: 'archived',
          publishedAt: publishedJan1_0600WIB,
          slug: 'slug-terkini'
        },
        sebelumTerbit
      )
    ).toBe('/berita/2026/01/slug-terkini')
  })
})
