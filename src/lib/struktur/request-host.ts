import { readOrganization } from '~/db/query/organization'
import { resolveTenantHost, ROOT_DOMAIN } from './tenant-host'

export type RequestStruktur = {
  id: string
  type: string
  isSiteActive: boolean
  isNonActive: boolean
}

const hostnameFromHost = (host: string): string => host.split(':')[0]

const isRecognizedApexHost = (hostname: string): boolean =>
  [ROOT_DOMAIN, 'staging.kammi.id', 'localhost'].includes(hostname)

const isRecognizedRequestHost = (host: string): boolean => {
  const hostname = hostnameFromHost(host).toLowerCase()
  const tenant = resolveTenantHost(hostname)

  return (
    tenant.kind === 'subdomain' ||
    (tenant.kind === 'apex' && isRecognizedApexHost(hostname))
  )
}

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

export const requestOriginFromHost = (host: string): string | null => {
  if (!isRecognizedRequestHost(host)) return null

  try {
    return new URL(`https://${host}`).origin
  } catch {
    return null
  }
}
