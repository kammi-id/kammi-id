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
import { resolveSiteImage } from '~/lib/utils/site-image'

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
// the entire data-fetching chain is cached during prerendering. This satisfies
// Next.js 16's requirement that all async operations inside Server Components
// and generateMetadata must be wrapped in 'use cache'.
//
// Each getter takes the Struktur's organization id as an argument — callers
// resolve it (e.g. via `resolveStrukturId`) rather than this module resolving
// PP internally, so the same reader works for any Struktur.

const _cachedGetHomeHeroItemsSettings = async (
  organizationId: string | null
): Promise<HomeHeroItemsSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.homeHeroItems
  return _cachedReadSettings(
    'home-hero-items',
    SETTINGS_DEFAULTS.homeHeroItems,
    organizationId
  )
}

const _cachedGetHomeExtraItemsSettings = async (
  organizationId: string | null
): Promise<HomeExtraItemsSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.homeExtraItems
  return _cachedReadSettings(
    'home-extra-items',
    SETTINGS_DEFAULTS.homeExtraItems,
    organizationId
  )
}

const _cachedGetAboutSettings = async (
  organizationId: string | null
): Promise<AboutSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.about
  return _cachedReadSettings('about', SETTINGS_DEFAULTS.about, organizationId)
}

const _cachedGetLeadershipSettings = async (
  organizationId: string | null
): Promise<LeadershipSettings> => {
  'use cache'
  const d = SETTINGS_DEFAULTS.leadership
  if (!organizationId) return d
  const raw = await _cachedReadSettings<Partial<LeadershipSettings>>(
    'leadership',
    d,
    organizationId
  )
  return {
    periodLabel: raw.periodLabel ?? d.periodLabel,
    heading: raw.heading ?? d.heading,
    triumvirate: raw.triumvirate ?? d.triumvirate,
    leaders: raw.leaders ?? d.leaders,
    leaderBlocks: raw.leaderBlocks ?? d.leaderBlocks
  }
}

const _cachedGetActionsSettings = async (
  organizationId: string | null
): Promise<ActionsSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.actions
  return _cachedReadSettings(
    'actions',
    SETTINGS_DEFAULTS.actions,
    organizationId
  )
}

const _cachedGetNavSettings = async (
  organizationId: string | null
): Promise<NavSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.nav
  return _cachedReadSettings('nav', SETTINGS_DEFAULTS.nav, organizationId)
}

const _cachedGetFooterSettings = async (
  organizationId: string | null
): Promise<FooterSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.footer
  return _cachedReadSettings(
    'footer',
    SETTINGS_DEFAULTS.footer,
    organizationId
  )
}

const _cachedGetMetadataSettings = async (
  organizationId: string | null
): Promise<MetadataSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.metadata
  return _cachedReadSettings(
    'metadata',
    SETTINGS_DEFAULTS.metadata,
    organizationId
  )
}

const _cachedGetTentangSettings = async (
  organizationId: string | null
): Promise<TentangSettings> => {
  'use cache'
  if (!organizationId) return SETTINGS_DEFAULTS.tentang
  return _cachedTentangSettings(organizationId)
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
