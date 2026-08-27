import { afterAll, expect, it, mock } from 'bun:test'

const updatedTags: string[] = []
const actualNextCache = await import('next/cache')
let useFakeNextCache = true

mock.module('next/cache', () => ({
  ...actualNextCache,
  revalidatePath: (
    ...args: Parameters<typeof actualNextCache.revalidatePath>
  ) => (useFakeNextCache ? undefined : actualNextCache.revalidatePath(...args)),
  updateTag: (tag: string) =>
    useFakeNextCache ? updatedTags.push(tag) : actualNextCache.updateTag(tag)
}))

mock.module('~/lib/auth/kestrukturan', () => ({
  requireOwnStrukturEditAccess: async () => ({
    id: 'struktur-id',
    slug: 'slug-lama'
  })
}))

mock.module('~/db/query/organization', () => ({
  updateOrganization: async () => undefined
}))

const { updateOrganizationProfileAction } = await import('./action')

afterAll(() => {
  useFakeNextCache = false
})

it('membatalkan alamat lama dan baru serta Berita Jaringan saat slug berubah', async () => {
  const formData = new FormData()
  formData.set('name', 'Struktur Baru')
  formData.set('slug', 'slug-baru')

  const result = await updateOrganizationProfileAction({}, formData)

  expect(result.success).toBe(true)
  expect(updatedTags).toEqual([
    'organizations',
    'struktur-slug',
    'struktur-slug-slug-lama',
    'struktur-slug-slug-baru',
    'berita-jaringan'
  ])
})
