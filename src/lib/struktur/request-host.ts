import { readOrganization } from '~/db/query/organization'
import { isRecognizedRequestHost } from './request-origin'
import { resolveTenantHost } from './tenant-host'

export type RequestStruktur = {
  id: string
  type: string
  isSiteActive: boolean
  isNonActive: boolean
}

const hostnameFromHost = (host: string): string => host.split(':')[0]

/**
 * Resolves the Struktur served for a public request before proxy rewrites can
 * supply `[strukturSlug]`. Metadata files are excluded from that rewrite, so
 * they have to read the request Host themselves.
 */
export const resolveStrukturForRequestHost = async (
  host: string
): Promise<RequestStruktur | null> => {
  if (!isRecognizedRequestHost(host)) return null

  const tenant = resolveTenantHost(hostnameFromHost(host))

  try {
    const [struktur] =
      tenant.kind === 'subdomain'
        ? await readOrganization({ slug: tenant.slug })
        : await readOrganization({ type: ['pp'], limit: 1 })

    return struktur
      ? {
          id: struktur.id,
          type: struktur.type,
          isSiteActive: struktur.isSiteActive,
          isNonActive: struktur.isNonActive
        }
      : null
  } catch {
    return null
  }
}
