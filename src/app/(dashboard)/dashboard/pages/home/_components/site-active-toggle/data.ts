import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization } from '~/db/query/organization'
import { hasPublishedArticle } from '~/db/query/article'

export type SiteActiveToggleData = {
  isActive: boolean
  slug: string
  hasPublishedArticle: boolean
}

/**
 * Cached read backing the toggle. Tagged `organizations` — the same broad
 * tag `setSiteActiveAction` already invalidates on write (matching the
 * existing convention in `organization-profile-form/action.ts`) — and
 * its own Artikel gate, so a freshly published Berita lifts the gate on next
 * render without waiting out `cacheLife('minutes')`.
 */
export const getCachedSiteActiveToggleData = async (
  organizationId: string
): Promise<SiteActiveToggleData> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations', `site-active-toggle-${organizationId}`)

  const [[org], published] = await Promise.all([
    readOrganization({ id: [organizationId] }),
    hasPublishedArticle(organizationId)
  ])

  return {
    isActive: org?.isSiteActive ?? false,
    slug: org?.slug ?? '',
    hasPublishedArticle: published
  }
}
