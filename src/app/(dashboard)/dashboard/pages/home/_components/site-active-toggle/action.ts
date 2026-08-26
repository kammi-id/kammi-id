'use server'

import { updateTag } from 'next/cache'
import { requireSiteSettingsAccess } from '~/lib/auth/site-settings'
import { readOrganization, updateOrganization } from '~/db/query/organization'
import { hasPublishedArticle } from '~/db/query/article'

export type SiteActiveToggleState = {
  success: boolean
  message: string
  isActive: boolean
}

export const NO_PUBLISHED_ARTICLE_MESSAGE =
  'Situs belum bisa dinyalakan — Struktur ini belum memiliki satu pun Berita Terbit.'

/**
 * Turns a Struktur's own Situs Aktif on or off (ticket 03, spec "Aktivasi
 * Situs").
 *
 * `requireSiteSettingsAccess` already scopes strictly to the caller's own
 * `connectedOrganization` and takes no target-org parameter — Humas can
 * therefore never reach another Struktur's flag through this action, and
 * Root reaches only whichever Struktur their session is connected to, same
 * as every other site-settings action (AGENTS.md "Cakupan" note doesn't
 * apply here: there is no scoped *list* to narrow, just the caller's own
 * row).
 *
 * The Terbit gate applies only to turning **on** — turning off is always
 * allowed, mirroring how `struktur-keadaan` keeps a gate on one direction
 * without leaking into the reverse.
 */
export const setSiteActiveAction = async (
  nextActive: boolean
): Promise<SiteActiveToggleState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) {
    return { success: false, message: 'Akses ditolak.', isActive: false }
  }
  const { orgId } = access

  const [org] = await readOrganization({ id: [orgId] })
  if (!org) {
    return {
      success: false,
      message: 'Struktur tidak ditemukan.',
      isActive: false
    }
  }

  if (nextActive) {
    const published = await hasPublishedArticle(orgId)
    if (!published) {
      return {
        success: false,
        message: NO_PUBLISHED_ARTICLE_MESSAGE,
        isActive: org.isSiteActive
      }
    }
  }

  await updateOrganization({ isSiteActive: nextActive }, orgId)

  // `organizations` keeps every other reader of Struktur rows in sync
  // (existing convention, e.g. `organization-profile-form/action.ts`).
  // `struktur-slug`/`struktur-slug-<slug>` are the tags `resolveStrukturId`
  // (`src/app/(main)/_data/struktur.ts`) reads from — invalidating them is
  // what makes the public address flip immediately instead of waiting out
  // the cache's `cacheLife('days')`.
  updateTag('organizations')
  updateTag('struktur-slug')
  updateTag(`struktur-slug-${org.slug}`)

  return {
    success: true,
    message: nextActive
      ? 'Situs berhasil dinyalakan. Alamat publiknya sudah aktif.'
      : 'Situs berhasil dimatikan. Alamat publiknya kembali tidak ditemukan.',
    isActive: nextActive
  }
}
