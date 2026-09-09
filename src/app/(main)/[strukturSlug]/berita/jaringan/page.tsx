import { permanentRedirect } from 'next/navigation'

/**
 * Alamat lama arsip **Berita KAMMI se-Indonesia**, yang sampai ADR 0016
 * bernama "Berita Jaringan" dan dilayani di sini. Rute ini tidak lagi
 * merender apa pun — ia hanya mengantar ke `/berita/seindonesia`.
 *
 * Redirect-nya PERMANEN (308) dan tidak pernah dicabut: alamat ini sudah
 * pernah masuk `sitemap.xml` dan sudah pernah dibagikan. ADR 0014 menetapkan
 * alamat yang telanjur terbit tetap mengantar ke isinya alih-alih mati, dan
 * arsip ini tunduk pada semangat yang sama meski ia bukan Permalink Berita.
 *
 * `?page=` ikut dibawa. Tanpa itu, tautan halaman 7 hasil pencarian Google
 * akan mendarat di halaman 1 — kegagalan senyap yang tidak akan ada yang
 * laporkan.
 */
const BeritaJaringanRedirectPage = async ({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) => {
  const { page } = await searchParams
  permanentRedirect(
    page
      ? `/berita/seindonesia?page=${encodeURIComponent(page)}`
      : '/berita/seindonesia'
  )
}

export default BeritaJaringanRedirectPage
