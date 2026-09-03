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
 *
 * A DB read failure is left to propagate (not swallowed here) — ticket 05:
 * `robots.ts` needs to tell "host genuinely unrecognized" (this function
 * returns `null` without throwing) apart from "the database is down" (this
 * function throws), because RFC 9309 says a 5xx `robots.txt` must be read as
 * disallowing the entire site, so a DB outage needs a *permissive* fallback,
 * not the same disallow-all a truly unknown host gets. Each caller decides
 * its own fallback for the thrown case.
 */
export const resolveStrukturForRequestHost = async (
  host: string
): Promise<RequestStruktur | null> => {
  if (!isRecognizedRequestHost(host)) return null

  const tenant = resolveTenantHost(hostnameFromHost(host))

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
}
