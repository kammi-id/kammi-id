/**
 * Ticket 10 (ADR 0014): slug Struktur tidak punya riwayat — mengubahnya
 * saat Situsnya sudah aktif mematahkan seluruh Permalink Berita di Situs
 * itu tanpa jalan pulang (beda dengan slug Berita, yang dilindungi riwayat).
 * Dipakai `add-form.tsx` untuk memutuskan kapan peringatan keras tampil.
 */
export const isSlugChangeHazardous = (
  editData: { slug: string; isSiteActive?: boolean } | null | undefined,
  nextSlug: string
): boolean => {
  if (!editData) return false
  if (!editData.isSiteActive) return false
  return editData.slug !== nextSlug
}
