/**
 * The database a process is about to touch, as named by `DATABASE_URL`.
 */
export type DatabaseTarget = {
  /** Host as written, minus the brackets an IPv6 literal carries. */
  host: string
  /** Database name, or `''` when the URL carries no path. */
  database: string
  /** Whether the host resolves to the machine running this process. */
  isLocal: boolean
}

/**
 * Hosts that mean "this machine". Deliberately a closed set: every other host
 * counts as production, with no allowlist and no marker able to demote it.
 * A staging host wrongly treated as production costs one confirmation; the
 * reverse costs a database.
 */
const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal'
])

/**
 * Reads the host and database name out of a connection string and decides
 * whether the host is local.
 *
 * Returns `null` when the URL is missing, unparseable, or names no host —
 * callers must treat that as a refusal, not as a pass. We cannot prove an
 * unreadable URL points somewhere safe.
 */
export const classifyDatabaseUrl = (
  url: string | undefined | null
): DatabaseTarget | null => {
  if (!url || !url.trim()) return null

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  // `postgresql:` is not a WHATWG "special" scheme, so its host is parsed as an
  // opaque host: brackets are kept and the case is left alone. Both have to be
  // normalised by hand before comparing.
  const host = parsed.hostname.replace(/^\[|\]$/g, '')
  if (!host) return null

  return {
    host,
    database: parsed.pathname.replace(/^\//, ''),
    isLocal: LOCAL_HOSTS.has(host.toLowerCase())
  }
}
