import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// `sharp` sungguhan dipakai secara default — konversi HEIC di lingkungan ini
// (macOS dev maupun `oven/bun:1.4.0-slim`) memang gagal karena decoder HEVC
// tidak ada di build `sharp` yang terpasang, lihat `## Comments` di
// `.scratch/berita-polish/issues/03-unggah-gambar-gagal-diam-diam.md`. Jalur
// "decoder tersedia" karena itu tidak bisa diuji lewat file HEIC sungguhan di
// lingkungan mana pun yang sudah dicoba — makanya dipalsukan di sini, sama
// seperti `readOrganization` di `proxy.test.ts`: `bun test` menjalankan
// semua berkas dalam satu proses, jadi `mock.module` ini bertahan sampai
// akhir suite dan harus melipir ke `sharp` asli begitu variabelnya `null`.
type SharpFn = (typeof import('sharp'))['default']
const realSharp: SharpFn = (await import('sharp')).default
let fakeHeicOutcome: 'success' | 'failure' | null = null

mock.module('sharp', () => ({
  default: (input: Parameters<SharpFn>[0]) => {
    if (fakeHeicOutcome === 'success') {
      return {
        jpeg: () => ({
          toBuffer: async () => Buffer.from('jpeg-hasil-konversi')
        })
      }
    }
    if (fakeHeicOutcome === 'failure') {
      return {
        jpeg: () => ({
          toBuffer: async () => {
            throw new Error('decoder HEVC tidak tersedia (dipalsukan)')
          }
        })
      }
    }
    return realSharp(input)
  }
}))

const { storage } = await import('~/lib/api/storage')

let root: string
let outside: string

// `storage` membaca `UPLOADS_DIR` tiap panggilan, jadi menyetelnya di sini
// sudah cukup — urutan impor tidak ikut menentukan.
beforeAll(async () => {
  const base = await mkdtemp(join(tmpdir(), 'kammi-storage-'))
  root = join(base, 'uploads')
  outside = join(base, 'rahasia.txt')
  await mkdir(root, { recursive: true })
  await writeFile(outside, 'jangan terbaca')
  process.env.UPLOADS_DIR = root
})

afterAll(async () => {
  await rm(dirname(root), { recursive: true, force: true })
})

const write = async (key: string, body: string) => {
  const path = join(root, key)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, body)
}

describe('storage.uploadFile', () => {
  it('menulis byte ke dalam akar dengan kunci <uuid>.<ext>, membuang nama asli', async () => {
    const key = await storage.uploadFile(
      new File(['halo'], 'nama-asli-berbahaya.jpg', { type: 'image/jpeg' })
    )

    expect(key).toMatch(
      /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/
    )
    expect(await Bun.file(join(root, key)).text()).toBe('halo')
  })

  it('menurunkan ekstensi dari mime type, bukan dari nama file', async () => {
    const key = await storage.uploadFile(
      new File(['halo'], 'foto.exe', { type: 'image/png' })
    )

    expect(key.endsWith('.png')).toBe(true)
  })

  it('menolak mime type di luar daftar putih, dengan pesan yang menyebut format yang diterima', async () => {
    const file = new File(['<script>'], 'foto.svg', {
      type: 'image/svg+xml'
    })

    await expect(storage.uploadFile(file)).rejects.toThrow(
      /Tipe file tidak didukung.*JPG, PNG, WebP, atau HEIC/
    )
  })

  it('menolak folder yang keluar dari akar', async () => {
    const file = new File(['halo'], 'foto.jpg', { type: 'image/jpeg' })

    await expect(storage.uploadFile(file, '../keluar')).rejects.toThrow()
  })
})

describe('storage.uploadFile — HEIC', () => {
  it('mengonversi HEIC menjadi JPEG ketika decoder HEIF tersedia', async () => {
    fakeHeicOutcome = 'success'
    try {
      const key = await storage.uploadFile(
        new File(['heic-bytes'], 'foto-iphone.heic', { type: 'image/heic' })
      )

      expect(key.endsWith('.jpg')).toBe(true)
      expect(await Bun.file(join(root, key)).text()).toBe(
        'jpeg-hasil-konversi'
      )
    } finally {
      fakeHeicOutcome = null
    }
  })

  it('menerima image/heif juga, bukan cuma image/heic', async () => {
    fakeHeicOutcome = 'success'
    try {
      const key = await storage.uploadFile(
        new File(['heif-bytes'], 'foto.heif', { type: 'image/heif' })
      )

      expect(key.endsWith('.jpg')).toBe(true)
    } finally {
      fakeHeicOutcome = null
    }
  })

  it('menolak HEIC dengan pesan jelas ketika decoder HEIF tidak tersedia, bukan error mentah', async () => {
    fakeHeicOutcome = 'failure'
    try {
      await expect(
        storage.uploadFile(
          new File(['heic-bytes'], 'foto-iphone.heic', { type: 'image/heic' })
        )
      ).rejects.toThrow(/HEIC tidak dapat diproses/)
    } finally {
      fakeHeicOutcome = null
    }
  })

  it('menolak HEIC di lingkungan tes ini tanpa dipalsukan — decoder HEVC memang absen di sini', async () => {
    await expect(
      storage.uploadFile(
        new File(['heic-bytes'], 'foto-iphone.heic', { type: 'image/heic' })
      )
    ).rejects.toThrow(/HEIC tidak dapat diproses/)
  })
})

describe('storage.uploadFile — AVIF', () => {
  it('menolak AVIF dengan pesan yang menyebut format yang diterima', async () => {
    const file = new File(['avif-bytes'], 'foto.avif', {
      type: 'image/avif'
    })

    await expect(storage.uploadFile(file)).rejects.toThrow(
      /AVIF tidak didukung.*JPG, PNG, WebP, atau HEIC/
    )
  })
})

describe('storage.readFile', () => {
  it('mengembalikan berkas yang ada', async () => {
    await write('uploads/ada.txt', 'isi')

    const file = await storage.readFile('uploads/ada.txt')

    expect(file).not.toBeNull()
    expect(await file!.text()).toBe('isi')
  })

  it('mengembalikan null untuk berkas yang tidak ada', async () => {
    expect(await storage.readFile('uploads/hilang.jpg')).toBeNull()
  })

  it('menolak kunci yang keluar dari akar lewat ..', async () => {
    expect(await storage.readFile('../rahasia.txt')).toBeNull()
    expect(await storage.readFile('uploads/../../rahasia.txt')).toBeNull()
  })

  it('menolak kunci absolut', async () => {
    expect(await storage.readFile('/etc/passwd')).toBeNull()
    expect(await storage.readFile(outside)).toBeNull()
  })

  it('menolak kunci kosong dan kunci berisi byte nol', async () => {
    expect(await storage.readFile('')).toBeNull()
    expect(await storage.readFile('uploads/a\0.jpg')).toBeNull()
  })

  it('menerima .. yang hasil resolusinya tetap di dalam akar', async () => {
    await write('kembali.txt', 'masih di dalam')

    const file = await storage.readFile('uploads/../kembali.txt')

    expect(await file!.text()).toBe('masih di dalam')
  })
})

describe('storage.updateFile', () => {
  it('menulis kunci baru, menghapus kunci lama, dan mengembalikan kunci baru', async () => {
    await write('uploads/lama.jpg', 'lama')

    const key = await storage.updateFile(
      'uploads/lama.jpg',
      new File(['baru'], 'baru.jpg', { type: 'image/jpeg' })
    )

    expect(key).not.toBe('uploads/lama.jpg')
    expect(key.startsWith('uploads/')).toBe(true)
    expect(await Bun.file(join(root, key)).text()).toBe('baru')
    expect(await Bun.file(join(root, 'uploads/lama.jpg')).exists()).toBe(false)
  })

  it('menulis kunci baru di folder yang sama dengan kunci lama', async () => {
    await write('avatars/lama.png', 'lama')

    const key = await storage.updateFile(
      'avatars/lama.png',
      new File(['baru'], 'baru.png', { type: 'image/png' })
    )

    expect(key.startsWith('avatars/')).toBe(true)
  })
})

describe('storage.deleteFile', () => {
  it('menghapus berkas', async () => {
    await write('uploads/buang.txt', 'x')

    await storage.deleteFile('uploads/buang.txt')

    expect(await Bun.file(join(root, 'uploads/buang.txt')).exists()).toBe(false)
  })

  it('diam saja kalau berkasnya sudah tidak ada', async () => {
    await expect(
      storage.deleteFile('uploads/tidak-ada.txt')
    ).resolves.toBeUndefined()
  })

  it('menolak kunci yang keluar dari akar', async () => {
    await expect(storage.deleteFile('../rahasia.txt')).rejects.toThrow()
    expect(await Bun.file(outside).exists()).toBe(true)
  })
})
