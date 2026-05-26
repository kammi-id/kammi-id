import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HeroSettings,
  type AboutSettings,
  type ActionsSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings
} from '~/db/query/site-settings'

export const getCachedHeroSettings = async (organizationId: string): Promise<HeroSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-hero-${organizationId}`)
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero, organizationId)
}

export const getCachedAboutSettings = async (organizationId: string): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-about-${organizationId}`)
  return readSiteSettings<AboutSettings>('about', SETTINGS_DEFAULTS.about, organizationId)
}

export const getCachedActionsSettings = async (organizationId: string): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-actions-${organizationId}`)
  return readSiteSettings<ActionsSettings>('actions', SETTINGS_DEFAULTS.actions, organizationId)
}

export const getCachedNavSettings = async (organizationId: string): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-nav-${organizationId}`)
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav, organizationId)
}

export const getCachedFooterSettings = async (organizationId: string): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-footer-${organizationId}`)
  return readSiteSettings<FooterSettings>('footer', SETTINGS_DEFAULTS.footer, organizationId)
}

export const getCachedMetadataSettings = async (organizationId: string): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-metadata-${organizationId}`)
  return readSiteSettings<MetadataSettings>(
    'metadata',
    SETTINGS_DEFAULTS.metadata,
    organizationId
  )
}
