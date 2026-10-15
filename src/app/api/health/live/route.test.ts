import { describe, expect, it, mock } from 'bun:test'

let databaseInitialized = false
let volumeAccessed = false

mock.module('~/db/db', () => {
  databaseInitialized = true
  return { db: {} }
})

const fs = await import('node:fs/promises')
mock.module('node:fs/promises', () => ({
  ...fs,
  access: async () => {
    volumeAccessed = true
  }
}))

const { GET } = await import('./route')

describe('GET /api/health/live — tanpa autentikasi', () => {
  it('menjawab sukses tanpa membaca Cookie atau Authorization', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(databaseInitialized).toBeFalse()
    expect(volumeAccessed).toBeFalse()
  })
})
