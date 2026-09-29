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

const { revalidateOrganizationProfile } = await import('./cache')

afterAll(() => {
  useFakeNextCache = false
})

it('membatalkan alamat lama dan baru serta Berita Jaringan saat slug berubah', () => {
  revalidateOrganizationProfile('slug-lama', 'slug-baru')

  expect(updatedTags).toEqual([
    'organizations',
    'struktur-slug',
    'struktur-slug-slug-lama',
    'struktur-slug-slug-baru',
    'berita-jaringan'
  ])
})
