import { describe, it, expect } from 'bun:test'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  RESERVED_STRUKTUR_PATHS,
  isReservedStrukturPath
} from './reserved-paths'

describe('RESERVED_STRUKTUR_PATHS / isReservedStrukturPath', () => {
  it('menolak rute statis yang sudah ada langsung di bawah [strukturSlug]/', () => {
    expect(isReservedStrukturPath('berita')).toBe(true)
    expect(isReservedStrukturPath('event')).toBe(true)
    expect(isReservedStrukturPath('tentang')).toBe(true)
  })

  it('menolak jalur yang dipotong proxy.ts sebelum sempat di-rewrite ke [strukturSlug]/', () => {
    expect(isReservedStrukturPath('dashboard')).toBe(true)
    expect(isReservedStrukturPath('login')).toBe(true)
    expect(isReservedStrukturPath('api')).toBe(true)
    expect(isReservedStrukturPath('opengraph-image')).toBe(true)
  })

  it('meloloskan permalink biasa yang bukan alamat milik sistem', () => {
    expect(isReservedStrukturPath('sejarah-kammi')).toBe(false)
    expect(isReservedStrukturPath('kontak')).toBe(false)
  })

  it('konstanta memuat persis daftar yang didokumentasikan — tidak diam-diam bertambah/berkurang', () => {
    const sorted: string[] = [...RESERVED_STRUKTUR_PATHS].sort()
    expect(sorted).toEqual(
      [
        'api',
        'berita',
        'dashboard',
        'event',
        'login',
        'opengraph-image',
        'tentang'
      ].sort()
    )
  })
})

describe('Rute publik yang sudah ada tidak tertutup oleh Halaman ([slug])', () => {
  // Next.js App Router memenangkan segmen statis atas segmen dinamis
  // `[slug]` pada level yang sama secara otomatis — bukan sesuatu yang perlu
  // (atau bisa) dibuktikan lewat unit test tanpa server yang jalan. Yang
  // BISA dan HARUS dibuktikan di sini: `RESERVED_STRUKTUR_PATHS` tidak
  // diam-diam ketinggalan zaman begitu seseorang menambah folder rute statis
  // baru langsung di bawah `[strukturSlug]/` — kalau lupa didaftarkan, tes
  // ini merah, bukan baru ketahuan lewat Halaman yang misterius tak pernah
  // tampil.
  it('setiap folder rute statis langsung di bawah [strukturSlug]/ terdaftar di RESERVED_STRUKTUR_PATHS', () => {
    const strukturDir = join(
      import.meta.dir,
      '..',
      '..',
      'app',
      '(main)',
      '[strukturSlug]'
    )

    const staticRouteFolders = readdirSync(strukturDir).filter((name) => {
      if (name.startsWith('_') || name.startsWith('[')) return false
      return statSync(join(strukturDir, name)).isDirectory()
    })

    expect(staticRouteFolders.length).toBeGreaterThan(0)
    for (const folder of staticRouteFolders) {
      expect(isReservedStrukturPath(folder)).toBe(true)
    }
  })
})
