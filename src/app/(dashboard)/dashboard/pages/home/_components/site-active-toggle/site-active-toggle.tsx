import { getCachedSiteActiveToggleData } from './data'
import { SiteActiveToggleClient } from './site-active-toggle-client'

type SiteActiveToggleProps = {
  organizationId: string
}

/**
 * Sakelar Aktivasi Situs (ticket 03, spec "Aktivasi Situs").
 *
 * Server Component — reads its own data through the cached `data.ts` and
 * hands the interactive bit down to `site-active-toggle-client.tsx`
 * (AGENTS.md RSC-first: `'use client'` stays at the leaf).
 */
export const SiteActiveToggle = async ({
  organizationId
}: SiteActiveToggleProps) => {
  const { isActive, slug, hasPublishedArticle } =
    await getCachedSiteActiveToggleData(organizationId)

  return (
    <SiteActiveToggleClient
      organizationSlug={slug}
      initialIsActive={isActive}
      hasPublishedArticle={hasPublishedArticle}
    />
  )
}
