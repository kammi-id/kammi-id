import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { GET as ImagesGet } from '~/app/api/images/[...key]/route'

let GET: typeof ImagesGet
let base: string
let root: string

const call = (key: string[]) =>
  GET(new Request('http://localhost/api/images'), {
    params: Promise.resolve({ key })
  })

beforeAll(async () => {
  base = await mkdtemp(join(tmpdir(), 'kammi-images-'))
  root = join(base, 'uploads')
  await mkdir(join(root, 'uploads'), { recursive: true })
  await writeFile(join(root, 'uploads', 'ada.jpg'), 'byte gambar')
  await writeFile(join(base, 'rahasia.txt'), 'jangan terbaca')
  process.env.UPLOADS_DIR = root
  ;({ GET } = await import('~/app/api/images/[...key]/route'))
})

afterAll(async () => {
  await rm(base, { recursive: true, force: true })
})

describe('GET /api/images/[...key]', () => {
  it('menyajikan berkas yang ada dengan cache sehari', async () => {
    const res = await call(['uploads', 'ada.jpg'])

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('image/jpeg')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400')
    expect(await res.text()).toBe('byte gambar')
  })

  it('mengembalikan placeholder 200 untuk berkas yang hilang', async () => {
    const res = await call(['uploads', 'hilang.jpg'])

    // 200, bukan 404: `next/image` gagal me-render pada 404, dan lingkungan
    // pengembang memang sengaja boleh tidak memegang byte-nya (ADR 0006).
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    const body = new Uint8Array(await res.arrayBuffer())
    expect(Array.from(body.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47])
  })

  it('tidak menyimpan placeholder di cache selama sehari', async () => {
    const res = await call(['uploads', 'hilang.jpg'])

    expect(res.headers.get('Cache-Control')).not.toContain('86400')
  })

  it('mengembalikan placeholder, bukan berkas di luar akar', async () => {
    const res = await call(['..', 'rahasia.txt'])

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(await res.text()).not.toContain('jangan terbaca')
  })

  it('mengembalikan placeholder untuk kunci absolut', async () => {
    const res = await call([join(base, 'rahasia.txt')])

    expect(res.headers.get('Content-Type')).toBe('image/png')
  })
})
