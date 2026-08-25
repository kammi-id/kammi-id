import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization } from '~/db/query/organization'

// Shared shape for every page/layout under `[strukturSlug]`.
export type StrukturRouteParams = Promise<{ strukturSlug: string }>

// Resolves a Situs Struktur's slug to its organization id, for callers that
// received the slug as an argument (proxy rewrite, `params`) rather than
// resolving it themselves. Wrapped in 'use cache' — not just for repeat-call
// efficiency, but because Cache Components requires any data access reached
// from a page/layout body to be cached (or Suspense-wrapped) or the static
// shell can't be prerendered. Swallows DB errors so a database that's
// unreachable at build time falls back to `null` instead of failing the
// build — mirrors the guard the old `resolvePPOrgId` had.
export const resolveStrukturId = async (
  slug: string
): Promise<string | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('struktur-slug', `struktur-slug-${slug}`)

  try {
    const [org] = await readOrganization({ slug })
    return org?.id ?? null
  } catch {
    return null
  }
}

// Convenience for page/layout components: resolves straight from `params`.
export const resolveStrukturIdFromParams = async (
  params: StrukturRouteParams
): Promise<string | null> => {
  const { strukturSlug } = await params
  return resolveStrukturId(strukturSlug)
}
