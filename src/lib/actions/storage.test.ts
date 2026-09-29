import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { uploadImageAction } from '~/lib/actions/storage'

let root: string

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'kammi-storage-action-'))
  process.env.UPLOADS_DIR = root
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

const formDataWith = (file: File, existingPath?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (existingPath) formData.append('existingPath', existingPath)
  return formData
}

describe('uploadImageAction — batas 5 MB', () => {
  it('menerima file di bawah 5 MB', async () => {
    const file = new File([new Uint8Array(1024)], 'kecil.jpg', {
      type: 'image/jpeg'
    })

    await expect(uploadImageAction(formDataWith(file))).resolves.toMatch(
      /^uploads\//
    )
  })

  it('menolak file lebih besar dari 5 MB, sebelum mencapai storage', async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'besar.jpg', {
      type: 'image/jpeg'
    })

    await expect(uploadImageAction(formDataWith(file))).rejects.toThrow()
  })

  it('batas yang sama berlaku juga saat mengganti file lama (existingPath)', async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'besar.jpg', {
      type: 'image/jpeg'
    })

    await expect(
      uploadImageAction(formDataWith(file, 'uploads/lama.jpg'))
    ).rejects.toThrow()
  })
})
