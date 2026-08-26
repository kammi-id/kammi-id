import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { GET } from './route'

/**
 * Spec §SEO: "Metadata Open Graph Berita ... jalur gambar wajib dapat
 * diakses tanpa autentikasi, dan itu diuji." Berkas ini adalah ujian itu —
 * dipilih co-located dengan `route.ts` karena aturannya milik route ini,
 * bukan spesifik ke Berita.
 *
 * Sengaja TIDAK mengimpor atau memock `~/lib/auth/cookies` sama sekali:
 * kalau `GET` di sini pernah mulai membaca sesi, tes ini akan pecah dengan
 * `readActiveSession is not a function` alih-alih diam-diam lolos lewat sesi
 * palsu.
 */
let root: string

beforeAll(async () => {
  const base = await mkdtemp(join(tmpdir(), 'kammi-images-route-'))
  root = join(base, 'uploads')
  await mkdir(root, { recursive: true })
  process.env.UPLOADS_DIR = root
})

afterAll(async () => {
  await rm(dirname(root), { recursive: true, force: true })
})

const requestFor = (path: string): Request =>
  new Request(`https://pw-jabar.kammi.id${path}`) // tanpa header Cookie/Authorization apa pun

describe('GET /api/images/[...key] — tanpa autentikasi', () => {
  it('menyajikan berkas yang ada, 200, tanpa sesi atau cookie apa pun', async () => {
    await mkdir(join(root, 'uploads'), { recursive: true })
    await writeFile(join(root, 'uploads/foto.jpg'), 'byte-gambar')

    const res = await GET(requestFor('/api/images/uploads/foto.jpg'), {
      params: Promise.resolve({ key: ['uploads', 'foto.jpg'] })
    })

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('byte-gambar')
  })

  it('tetap 200 (placeholder) untuk kunci yang tidak ada berkasnya — bukan 401/403/404', async () => {
    const res = await GET(requestFor('/api/images/uploads/tidak-ada.jpg'), {
      params: Promise.resolve({ key: ['uploads', 'tidak-ada.jpg'] })
    })

    expect(res.status).toBe(200)
  })
})
