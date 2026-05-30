import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HeroSettings,
  type AboutSettings,
  type LeadershipSettings,
  type ActionsSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings,
  type TentangSettings
} from '~/db/query/site-settings'
import { readOrganizationIdByType } from '~/db/query/organization'

// Cached PP org ID lookup — the PP org is stable, expires daily.
const resolvePPOrgId = async (): Promise<string | null> => {
  'use cache'
  cacheLife('days')
  cacheTag('pp-org-id')
  return readOrganizationIdByType('pp')
}

export const getHeroSettings = async (): Promise<HeroSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-hero-${orgId}` : 'site-settings-hero'
  )
  if (!orgId) return SETTINGS_DEFAULTS.hero
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero, orgId)
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
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag(
    'site-settings',
    orgId ? `site-settings-tentang-${orgId}` : 'site-settings-tentang'
  )
  if (!orgId) return SETTINGS_DEFAULTS.tentang

  const [heroData, prinsipData, paradigmaData, kredoData] = await Promise.all([
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
    ),
    readSiteSettings<{ kredoImageUrl: string }>(
      'tentang-kredo',
      { kredoImageUrl: SETTINGS_DEFAULTS.tentang.kredoImageUrl },
      orgId
    )
  ])

  return {
    heroImageUrl: heroData.heroImageUrl,
    prinsipImages: prinsipData.prinsipImages,
    paradigmaImages: paradigmaData.paradigmaImages,
    kredoImageUrl: kredoData.kredoImageUrl
  }
}
