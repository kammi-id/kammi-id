import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization, type Organization } from '~/db/query/organization'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import { resolveSiteImage } from '~/lib/utils/site-image'
import type { StrukturJsonLdOrganization } from '~/lib/seo/json-ld'

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
// `isSiteActive: true` dan `isNonActive: false` melipat Situs Aktif dan
// Keadaan Aktif ke lookup yang sama yang sudah menyaring Struktur Terhapus
// (via `withOrganizationCTE`). Ketiganya menjadi `null`, agar seluruh
// permukaan yang dapat ditelusuri menjawab not-found (ticket 11, ADR 0013).
export const resolveStrukturId = async (
  slug: string
): Promise<string | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('struktur-slug', `struktur-slug-${slug}`)

  try {
    const [org] = await readOrganization({
      slug,
      isSiteActive: true,
      isNonActive: false
    })
    return org?.id ?? null
  } catch {
    return null
  }
}

export type PermalinkStruktur = Pick<Organization, 'id' | 'isNonActive'>

/**
 * Resolves a Situs Aktif for a Berita Permalink. Unlike `resolveStrukturId`,
 * this deliberately keeps a Struktur Non-Aktif reachable: ADR 0013 preserves
 * its published archive while removing every navigable surface. Deleted,
 * unknown, and not-yet-active sites still collapse to `null`.
 */
export const resolveStrukturForPermalink = async (
  slug: string
): Promise<PermalinkStruktur | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('struktur-slug', `struktur-slug-${slug}`)

  try {
    const [org] = await readOrganization({ slug, isSiteActive: true })
    return org ? { id: org.id, isNonActive: org.isNonActive } : null
  } catch {
    return null
  }
}

export const resolveStrukturForPermalinkFromParams = async (
  params: StrukturRouteParams
): Promise<PermalinkStruktur | null> => {
  const { strukturSlug } = await params
  return resolveStrukturForPermalink(strukturSlug)
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
 * immediately — and a per-id tag for when a writer wants to invalidate just
 * this Struktur without the broad tag's blast radius. Keadaan and Situs Aktif
 * actions invalidate the related `struktur-slug` tags at the same time.
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

/**
 * Everything JSON-LD (ticket 02) needs to describe a Struktur as itself,
 * rather than the hardcoded PP identity `src/lib/seo/json-ld.ts` used to
 * carry: the direct induk's `{type, slug}` (just enough to build its `@id`
 * via `resolveStrukturHost`), the direct anak's `{type, slug}` — filtered to
 * exclude Terhapus (already excluded by `withOrganizationCTE`), Non-Aktif,
 * and Situs-not-yet-active children (ADR 0013, spec "Anak yang Terhapus,
 * Non-Aktif, atau Situsnya belum Aktif tidak ikut di subOrganization") — and
 * the logo, resolved via `resolveSiteImage` into an absolute URL the same
 * way the Permalink Berita page's `generateMetadata` resolves a featured
 * image (`berita/[tahun]/[bulan]/[slug]/page.tsx`).
 *
 * Never the full descendant tree — PP can have hundreds of turunan, and the
 * caller only ever needs direct anak/induk to assemble a stable `@id`.
 *
 * Tagged the same way as `getStrukturIdentity` above: a broad `organizations`
 * tag (already busted by every Struktur-state action — `struktur-keadaan`,
 * `site-active-toggle`, `delete-struktur`, `move-parent` — so a child
 * flipping Non-Aktif or a Situs Aktif toggling busts this too) plus a
 * per-id tag. Skipping the per-Struktur tag is exactly the mistake ADR 0012
 * warns about: it looks correct against a single tenant and only breaks in
 * production once more than one Struktur exists.
 */
export const getStrukturJsonLdOrganization = async (
  organizationId: string | null
): Promise<StrukturJsonLdOrganization | null> => {
  'use cache'
  if (!organizationId) return null
  cacheLife('days')
  cacheTag('organizations', `struktur-identity-${organizationId}`)

  try {
    const [self] = await readOrganization({ id: [organizationId] })
    if (!self) return null

    const [parentRows, childRows] = await Promise.all([
      self.parentId
        ? readOrganization({ id: [self.parentId] })
        : Promise.resolve([]),
      readOrganization({
        parentId: [organizationId],
        isNonActive: false,
        isSiteActive: true
      })
    ])

    const parent = parentRows[0]
    const host = resolveStrukturHost(self)

    let logo: string | undefined
    if (self.logo) {
      const resolved = await resolveSiteImage(self.logo)
      if (resolved) {
        logo = resolved.startsWith('http')
          ? resolved
          : `https://${host}${resolved}`
      }
    }

    return {
      type: self.type,
      slug: self.slug,
      name: self.name,
      ...(logo ? { logo } : {}),
      parent: parent ? { type: parent.type, slug: parent.slug } : null,
      children: childRows.map(({ type, slug }) => ({ type, slug }))
    }
  } catch {
    return null
  }
}
