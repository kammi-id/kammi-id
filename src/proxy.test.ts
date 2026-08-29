import { afterAll, describe, expect, it, mock } from 'bun:test'
import { NextRequest } from 'next/server'

// Same file-scoped fake-then-restore shape as `struktur.test.ts` — `bun
// test` runs every file in one process, and `mock.module` outlives this
// file's own describe block, so the fake has to fall through to the real
// implementation once this file is done.
let useFakeReadOrganization = true
const actualOrganizationQuery = await import('~/db/query/organization')
const realReadOrganization = actualOrganizationQuery.readOrganization

let readOrganizationImpl: typeof realReadOrganization = async () => []

mock.module('~/db/query/organization', () => ({
  ...actualOrganizationQuery,
  readOrganization: (...args: Parameters<typeof realReadOrganization>) =>
    useFakeReadOrganization
      ? readOrganizationImpl(...args)
      : realReadOrganization(...args)
}))

// `readActiveSession` reads `next/headers` cookies, which throws outside a
// real request scope. None of these tests hit the `/dashboard` branch, but
// the module is imported unconditionally by `proxy.ts`, so it still has to
// resolve.
mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => undefined
}))

const { config, proxy } = await import('./proxy')

afterAll(() => {
  useFakeReadOrganization = false
})

describe('proxy — tenant routing', () => {
  it('rewrites a Struktur subdomain straight to its slug segment, no DB lookup', async () => {
    readOrganizationImpl = async () => {
      throw new Error(
        'a subdomain request should not need to query the database to route'
      )
    }

    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/tentang')
    )

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/pw-jabar/tentang'
    )
  })

  it('rewrites a Struktur subdomain root path to just the slug segment', async () => {
    readOrganizationImpl = async () => []

    const res = await proxy(new NextRequest('https://pw-jabar.kammi.id/'))

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/pw-jabar'
    )
  })

  it("resolves PP's real slug on the apex", async () => {
    readOrganizationImpl = async (filters) => {
      expect(filters).toEqual({ type: ['pp'], limit: 1 })
      return [{ slug: 'kammi' }] as Awaited<
        ReturnType<typeof realReadOrganization>
      >
    }

    const res = await proxy(new NextRequest('https://kammi.id/tentang'))

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://kammi.id/kammi/tentang'
    )
  })

  it('resolves PP on the staging deployment host too, not the slug "staging"', async () => {
    readOrganizationImpl = async () =>
      [{ slug: 'kammi' }] as Awaited<ReturnType<typeof realReadOrganization>>

    const res = await proxy(new NextRequest('https://staging.kammi.id/'))

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://staging.kammi.id/kammi'
    )
  })

  it('resolves PP on the production candidate host, not the slug "candidate"', async () => {
    readOrganizationImpl = async () =>
      [{ slug: 'kammi' }] as Awaited<ReturnType<typeof realReadOrganization>>

    const res = await proxy(
      new NextRequest('https://candidate.production.kammi.id/')
    )

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://candidate.production.kammi.id/kammi'
    )
  })

  it('lets a request fall through instead of 500ing when PP cannot be found', async () => {
    readOrganizationImpl = async () => {
      throw new Error('connection refused')
    }

    const res = await proxy(new NextRequest('https://kammi.id/'))

    expect(res).toBeUndefined()
  })

  it('redirects www.kammi.id permanently to the apex, path preserved', async () => {
    const res = await proxy(new NextRequest('https://www.kammi.id/tentang'))

    expect(res?.status).toBe(308)
    expect(res?.headers.get('location')).toBe('https://kammi.id/tentang')
  })

  it('blocks a directly-typed internal path instead of serving it (ADR 0012)', async () => {
    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/pw-jabar/tentang')
    )

    // Rewritten to a path nothing matches, so it 404s through the app's own
    // not-found page rather than a bare middleware response.
    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/__internal-path-blocked'
    )
  })

  it('blocks the bare internal slug path with no trailing segment too', async () => {
    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/pw-jabar')
    )

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/__internal-path-blocked'
    )
  })

  it('does not block a path that merely starts with the slug as a substring', async () => {
    // `/pw-jabar-lama` must not collide with the `/pw-jabar` guard.
    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/pw-jabar-lama')
    )

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/pw-jabar/pw-jabar-lama'
    )
  })

  it('leaves /dashboard requests untouched by tenant routing', async () => {
    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/dashboard')
    )

    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe('https://pw-jabar.kammi.id/login')
  })

  it('leaves /opengraph-image untouched', async () => {
    const res = await proxy(new NextRequest('https://kammi.id/opengraph-image'))

    expect(res).toBeUndefined()
  })

  it('rewrites the RSS XML route despite its file extension', async () => {
    expect(config.matcher).toContain('/berita/feed.xml')

    const res = await proxy(
      new NextRequest('https://pw-jabar.kammi.id/berita/feed.xml')
    )

    expect(res?.headers.get('x-middleware-rewrite')).toBe(
      'https://pw-jabar.kammi.id/pw-jabar/berita/feed.xml'
    )
  })
})
