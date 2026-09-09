import { describe, expect, it, mock } from 'bun:test'

let databaseFailure: Error | undefined
let volumeFailure: Error | undefined
let uploadsDirectory = true

mock.module('~/db/db', () => ({
  db: {
    execute: async () => {
      if (databaseFailure) throw databaseFailure
    }
  }
}))

const fs = await import('node:fs/promises')
mock.module('node:fs/promises', () => ({
  ...fs,
  access: async () => {
    if (volumeFailure) throw volumeFailure
  },
  stat: async () => ({
    isDirectory: () => uploadsDirectory
  })
}))

const { GET } = await import('./route')

describe('GET /api/health/ready — tanpa autentikasi', () => {
  it('menjawab sukses ketika PostgreSQL dan volume upload siap', async () => {
    databaseFailure = undefined
    volumeFailure = undefined
    uploadsDirectory = true

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('gagal tertutup dan tidak membocorkan kegagalan PostgreSQL', async () => {
    databaseFailure = new Error('postgres://user:secret@db.internal/kammi')
    volumeFailure = undefined
    uploadsDirectory = true

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })

  it('gagal tertutup ketika volume upload hilang atau tidak dapat ditulis', async () => {
    databaseFailure = undefined
    volumeFailure = new Error('/data/uploads: permission denied')
    uploadsDirectory = true

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })

  it('gagal tertutup ketika path upload bukan direktori', async () => {
    databaseFailure = undefined
    volumeFailure = undefined
    uploadsDirectory = false

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })
})
