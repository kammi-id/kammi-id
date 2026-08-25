import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

let shouldFail = false

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => ({
    user: { id: 'actor-id', role: 'root', connectedOrganization: null }
  })
}))

// Sama seperti '~/db/query/organization' di bawah: sebarkan modul asli dulu
// supaya export lain (mis. `canManageKestrukturan`) tetap ada untuk berkas
// yang jalan setelah ini dalam proses `bun test` yang sama.
const actualKestrukturan = await import('~/lib/auth/kestrukturan')
mock.module('~/lib/auth/kestrukturan', () => ({
  ...actualKestrukturan,
  requireKestrukturanCreateAccess: async () => null,
  requireKestrukturanManageAccess: async () => null
}))

// `bun test` runs every file in one process, so `mock.module` replaces
// '~/db/query/organization' for the rest of the run — spreading the real
// module keeps exports like `fetchAllowedOrgIds` intact for files that run
// after this one and import them for real.
const actualOrganizationQuery = await import('~/db/query/organization')
mock.module('~/db/query/organization', () => ({
  ...actualOrganizationQuery,
  createOrganization: async () => {
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
  updateOrganization: async () => undefined
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

  // `shouldFail` hidup di closure mock module yang menimpa
  // '~/db/query/organization' untuk sisa proses `bun test`. Tanpa reset ini,
  // berkas lain yang jalan setelah tes "transaksi gagal" mewarisi
  // `createOrganization` yang selalu melempar 'database failure'.
  afterAll(() => {
    shouldFail = false
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
