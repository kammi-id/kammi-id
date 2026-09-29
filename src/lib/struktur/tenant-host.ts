/**
 * The domain every Situs Struktur hangs off of. PP occupies `www.kammi.id`
 * (ADR 0018 — reversed from ADR 0012's original apex-first design because
 * Cloudflare already redirects the bare apex to `www` and that edge rule
 * isn't ours to change); every other Struktur gets `<slug>.kammi.id`.
 */
export const ROOT_DOMAIN = 'kammi.id'

/**
 * Hosts that serve PP directly rather than being read as a Struktur slug.
 *
 * `www.kammi.id` is PP's canonical host (ADR 0018). `staging.kammi.id` is not
 * a subdomain of a Struktur — it is the staging deployment's own host, and it
 * happens to share the three-label shape of `<slug>.kammi.id` by coincidence
 * of how it was provisioned. Without this exception it would be read as the
 * slug `staging`, and the whole staging site would 404 the moment this ships.
 * The production candidate host has the same role during release validation.
 * `localhost` keeps local dev on PP, unchanged.
 */
const APEX_HOSTS = new Set<string>([
  `www.${ROOT_DOMAIN}`,
  'staging.kammi.id',
  'candidate.production.kammi.id',
  'localhost'
])

export type TenantHostResolution =
  | { kind: 'apex' }
  | { kind: 'subdomain'; slug: string }
  | { kind: 'redirect-to-www' }

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
/**
 * Kebalikan `resolveTenantHost`: dari sebuah Struktur ke `Host` yang
 * melayaninya — dipakai metadata SEO (Open Graph Berita, ADR 0012) yang
 * butuh URL absolut pada host Struktur yang **benar**, bukan host request
 * yang sedang menjawab (yang sudah di-rewrite proxy dan tidak lagi
 * mencerminkan subdomain aslinya di sisi Server Component).
 *
 * PP melayani dari `www.kammi.id` (ADR 0018), sama seperti `resolveTenantHost`
 * mengarahkan host itu ke slug PP sesungguhnya — sisi baliknya di sini adalah
 * tipe `'pp'`.
 */
export const resolveStrukturHost = (org: {
  type: string
  slug: string
}): string =>
  org.type === 'pp' ? `www.${ROOT_DOMAIN}` : `${org.slug}.${ROOT_DOMAIN}`

export const resolveTenantHost = (hostname: string): TenantHostResolution => {
  const host = hostname.toLowerCase()

  if (APEX_HOSTS.has(host)) {
    return { kind: 'apex' }
  }

  if (host === ROOT_DOMAIN) {
    return { kind: 'redirect-to-www' }
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    return { kind: 'subdomain', slug: host.slice(0, host.indexOf('.')) }
  }

  return { kind: 'apex' }
}
