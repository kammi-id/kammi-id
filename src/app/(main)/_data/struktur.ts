import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization, type Organization } from '~/db/query/organization'

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
//
// `isSiteActive: true` folds Situs Aktif into the same lookup that already
// filters Struktur Terhapus (via `withOrganizationCTE`) — an unknown slug, a
// Terhapus Struktur, and a Situs that hasn't been switched on all collapse to
// the same `null`, so `[strukturSlug]/layout.tsx` can answer not-found for
// all three without knowing which one it was (ticket 02).
export const resolveStrukturId = async (
  slug: string
): Promise<string | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('struktur-slug', `struktur-slug-${slug}`)

  try {
    const [org] = await readOrganization({ slug, isSiteActive: true })
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

/**
 * Identity fields a Situs Struktur's public pages need to describe the
 * Struktur itself — name, Jenjang, logo — for the lean template's identity
 * block (ticket 04) and for anything else that needs them without a session.
 * Not the settings a Humas authors (that's `_data/site-settings.ts`); this is
 * the `organization` row itself.
 */
export type StrukturIdentity = Pick<
  Organization,
  'id' | 'name' | 'slug' | 'type' | 'level' | 'logo'
>

/**
 * Takes an already-resolved organization id (from `resolveStrukturId`) rather
 * than a slug, mirroring every `_data/site-settings.ts` getter — one lookup
 * per page render, not two.
 *
 * Cached under both a broad `organizations` tag — already busted by
 * `organization-profile-form`'s save action, so an edited name/logo shows up
 * immediately — and a per-id tag for when a future edit path wants to
 * invalidate just this Struktur without the broad tag's blast radius. Only
 * the broad one is wired to a writer today; the specific one is left for that
 * writer to pick up, same as `resolveStrukturId`'s own `struktur-slug` tag
 * above.
 */
export const getStrukturIdentity = async (
  organizationId: string | null
): Promise<StrukturIdentity | null> => {
  'use cache'
  if (!organizationId) return null
  cacheLife('days')
  cacheTag('organizations', `struktur-identity-${organizationId}`)

  try {
    const [org] = await readOrganization({ id: [organizationId] })
    return org ?? null
  } catch {
    return null
  }
}
