import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { listSitemapArticlesForOrg } from '~/db/query/sitemap'
import {
  requestOriginFromHost,
  resolveStrukturForRequestHost
} from '~/lib/struktur/request-host'
import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'

type SitemapEntry = MetadataRoute.Sitemap[number]

const publicRoutes = (origin: string, isPP: boolean): SitemapEntry[] => [
  {
    url: origin,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0
  },
  {
    url: `${origin}/berita`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8
  },
  ...(isPP
    ? [
        {
          url: `${origin}/berita/jaringan`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8
        }
      ]
    : []),
  {
    url: `${origin}/event`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8
  },
  {
    url: `${origin}/tentang`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7
  },
  {
    url: `${origin}/tentang/pengurus`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6
  }
]

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const requestHost = (await headers()).get('host') ?? 'kammi.id'
  const struktur = await resolveStrukturForRequestHost(requestHost)
  const origin = requestOriginFromHost(requestHost)

  if (!origin || !struktur || !struktur.isSiteActive || struktur.isNonActive)
    return []

  const articles = await listSitemapArticlesForOrg(struktur.id)

  return [
    ...publicRoutes(origin, struktur.type === 'pp'),
    ...articles.halaman.map((halaman) => ({
      url: `${origin}/${halaman.slug}`,
      lastModified: halaman.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })),
    ...articles.berita.map((berita) => {
      const { tahun, bulan } = deriveTahunBulanTerbit(berita.publishedAt)

      return {
        url: `${origin}/berita/${tahun}/${bulan}/${berita.slug}`,
        lastModified: berita.publishedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }
    })
  ]
}

export default sitemap
