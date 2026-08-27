import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import {
  requestOriginFromHost,
  resolveStrukturForRequestHost
} from '~/lib/struktur/request-host'

const robots = async (): Promise<MetadataRoute.Robots> => {
  const requestHost = (await headers()).get('host') ?? 'kammi.id'
  const struktur = await resolveStrukturForRequestHost(requestHost)
  const origin = requestOriginFromHost(requestHost)

  if (!origin || !struktur || !struktur.isSiteActive || struktur.isNonActive) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/login', '/api/']
      }
    ],
    sitemap: `${origin}/sitemap.xml`
  }
}

export default robots
