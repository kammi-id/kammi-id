import { describe, expect, it, mock } from 'bun:test'

let mockOrgs: Array<{ type: string; slug: string }> = []
let shouldThrow = false

mock.module('~/db/query/organization', () => ({
  readOrganization: async () => {
    if (shouldThrow) throw new Error('db down')
    return mockOrgs
  }
}))

const { GET } = await import('./route')

describe('GET /sitemap-index.xml', () => {
  it('mendaftar sitemap.xml setiap Situs Struktur Aktif dan tidak Non-Aktif', async () => {
    mockOrgs = [
      { type: 'pp', slug: 'pp-kammi' },
      { type: 'pw', slug: 'pw-jabar' }
    ]
    shouldThrow = false

    const response = await GET()
    expect(response.headers.get('content-type')).toContain('application/xml')

    const body = await response.text()
    expect(body).toContain(
      '<loc>https://www.kammi.id/sitemap.xml</loc>'
    )
    expect(body).toContain(
      '<loc>https://pw-jabar.kammi.id/sitemap.xml</loc>'
    )
    expect(body.startsWith('<?xml')).toBe(true)
    expect(body).toContain('<sitemapindex')
  })

  it('menjawab indeks kosong (masih 200) ketika basis data tidak terjangkau', async () => {
    shouldThrow = true

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.text()
    expect(body).toContain('<sitemapindex')
    expect(body).not.toContain('<sitemap>')
  })
})
