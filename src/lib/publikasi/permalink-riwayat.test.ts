import { expect, test, describe } from 'bun:test'
import {
  wasPermalinkBeritaLive,
  permalinkBeritaBerubah
} from './permalink-riwayat'

describe('wasPermalinkBeritaLive', () => {
  test('false untuk Halaman (type page) — skema Permalink ini bukan urusannya', () => {
    expect(
      wasPermalinkBeritaLive({
        type: 'page',
        status: 'published',
        slug: 'halaman',
        publishedAt: new Date('2026-01-01T00:00:00Z')
      })
    ).toBe(false)
  })

  test('false untuk draft', () => {
    expect(
      wasPermalinkBeritaLive({
        type: 'blog',
        status: 'draft',
        slug: 'contoh',
        publishedAt: null
      })
    ).toBe(false)
  })

  test('false untuk published tapi tanggalnya belum lewat (terjadwal)', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    expect(
      wasPermalinkBeritaLive({
        type: 'blog',
        status: 'published',
        slug: 'contoh',
        publishedAt: future
      })
    ).toBe(false)
  })

  test('true untuk published dan tanggalnya sudah lewat (Terbit)', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60)
    expect(
      wasPermalinkBeritaLive({
        type: 'blog',
        status: 'published',
        slug: 'contoh',
        publishedAt: past
      })
    ).toBe(true)
  })

  test('true untuk Diarsipkan — Permalink-nya tetap terbuka (CONTEXT.md)', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60)
    expect(
      wasPermalinkBeritaLive({
        type: 'blog',
        status: 'archived',
        slug: 'contoh',
        publishedAt: past
      })
    ).toBe(true)
  })

  test('true untuk Diarsipkan bahkan dengan tanggal di masa depan — tidak disaring tanggal', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    expect(
      wasPermalinkBeritaLive({
        type: 'blog',
        status: 'archived',
        slug: 'contoh',
        publishedAt: future
      })
    ).toBe(true)
  })
})

describe('permalinkBeritaBerubah', () => {
  test('false ketika slug dan bulan/tahun terbit sama', () => {
    expect(
      permalinkBeritaBerubah(
        { slug: 'contoh', publishedAt: new Date('2026-01-05T00:00:00Z') },
        { slug: 'contoh', publishedAt: new Date('2026-01-20T00:00:00Z') }
      )
    ).toBe(false)
  })

  test('true ketika slug berubah, tanggal sama', () => {
    expect(
      permalinkBeritaBerubah(
        { slug: 'lama', publishedAt: new Date('2026-01-05T00:00:00Z') },
        { slug: 'baru', publishedAt: new Date('2026-01-05T00:00:00Z') }
      )
    ).toBe(true)
  })

  test('true ketika tanggal terbit pindah bulan, slug sama', () => {
    expect(
      permalinkBeritaBerubah(
        { slug: 'contoh', publishedAt: new Date('2026-01-05T00:00:00Z') },
        { slug: 'contoh', publishedAt: new Date('2026-02-05T00:00:00Z') }
      )
    ).toBe(true)
  })

  test('true ketika tanggal terbit pindah tahun, slug sama', () => {
    expect(
      permalinkBeritaBerubah(
        { slug: 'contoh', publishedAt: new Date('2026-12-05T00:00:00Z') },
        { slug: 'contoh', publishedAt: new Date('2027-01-05T00:00:00Z') }
      )
    ).toBe(true)
  })
})
