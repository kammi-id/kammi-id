import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true

const actualNextHeaders = await import('next/headers')
const actualOrganizationQuery = await import('~/db/query/organization')
let struktur: { isSiteActive: boolean; isNonActive: boolean } | null = null

mock.module('next/headers', () => ({
  ...actualNextHeaders,
  headers: (...args: Parameters<typeof actualNextHeaders.headers>) =>
    useFakeHeaders
      ? Promise.resolve(new Headers({ host }))
      : actualNextHeaders.headers(...args)
}))

mock.module('~/db/query/organization', () => ({
  readOrganization: (
    ...args: Parameters<typeof actualOrganizationQuery.readOrganization>
  ) =>
    useFakeHeaders
      ? (Promise.resolve(struktur ? [{ id: 'struktur', type: 'pw', ...struktur }] : []) as ReturnType<
          typeof actualOrganizationQuery.readOrganization
        >)
      : actualOrganizationQuery.readOrganization(...args)
}))

const { default: robots } = await import('./robots')

afterAll(() => {
  useFakeHeaders = false
})

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

  it('menolak crawler untuk host yang tidak dikenali', async () => {
    host = 'attacker.example'

    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })
  })
})
