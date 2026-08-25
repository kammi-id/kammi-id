/**
 * The domain every Situs Struktur hangs off of. PP occupies the apex itself
 * (ADR 0012); every other Struktur gets `<slug>.kammi.id`.
 */
export const ROOT_DOMAIN = 'kammi.id'

/**
 * Hosts that serve PP directly rather than being read as a Struktur slug.
 *
 * `staging.kammi.id` is not a subdomain of a Struktur — it is the staging
 * deployment's own host, and it happens to share the three-label shape of
 * `<slug>.kammi.id` by coincidence of how it was provisioned. Without this
 * exception it would be read as the slug `staging`, and the whole staging
 * site would 404 the moment this ships (mirrors the apex risk ADR 0012 calls
 * out for `kammi.id` itself). `localhost` keeps local dev on PP, unchanged
 * from before this ticket.
 */
const APEX_HOSTS = new Set<string>([
  ROOT_DOMAIN,
  'staging.kammi.id',
  'localhost'
])

export type TenantHostResolution =
  | { kind: 'apex' }
  | { kind: 'subdomain'; slug: string }
  | { kind: 'redirect-to-apex' }

/**
 * Reads a request `Host` and decides how the proxy should route it — pure and
 * DB-free, so the slug/apex/redirect decision is unit-testable without a
 * `NextRequest`. The DB lookup that turns "apex" into PP's actual slug, and
 * the collision guard against directly-typed internal paths (ADR 0012), stay
 * in `proxy.ts` because both need `readOrganization`.
 *
 * A host outside every case above — `www.kammi.id` aside, anything that is
 * neither an apex host nor a `.kammi.id` subdomain — falls back to `apex`.
 * That mirrors the safety net ticket 01 already had for an unrecognized Host
 * (bare IP, a preview deployment domain, a health check) rather than turning
 * an unfamiliar Host into a 404.
 */
export const resolveTenantHost = (hostname: string): TenantHostResolution => {
  const host = hostname.toLowerCase()

  if (host === `www.${ROOT_DOMAIN}`) {
    return { kind: 'redirect-to-apex' }
  }

  if (APEX_HOSTS.has(host)) {
    return { kind: 'apex' }
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    return { kind: 'subdomain', slug: host.slice(0, host.indexOf('.')) }
  }

  return { kind: 'apex' }
}
