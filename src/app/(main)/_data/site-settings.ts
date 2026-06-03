import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type AboutSettings,
  type LeadershipSettings,
  type ActionsSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings,
  type TentangSettings,
  type HomeHeroItemsSettings,
  type HomeExtraItemsSettings
} from '~/db/query/site-settings'
import { readOrganizationIdByType } from '~/db/query/organization'
import { storage } from '~/lib/api/storage'

// Resolve an S3 key to a signed URL (1-hour expiry).
// Direct HTTP(S) URLs and empty strings are returned as-is.
const resolveUrl = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/'))
    return path
  return storage.getSignedUrl(path)
}

// Cached PP org ID lookup — the PP org is stable, expires daily.
const resolvePPOrgId = async (): Promise<string | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('pp-org-id')
  return readOrganizationIdByType('pp')
}

export const getHomeHeroItemsSettings =
  async (): Promise<HomeHeroItemsSettings> => {
    'use cache'
    cacheLife('days')
    const orgId = await resolvePPOrgId()
    cacheTag(
      'site-settings',
      orgId
        ? `site-settings-home-hero-items-${orgId}`
        : 'site-settings-home-hero-items'
    )
    if (!orgId) return SETTINGS_DEFAULTS.homeHeroItems
    return readSiteSettings<HomeHeroItemsSettings>(
      'home-hero-items',
      SETTINGS_DEFAULTS.homeHeroItems,
      orgId
    )
  }

export const getHomeExtraItemsSettings =
  async (): Promise<HomeExtraItemsSettings> => {
    'use cache'
    cacheLife('days')
    const orgId = await resolvePPOrgId()
    cacheTag(
      'site-settings',
      orgId
        ? `site-settings-home-extra-items-${orgId}`
        : 'site-settings-home-extra-items'
    )
    if (!orgId) return SETTINGS_DEFAULTS.homeExtraItems
    return readSiteSettings<HomeExtraItemsSettings>(
      'home-extra-items',
      SETTINGS_DEFAULTS.homeExtraItems,
      orgId
    )
  }

export const getAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-about-${orgId}` : 'site-settings-about'
  )
  if (!orgId) return SETTINGS_DEFAULTS.about
  return readSiteSettings<AboutSettings>(
    'about',
    SETTINGS_DEFAULTS.about,
    orgId
  )
}

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-leadership-${orgId}` : 'site-settings-leadership'
  )
  const d = SETTINGS_DEFAULTS.leadership
  if (!orgId) return d
  const raw = await readSiteSettings<Partial<LeadershipSettings>>(
    'leadership',
    d,
    orgId
  )
  return {
    periodLabel: raw.periodLabel ?? d.periodLabel,
    heading: raw.heading ?? d.heading,
    triumvirate: raw.triumvirate ?? d.triumvirate,
    leaders: raw.leaders ?? d.leaders,
    leaderBlocks: raw.leaderBlocks ?? d.leaderBlocks
  }
}

export const getActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-actions-${orgId}` : 'site-settings-actions'
  )
  if (!orgId) return SETTINGS_DEFAULTS.actions
  return readSiteSettings<ActionsSettings>(
    'actions',
    SETTINGS_DEFAULTS.actions,
    orgId
  )
}

export const getNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-nav-${orgId}` : 'site-settings-nav'
  )
  if (!orgId) return SETTINGS_DEFAULTS.nav
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav, orgId)
}

export const getFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-footer-${orgId}` : 'site-settings-footer'
  )
  if (!orgId) return SETTINGS_DEFAULTS.footer
  return readSiteSettings<FooterSettings>(
    'footer',
    SETTINGS_DEFAULTS.footer,
    orgId
  )
}

export const getMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-metadata-${orgId}` : 'site-settings-metadata'
  )
  if (!orgId) return SETTINGS_DEFAULTS.metadata
  return readSiteSettings<MetadataSettings>(
    'metadata',
    SETTINGS_DEFAULTS.metadata,
    orgId
  )
}

export const getTentangSettings = async (): Promise<TentangSettings> => {
  'use cache'
  // Signed URLs expire in 1 hour — cache for 45 min so we always serve fresh URLs.
  cacheLife({ stale: 0, revalidate: 2700, expire: 3600 })
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-tentang-${orgId}` : 'site-settings-tentang'
  )
  if (!orgId) return SETTINGS_DEFAULTS.tentang

  const [heroData, prinsipData, paradigmaData] = await Promise.all([
    readSiteSettings<{ heroImageUrl: string }>(
      'tentang-hero',
      { heroImageUrl: SETTINGS_DEFAULTS.tentang.heroImageUrl },
      orgId
    ),
    readSiteSettings<{ prinsipImages: TentangSettings['prinsipImages'] }>(
      'tentang-prinsip',
      { prinsipImages: SETTINGS_DEFAULTS.tentang.prinsipImages },
      orgId
    ),
    readSiteSettings<{ paradigmaImages: TentangSettings['paradigmaImages'] }>(
      'tentang-paradigma',
      { paradigmaImages: SETTINGS_DEFAULTS.tentang.paradigmaImages },
      orgId
    )
  ])

  // Resolve S3 keys → signed URLs so TentangScene can use them directly as CSS urls.
  const [heroImageUrl, prinsipImages, paradigmaImages] = await Promise.all([
    resolveUrl(heroData.heroImageUrl),
    Promise.all(prinsipData.prinsipImages.map(resolveUrl)) as Promise<TentangSettings['prinsipImages']>,
    Promise.all(paradigmaData.paradigmaImages.map(resolveUrl)) as Promise<TentangSettings['paradigmaImages']>
  ])

  return { heroImageUrl, prinsipImages, paradigmaImages }
}
