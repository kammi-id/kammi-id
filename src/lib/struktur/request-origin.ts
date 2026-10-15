import { resolveTenantHost, ROOT_DOMAIN } from './tenant-host'

const hostnameFromHost = (host: string): string => host.split(':')[0]

const isRecognizedApexHost = (hostname: string): boolean =>
  [`www.${ROOT_DOMAIN}`, 'staging.kammi.id', 'localhost'].includes(hostname)

export const isRecognizedRequestHost = (host: string): boolean => {
  const hostname = hostnameFromHost(host).toLowerCase()
  const tenant = resolveTenantHost(hostname)

  // `redirect-to-www` only ever fires for the bare root domain itself
  // (ADR 0018) — recognized so paths the proxy's matcher excludes (any URL
  // with a file extension, e.g. `/sitemap.xml`, `/robots.txt`) still resolve
  // to PP's origin when hit directly on the apex, same as before the redirect
  // direction flipped.
  return (
    tenant.kind === 'subdomain' ||
    tenant.kind === 'redirect-to-www' ||
    (tenant.kind === 'apex' && isRecognizedApexHost(hostname))
  )
}

export const requestOriginFromHost = (host: string): string | null => {
  if (!isRecognizedRequestHost(host)) return null

  try {
    return new URL(`https://${host}`).origin
  } catch {
    return null
  }
}
