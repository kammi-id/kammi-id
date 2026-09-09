import { readOrganization } from '~/db/query/organization'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

/**
 * Sitemap index lintas subdomain di `www` — ticket 05. Mendaftar
 * `sitemap.xml` setiap Situs Struktur Aktif dan tidak Non-Aktif, supaya
 * subdomain baru bisa ditemukan tanpa menunggu tautan internal apa pun ke
 * situsnya menyebar.
 *
 * Sah lintas subdomain HANYA karena Google Search Console-nya properti
 * Domain (`kammi.id`, ticket 01), yang mencakup seluruh subdomain sekaligus
 * — kalau propertinya pernah diubah ke properti URL-prefix, berkas ini
 * kehilangan dasarnya dan harus dicabut atau dipertanyakan ulang.
 *
 * Diterbitkan sebagai Route Handler (bukan `sitemap.ts`) karena isinya sama
 * di setiap host — bukan per-Struktur seperti `/sitemap.xml` — dan format
 * `<sitemapindex>` beda root element dari `<urlset>` yang dihasilkan
 * `MetadataRoute.Sitemap`, jadi tidak bisa berbagi berkas yang sama.
 */
export const GET = async () => {
  let hosts: string[] = []
  try {
    const orgs = await readOrganization({
      isSiteActive: true,
      isNonActive: false
    })
    hosts = orgs.map((org) => resolveStrukturHost(org))
  } catch {
    // Basis data tidak terjangkau — indeks kosong (masih 200) daripada 500.
  }

  const entries = hosts
    .map(
      (host) =>
        `  <sitemap>\n    <loc>https://${host}/sitemap.xml</loc>\n  </sitemap>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  })
}
