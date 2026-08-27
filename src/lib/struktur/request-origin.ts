import { resolveTenantHost, ROOT_DOMAIN } from './tenant-host'

const hostnameFromHost = (host: string): string => host.split(':')[0]

const isRecognizedApexHost = (hostname: string): boolean =>
  [ROOT_DOMAIN, 'staging.kammi.id', 'localhost'].includes(hostname)

export const isRecognizedRequestHost = (host: string): boolean => {
  const hostname = hostnameFromHost(host).toLowerCase()
  const tenant = resolveTenantHost(hostname)

  return (
    tenant.kind === 'subdomain' ||
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
