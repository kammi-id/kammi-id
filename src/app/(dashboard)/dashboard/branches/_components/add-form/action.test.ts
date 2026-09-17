import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

let shouldFail = false

// `bun test` runs every file in one process, and `mock.module` replaces a
// module for the rest of the run — `mock.restore()` does not undo it. Files
// that execute afterward and need the real `createOrganization`
// (integration-style DB tests, e.g. reset-password's action.test.ts) would
// otherwise get this file's fake fixture forever. `useFakeOrganization`
// keeps the fake only for this file's own describe block, then the mock
// delegates to the real implementation for every file that runs after.
let useFakeOrganization = true
const actualOrganizationQuery = await import('~/db/query/organization')
// `mock.module` overwrites the module's exports object in place, and the
// dynamic `import()` above returns a live view of that same object — so
// referencing `actualOrganizationQuery.createOrganization` from inside the
// mock below would resolve to the mock itself (infinite recursion). Snapshot
// the real functions into plain bindings first, before `mock.module` runs.
const realCreateOrganization = actualOrganizationQuery.createOrganization
const realUpdateOrganization = actualOrganizationQuery.updateOrganization

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => ({
    user: { id: 'actor-id', role: 'root', connectedOrganization: null }
  })
}))

mock.module('~/lib/auth/kestrukturan', () => ({
  requireKestrukturanCreateAccess: async () => null,
  requireKestrukturanManageAccess: async () => null
}))

mock.module('~/db/query/organization', () => ({
  ...actualOrganizationQuery,
  createOrganization: async (
    ...args: Parameters<typeof actualOrganizationQuery.createOrganization>
  ) => {
    if (!useFakeOrganization) return realCreateOrganization(...args)
    if (shouldFail) throw new Error('database failure')
    return [
      {
        id: 'organization-id',
        slug: 'pk-test',
        credentials: [
          {
            displayName: 'BPH PK Test',
            name: 'bph-pk-test',
            password: 'rahasia-awal'
          }
        ]
      }
    ]
  },
  updateOrganization: async (
    ...args: Parameters<typeof actualOrganizationQuery.updateOrganization>
  ) => {
    if (!useFakeOrganization) return realUpdateOrganization(...args)
    return undefined
  }
}))

mock.module('next/cache', () => ({
  revalidatePath: () => undefined,
  updateTag: () => undefined
}))

const { createOrganizationAction } = await import('./action')

const formData = () => {
  const data = new FormData()
  data.set('name', 'PK Test')
  data.set('code', 'PK-TEST')
  data.set('type', 'pk')
  data.set('parentId', 'parent-id')
  data.set('slug', 'pk-test')
  data.set('logo', '')
  return data
}

describe('aksi pembuatan Struktur', () => {
  beforeEach(() => {
    shouldFail = false
  })

  afterAll(() => {
    useFakeOrganization = false
  })

  test('mengembalikan seluruh kredensial awal hanya setelah Struktur berhasil dibuat', async () => {
    const result = await createOrganizationAction({}, formData())

    expect(result).toMatchObject({
      success: true,
      organizationSlug: 'pk-test',
      credentials: [
        {
          authority: 'BPH PK Test',
          username: 'bph-pk-test',
          password: 'rahasia-awal'
        }
      ]
    })
  })

  test('tidak mengembalikan kredensial parsial saat transaksi gagal', async () => {
    shouldFail = true

    const result = await createOrganizationAction({}, formData())

    expect(result.success).toBe(false)
    expect(result.credentials).toBeUndefined()
  })
})
