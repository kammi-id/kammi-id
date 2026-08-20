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
import { resolveSiteImage } from '~/lib/utils/site-image'

// Cached DB lookup — all site-settings functions that call this must themselves
// be wrapped in 'use cache' at the call site (e.g. Footer, PengurusHero, etc.)
// This ensures the entire chain is cached during prerendering.
// Returns null on DB error or if no PP org exists (e.g. during Docker build).
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

// Inner cached reader for tentang.
const _cachedTentangSettings = async (
  orgId: string
): Promise<TentangSettings> => {
  'use cache'
  cacheLife('days')
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

  // Resolve storage keys → proxy paths so TentangScene can use them directly as CSS urls.
  const [heroImageUrl, prinsipImages, paradigmaImages] = await Promise.all([
    resolveSiteImage(heroData.heroImageUrl),
    Promise.all(prinsipData.prinsipImages.map(resolveSiteImage)) as Promise<
      TentangSettings['prinsipImages']
    >,
    Promise.all(paradigmaData.paradigmaImages.map(resolveSiteImage)) as Promise<
      TentangSettings['paradigmaImages']
    >
  ])

  return { heroImageUrl, prinsipImages, paradigmaImages }
}

// All public getter functions wrap their implementation with 'use cache' to ensure
// the entire data-fetching chain (including resolvePPOrgId) is cached during prerendering.
// This satisfies Next.js 16's requirement that all async operations inside Server Components
// and generateMetadata must be wrapped in 'use cache'.

const _cachedGetHomeHeroItemsSettings =
  async (): Promise<HomeHeroItemsSettings> => {
    'use cache'
    const orgId = await resolvePPOrgId()
    if (!orgId) return SETTINGS_DEFAULTS.homeHeroItems
    return _cachedReadSettings(
      'home-hero-items',
      SETTINGS_DEFAULTS.homeHeroItems,
      orgId
    )
  }

const _cachedGetHomeExtraItemsSettings =
  async (): Promise<HomeExtraItemsSettings> => {
    'use cache'
    const orgId = await resolvePPOrgId()
    if (!orgId) return SETTINGS_DEFAULTS.homeExtraItems
    return _cachedReadSettings(
      'home-extra-items',
      SETTINGS_DEFAULTS.homeExtraItems,
      orgId
    )
  }

const _cachedGetAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.about
  return _cachedReadSettings('about', SETTINGS_DEFAULTS.about, orgId)
}

const _cachedGetLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
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

const _cachedGetActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.actions
  return _cachedReadSettings('actions', SETTINGS_DEFAULTS.actions, orgId)
}

const _cachedGetNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.nav
  return _cachedReadSettings('nav', SETTINGS_DEFAULTS.nav, orgId)
}

const _cachedGetFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.footer
  return _cachedReadSettings('footer', SETTINGS_DEFAULTS.footer, orgId)
}

const _cachedGetMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.metadata
  return _cachedReadSettings('metadata', SETTINGS_DEFAULTS.metadata, orgId)
}

const _cachedGetTentangSettings = async (): Promise<TentangSettings> => {
  'use cache'
  const orgId = await resolvePPOrgId()
  if (!orgId) return SETTINGS_DEFAULTS.tentang
  return _cachedTentangSettings(orgId)
}

export const getHomeHeroItemsSettings = _cachedGetHomeHeroItemsSettings
export const getHomeExtraItemsSettings = _cachedGetHomeExtraItemsSettings
export const getAboutSettings = _cachedGetAboutSettings
export const getLeadershipSettings = _cachedGetLeadershipSettings
export const getActionsSettings = _cachedGetActionsSettings
export const getNavSettings = _cachedGetNavSettings
export const getFooterSettings = _cachedGetFooterSettings
export const getMetadataSettings = _cachedGetMetadataSettings
export const getTentangSettings = _cachedGetTentangSettings
