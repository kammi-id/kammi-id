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
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/')
  )
    return path
  return storage.getSignedUrl(path)
}

// NOT cached — plain DB lookup called at request time.
// Returns null on DB error or if no PP org exists (e.g. during Docker build).
// Keeping this outside 'use cache' prevents null from ever being persisted
// in the cache store, which would cause all public pages to serve defaults
// even after the DB becomes available.
const resolvePPOrgId = async (): Promise<string | null> => {
  try {
    return await readOrganizationIdByType('pp')
  } catch {
    return null
  }
}

// Generic cached reader — only called when orgId is known to be valid.
// Cache is keyed by (key, orgId) so different org IDs are isolated.
const _cachedReadSettings = async <T>(
  key: string,
  defaults: T,
  orgId: string
): Promise<T> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-${key}-${orgId}`)
  return readSiteSettings<T>(key, defaults, orgId)
}

// Inner cached reader for tentang (shorter TTL due to signed URL expiry).
const _cachedTentangSettings = async (
  orgId: string
): Promise<TentangSettings> => {
  'use cache'
  // Signed URLs expire in 1 hour — cache for 45 min so we always serve fresh URLs.
  cacheLife({ stale: 0, revalidate: 2700, expire: 3600 })
  cacheTag('site-settings', `site-settings-tentang-${orgId}`)

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
    Promise.all(prinsipData.prinsipImages.map(resolveUrl)) as Promise<
      TentangSettings['prinsipImages']
    >,
    Promise.all(paradigmaData.paradigmaImages.map(resolveUrl)) as Promise<
      TentangSettings['paradigmaImages']
    >
  ])

  return { heroImageUrl, prinsipImages, paradigmaImages }
}

export const getHomeHeroItemsSettings =
  async (): Promise<HomeHeroItemsSettings> => {
    const orgId = await resolvePPOrgId()
    if (!orgId) return SETTINGS_DEFAULTS.homeHeroItems
    return _cachedReadSettings(
      'home-hero-items',
      SETTINGS_DEFAULTS.homeHeroItems,
      orgId
    )
  }

export const getHomeExtraItemsSettings =
  async (): Promise<HomeExtraItemsSettings> => {
    const orgId = await resolvePPOrgId()
    if (!orgId) return SETTINGS_DEFAULTS.homeExtraItems
    return _cachedReadSettings(
      'home-extra-items',
      SETTINGS_DEFAULTS.homeExtraItems,
      orgId
    )
  }

export const getAboutSettings = async (): Promise<AboutSettings> => {
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.about
  return _cachedReadSettings('about', SETTINGS_DEFAULTS.about, orgId)
}

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  const orgId = await resolvePPOrgId()
  const d = SETTINGS_DEFAULTS.leadership
  if (!orgId) return d
  const raw = await _cachedReadSettings<Partial<LeadershipSettings>>(
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
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.actions
  return _cachedReadSettings('actions', SETTINGS_DEFAULTS.actions, orgId)
}

export const getNavSettings = async (): Promise<NavSettings> => {
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.nav
  return _cachedReadSettings('nav', SETTINGS_DEFAULTS.nav, orgId)
}

export const getFooterSettings = async (): Promise<FooterSettings> => {
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.footer
  return _cachedReadSettings('footer', SETTINGS_DEFAULTS.footer, orgId)
}

export const getMetadataSettings = async (): Promise<MetadataSettings> => {
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.metadata
  return _cachedReadSettings('metadata', SETTINGS_DEFAULTS.metadata, orgId)
}

export const getTentangSettings = async (): Promise<TentangSettings> => {
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.tentang
  return _cachedTentangSettings(orgId)
}
