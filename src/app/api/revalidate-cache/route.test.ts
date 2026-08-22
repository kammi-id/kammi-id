import { describe, it, expect, beforeEach, mock } from 'bun:test'

let revalidatedTags: string[] = []

mock.module('next/cache', () => ({
  revalidateTag: (tag: string) => {
    revalidatedTags.push(tag)
  }
}))

const { POST } = await import('./route')

const request = (secret?: string) =>
  new Request('http://localhost/api/revalidate-cache', {
    method: 'POST',
    headers: secret ? { 'x-revalidate-secret': secret } : {}
  })

describe('POST /api/revalidate-cache', () => {
  beforeEach(() => {
    revalidatedTags = []
    process.env.CACHE_REVALIDATE_SECRET = 'rahasia-test'
  })

  it('menolak request tanpa header secret', async () => {
    const res = await POST(request())

    expect(res.status).toBe(401)
    expect(revalidatedTags).toEqual([])
  })

  it('menolak request dengan secret yang salah', async () => {
    const res = await POST(request('salah'))

    expect(res.status).toBe(401)
    expect(revalidatedTags).toEqual([])
  })

  it('menolak semua request kalau CACHE_REVALIDATE_SECRET belum dikonfigurasi', async () => {
    delete process.env.CACHE_REVALIDATE_SECRET

    const res = await POST(request('apa saja'))

    expect(res.status).toBe(401)
    expect(revalidatedTags).toEqual([])
  })

  it('me-revalidate tag site-settings kalau secret cocok', async () => {
    const res = await POST(request('rahasia-test'))

    expect(res.status).toBe(200)
    expect(revalidatedTags).toEqual(['site-settings'])
  })
})
