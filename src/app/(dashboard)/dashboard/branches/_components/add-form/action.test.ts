import { beforeEach, describe, expect, mock, test } from 'bun:test'

let shouldFail = false

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
