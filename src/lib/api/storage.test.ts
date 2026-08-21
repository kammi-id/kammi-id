import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { storage } from '~/lib/api/storage'

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

  it('menolak mime type di luar daftar putih', async () => {
    const file = new File(['<script>'], 'foto.svg', {
      type: 'image/svg+xml'
    })

    await expect(storage.uploadFile(file)).rejects.toThrow()
  })

  it('menolak folder yang keluar dari akar', async () => {
    const file = new File(['halo'], 'foto.jpg', { type: 'image/jpeg' })

    await expect(storage.uploadFile(file, '../keluar')).rejects.toThrow()
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
