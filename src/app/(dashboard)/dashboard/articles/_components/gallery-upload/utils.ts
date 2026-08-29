// Pure logic for the combined Gambar Utama + Galeri uploader (issue 04, ADR
// 0017). Kept separate from `gallery-upload.tsx` so "kapan Gambar Utama
// dipilih" is testable without mounting dnd-kit or hitting storage actions.

export type GalleryImageItem = { id: string; path: string }

export type GalleryUploadValue = {
  featuredImage: string
  galleryImages: string[]
}

export const buildInitialGalleryItems = (
  value: GalleryUploadValue
): GalleryImageItem[] => {
  const paths = value.featuredImage
    ? [value.featuredImage, ...value.galleryImages]
    : [...value.galleryImages]
  return paths.map((path) => ({ id: crypto.randomUUID(), path }))
}

/**
 * Seed state for a fresh mount: the stored Gambar Utama (if any) becomes the
 * first item AND the starred one. `resolveMainImageId` is deliberately not
 * reused here — an existing article with a `featuredImage` but an empty
 * `galleryImages` must seed exactly that image as main, never "whichever
 * item ends up first" (the two coincide today only because
 * `buildInitialGalleryItems` happens to put it first).
 */
export const buildInitialGalleryState = (
  value: GalleryUploadValue
): { items: GalleryImageItem[]; mainId: string | null } => {
  const items = buildInitialGalleryItems(value)
  const mainId = value.featuredImage && items[0] ? items[0].id : null
  return { items, mainId }
}

/**
 * Gambar Utama tidak pernah disimpulkan dari urutan (ADR 0017) — termasuk
 * urutan "yang mana diunggah duluan". Ini murni sebuah presence check:
 * `currentMainId` bertahan selama idnya masih anggota `itemIds`; begitu tidak
 * lagi (dihapus, atau memang belum pernah ditandai sama sekali), hasilnya
 * `null` — TIDAK pernah jatuh ke elemen pertama. ADR 0017 eksplisit: sebuah
 * Artikel (Halaman) boleh punya Galeri tanpa Gambar Utama sama sekali; kalau
 * fungsi ini auto-promote elemen pertama, keadaan itu jadi tidak mungkin
 * dicapai begitu ada gambar pertama diunggah.
 */
export const resolveMainImageId = (
  itemIds: string[],
  currentMainId: string | null
): string | null => {
  if (currentMainId && itemIds.includes(currentMainId)) return currentMainId
  return null
}

export const toGalleryUploadValue = (
  items: GalleryImageItem[],
  mainId: string | null
): GalleryUploadValue => {
  const main = items.find((item) => item.id === mainId)
  return {
    featuredImage: main?.path ?? '',
    galleryImages: items
      .filter((item) => item.id !== mainId)
      .map((item) => item.path)
  }
}
