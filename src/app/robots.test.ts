import { beforeEach, describe, expect, it, mock } from 'bun:test'

let host = 'pw-jabar.kammi.id'
let struktur: { isSiteActive: boolean; isNonActive: boolean } | null = null

mock.module('next/headers', () => ({
  headers: async () => new Headers({ host })
}))

mock.module('~/lib/struktur/request-host', () => ({
  resolveStrukturForRequestHost: async () => struktur,
  requestOriginFromHost: (requestHost: string) => `https://${requestHost}`
}))

const { default: robots } = await import('./robots')

beforeEach(() => {
  host = 'pw-jabar.kammi.id'
  struktur = { isSiteActive: true, isNonActive: false }
})

describe('robots', () => {
  it('menyebut sitemap pada host permintaan untuk Situs aktif', async () => {
    expect(await robots()).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/dashboard', '/login', '/api/']
        }
      ],
      sitemap: 'https://pw-jabar.kammi.id/sitemap.xml'
    })
  })

  it('menolak semua crawler untuk Situs belum aktif dan Struktur Non-Aktif', async () => {
    struktur = { isSiteActive: false, isNonActive: false }
    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })

    struktur = { isSiteActive: true, isNonActive: true }
    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })
  })
})
