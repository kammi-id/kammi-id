import { afterAll, describe, expect, it, mock } from 'bun:test'

// `bun test` runs every file in one process, and `mock.module` replaces a
// module for the rest of the run — `mock.restore()` does not undo it. Files
// that execute afterward and need the real `readOrganization`/`cacheLife`/
// `cacheTag` would otherwise inherit whatever this file left behind. The two
// `useFake*` flags keep the fakes only for this file's own describe block,
// then each mock delegates to its real implementation for every file that
// runs after.
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

// `cacheLife`/`cacheTag` throw outside a real Next.js `cacheComponents`
// render — `resolveStrukturId` is wrapped in `'use cache'` so Cache
// Components can prerender the tenant segment's static shell, but that
// directive has no effect under plain `bun test`, so the real calls still
// run and still throw. Stub them to no-ops for this file's tests.
let useFakeNextCache = true
const actualNextCache = await import('next/cache')
mock.module('next/cache', () => ({
  ...actualNextCache,
  cacheLife: (...args: Parameters<typeof actualNextCache.cacheLife>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheLife(...args),
  cacheTag: (...args: Parameters<typeof actualNextCache.cacheTag>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheTag(...args)
}))

const { resolveStrukturId, resolveStrukturIdFromParams } = await import(
  './struktur'
)

afterAll(() => {
  useFakeReadOrganization = false
  useFakeNextCache = false
})

describe('resolveStrukturId', () => {
  it('resolves the organization id for a known slug', async () => {
    readOrganizationImpl = async (filters) => {
      expect(filters).toEqual({ slug: 'pp' })
      return [{ id: 'org-1' }] as Awaited<ReturnType<typeof realReadOrganization>>
    }

    expect(await resolveStrukturId('pp')).toBe('org-1')
  })

  it('returns null for a slug that matches no Struktur', async () => {
    readOrganizationImpl = async () => []

    expect(await resolveStrukturId('tidak-ada')).toBeNull()
  })

  it('returns null instead of throwing when the database is unavailable', async () => {
    readOrganizationImpl = async () => {
      throw new Error('connection refused')
    }

    expect(await resolveStrukturId('pp')).toBeNull()
  })
})

describe('resolveStrukturIdFromParams', () => {
  it('resolves from a params promise carrying the slug', async () => {
    readOrganizationImpl = async () => [
      { id: 'org-2' }
    ] as Awaited<ReturnType<typeof realReadOrganization>>

    const result = await resolveStrukturIdFromParams(
      Promise.resolve({ strukturSlug: 'pp' })
    )

    expect(result).toBe('org-2')
  })
})
