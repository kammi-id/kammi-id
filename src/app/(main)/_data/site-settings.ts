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
  type MetadataSettings
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
  cacheTag('site-settings', orgId ? `site-settings-hero-${orgId}` : 'site-settings-hero')
  if (!orgId) return SETTINGS_DEFAULTS.hero
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero, orgId)
}

export const getAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-about-${orgId}` : 'site-settings-about')
  if (!orgId) return SETTINGS_DEFAULTS.about
  return readSiteSettings<AboutSettings>('about', SETTINGS_DEFAULTS.about, orgId)
}

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-leadership-${orgId}` : 'site-settings-leadership')
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
    leaderBlocks: raw.leaderBlocks ?? d.leaderBlocks,
  }
}

export const getActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-actions-${orgId}` : 'site-settings-actions')
  if (!orgId) return SETTINGS_DEFAULTS.actions
  return readSiteSettings<ActionsSettings>('actions', SETTINGS_DEFAULTS.actions, orgId)
}

export const getNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-nav-${orgId}` : 'site-settings-nav')
  if (!orgId) return SETTINGS_DEFAULTS.nav
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav, orgId)
}

export const getFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-footer-${orgId}` : 'site-settings-footer')
  if (!orgId) return SETTINGS_DEFAULTS.footer
  return readSiteSettings<FooterSettings>('footer', SETTINGS_DEFAULTS.footer, orgId)
}

export const getMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  const orgId = await resolvePPOrgId()
  cacheTag('site-settings', orgId ? `site-settings-metadata-${orgId}` : 'site-settings-metadata')
  if (!orgId) return SETTINGS_DEFAULTS.metadata
  return readSiteSettings<MetadataSettings>(
    'metadata',
    SETTINGS_DEFAULTS.metadata,
    orgId
  )
}
