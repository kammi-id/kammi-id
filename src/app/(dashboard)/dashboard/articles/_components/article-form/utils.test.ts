import { describe, expect, test } from 'bun:test'
import { articlePernahTerbit, slugify } from './utils'

describe('slugify', () => {
  test('judul biasa jadi kebab-case huruf kecil', () => {
    expect(slugify('Rakernas KAMMI 2026')).toBe('rakernas-kammi-2026')
  })

  test('membuang karakter selain huruf, angka, spasi, dan tanda hubung', () => {
    expect(slugify('KAMMI: Membangun Peradaban!')).toBe(
      'kammi-membangun-peradaban'
    )
  })

  test('spasi berturut-turut dan tanda hubung ganda dirapikan jadi satu', () => {
    expect(slugify('  Judul   Panjang -- Sekali  ')).toBe(
      'judul-panjang-sekali'
    )
  })
})

describe('articlePernahTerbit', () => {
  const now = new Date('2026-06-01T00:00:00.000Z')

  test('Halaman draft belum pernah terbit', () => {
    expect(
      articlePernahTerbit({ type: 'page', status: 'draft', publishedAt: null }, now)
    ).toBe(false)
  })

  test('Halaman published sudah pernah terbit — tak bertanggal, tidak digerbangi tanggal', () => {
    expect(
      articlePernahTerbit(
        { type: 'page', status: 'published', publishedAt: null },
        now
      )
    ).toBe(true)
  })

  test('Halaman archived sudah pernah terbit', () => {
    expect(
      articlePernahTerbit(
        { type: 'page', status: 'archived', publishedAt: null },
        now
      )
    ).toBe(true)
  })

  test('Berita draft belum pernah terbit', () => {
    expect(
      articlePernahTerbit({ type: 'blog', status: 'draft', publishedAt: null }, now)
    ).toBe(false)
  })

  test('Berita published terjadwal di masa depan belum pernah terbit', () => {
    expect(
      articlePernahTerbit(
        {
          type: 'blog',
          status: 'published',
          publishedAt: new Date('2026-12-01T00:00:00.000Z')
        },
        now
      )
    ).toBe(false)
  })

  test('Berita published dengan tanggal yang sudah lewat sudah pernah terbit', () => {
    expect(
      articlePernahTerbit(
        {
          type: 'blog',
          status: 'published',
          publishedAt: new Date('2026-01-01T00:00:00.000Z')
        },
        now
      )
    ).toBe(true)
  })

  test('Berita archived selalu terhitung pernah terbit, apa pun tanggalnya', () => {
    expect(
      articlePernahTerbit(
        {
          type: 'blog',
          status: 'archived',
          publishedAt: new Date('2099-01-01T00:00:00.000Z')
        },
        now
      )
    ).toBe(true)
  })
})
