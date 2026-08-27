import { revalidatePath, updateTag } from 'next/cache'

export const revalidateOrganizationProfile = (
  previousSlug: string,
  nextSlug: string
): void => {
  updateTag('organizations')
  if (nextSlug !== previousSlug) {
    updateTag('struktur-slug')
    updateTag(`struktur-slug-${previousSlug}`)
    updateTag(`struktur-slug-${nextSlug}`)
    updateTag('berita-jaringan')
  }
  revalidatePath('/dashboard/organization')
}
