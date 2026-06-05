import type { MetadataRoute } from 'next'

type SitemapEntry = MetadataRoute.Sitemap[number]

const BASE_URL = 'https://kammi.id'

export const getStaticRoutes = (): SitemapEntry[] => [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/berita`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/event`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/tentang`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/tentang/pengurus`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
]

// To add dynamic routes in future: merge with getStaticRoutes() in the default export.
// Example: const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
//   ...getStaticRoutes(),
//   ...await getDynamicBeritaRoutes(),
// ]

const sitemap = (): MetadataRoute.Sitemap => getStaticRoutes()

export default sitemap
