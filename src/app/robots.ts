import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import {
  resolveStrukturForRequestHost,
  type RequestStruktur
} from '~/lib/struktur/request-host'
import { requestOriginFromHost } from '~/lib/struktur/request-origin'

const CRAWL_RULES: MetadataRoute.Robots['rules'] = [
  { userAgent: '*', allow: '/', disallow: ['/dashboard', '/login', '/api/'] }
]

const robots = async (): Promise<MetadataRoute.Robots> => {
  const requestHost = (await headers()).get('host') ?? 'kammi.id'
  const origin = requestOriginFromHost(requestHost)
  if (!origin) return { rules: { userAgent: '*', disallow: '/' } }

  let struktur: RequestStruktur | null
  try {
    struktur = await resolveStrukturForRequestHost(requestHost)
  } catch {
    // Basis data tidak terjangkau. Per RFC 9309, robots.txt yang membalas
    // 5xx wajib ditafsirkan sebagai larangan atas SELURUH situs — kegagalan
    // ini sendiri bisa menghilangkan Situs Struktur dari indeks tanpa
    // perubahan kode apa pun kalau dibiarkan melempar sampai ke luar
    // (Route Handler yang melempar menjawab 500). Jawab permisif dengan 200
    // sebagai gantinya; ticket 05.
    return { rules: CRAWL_RULES, sitemap: `${origin}/sitemap.xml` }
  }

  if (!struktur || !struktur.isSiteActive || struktur.isNonActive) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  // Sitemap index lintas subdomain hanya diiklankan di PP: sah HANYA karena
  // Google Search Console-nya properti Domain (`kammi.id`, ticket 01) —
  // kalau propertinya pernah diubah ke properti URL-prefix, baris ini
  // kehilangan dasarnya dan harus dicabut.
  const sitemap =
    struktur.type === 'pp'
      ? [`${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`]
      : `${origin}/sitemap.xml`

  return { rules: CRAWL_RULES, sitemap }
}

export default robots
