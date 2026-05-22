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

export const getHeroSettings = async (): Promise<HeroSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-hero')
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero)
}

export const getAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-about')
  return readSiteSettings<AboutSettings>('about', SETTINGS_DEFAULTS.about)
}

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-leadership')
  return readSiteSettings<LeadershipSettings>('leadership', SETTINGS_DEFAULTS.leadership)
}

export const getActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-actions')
  return readSiteSettings<ActionsSettings>('actions', SETTINGS_DEFAULTS.actions)
}

export const getNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-nav')
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav)
}

export const getFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-footer')
  return readSiteSettings<FooterSettings>('footer', SETTINGS_DEFAULTS.footer)
}

export const getMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-metadata')
  return readSiteSettings<MetadataSettings>('metadata', SETTINGS_DEFAULTS.metadata)
}
