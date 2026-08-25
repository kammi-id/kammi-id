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

const { resolveStrukturId, resolveStrukturIdFromParams, getStrukturIdentity } =
  await import('./struktur')

afterAll(() => {
  useFakeReadOrganization = false
  useFakeNextCache = false
})

describe('resolveStrukturId', () => {
  it('resolves the organization id for a known slug with an active Situs', async () => {
    readOrganizationImpl = async (filters) => {
      expect(filters).toEqual({ slug: 'pp', isSiteActive: true })
      return [{ id: 'org-1' }] as Awaited<
        ReturnType<typeof realReadOrganization>
      >
    }

    expect(await resolveStrukturId('pp')).toBe('org-1')
  })

  it('returns null for a slug that matches no Struktur', async () => {
    readOrganizationImpl = async () => []

    expect(await resolveStrukturId('tidak-ada')).toBeNull()
  })

  it('returns null for a Struktur whose Situs is not yet active', async () => {
    // `isSiteActive: true` in the filter is what makes this indistinguishable
    // from an unknown slug — the fake here mirrors that by returning nothing.
    readOrganizationImpl = async (filters) => {
      expect(filters).toEqual({ slug: 'belum-aktif', isSiteActive: true })
      return []
    }

    expect(await resolveStrukturId('belum-aktif')).toBeNull()
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
    readOrganizationImpl = async () =>
      [{ id: 'org-2' }] as Awaited<ReturnType<typeof realReadOrganization>>

    const result = await resolveStrukturIdFromParams(
      Promise.resolve({ strukturSlug: 'pp' })
    )

    expect(result).toBe('org-2')
  })
})

describe('getStrukturIdentity', () => {
  it('returns null without touching the database when organizationId is null', async () => {
    readOrganizationImpl = async () => {
      throw new Error('should not be called')
    }

    expect(await getStrukturIdentity(null)).toBeNull()
  })

  it('reads the organization by id for the lean template identity block', async () => {
    readOrganizationImpl = async (filters) => {
      expect(filters).toEqual({ id: ['org-3'] })
      return [
        {
          id: 'org-3',
          name: 'PW Jawa Barat',
          slug: 'pw-jabar',
          type: 'pw',
          level: 2,
          logo: null
        }
      ] as Awaited<ReturnType<typeof realReadOrganization>>
    }

    expect(await getStrukturIdentity('org-3')).toEqual({
      id: 'org-3',
      name: 'PW Jawa Barat',
      slug: 'pw-jabar',
      type: 'pw',
      level: 2,
      logo: null
    })
  })

  it('returns null for an id that resolves to no row', async () => {
    readOrganizationImpl = async () => []

    expect(await getStrukturIdentity('org-tidak-ada')).toBeNull()
  })

  it('returns null instead of throwing when the database is unavailable', async () => {
    readOrganizationImpl = async () => {
      throw new Error('connection refused')
    }

    expect(await getStrukturIdentity('org-3')).toBeNull()
  })
})
