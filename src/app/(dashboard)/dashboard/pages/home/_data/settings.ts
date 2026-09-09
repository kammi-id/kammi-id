import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HomeHeroItemsSettings,
  type HomeExtraItemsSettings,
  type AboutSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings
} from '~/db/query/site-settings'

export const getCachedHomeHeroItemsSettings = async (
  organizationId: string
): Promise<HomeHeroItemsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-home-hero-items-${organizationId}`)
  return readSiteSettings<HomeHeroItemsSettings>(
    'home-hero-items',
    SETTINGS_DEFAULTS.homeHeroItems,
    organizationId
  )
}

export const getCachedHomeExtraItemsSettings = async (
  organizationId: string
): Promise<HomeExtraItemsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-home-extra-items-${organizationId}`)
  return readSiteSettings<HomeExtraItemsSettings>(
    'home-extra-items',
    SETTINGS_DEFAULTS.homeExtraItems,
    organizationId
  )
}

export const getCachedAboutSettings = async (
  organizationId: string
): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-about-${organizationId}`)
  return readSiteSettings<AboutSettings>(
    'about',
    SETTINGS_DEFAULTS.about,
    organizationId
  )
}

export const getCachedNavSettings = async (
  organizationId: string
): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-nav-${organizationId}`)
  return readSiteSettings<NavSettings>(
    'nav',
    SETTINGS_DEFAULTS.nav,
    organizationId
  )
}

export const getCachedFooterSettings = async (
  organizationId: string
): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-footer-${organizationId}`)
  return readSiteSettings<FooterSettings>(
    'footer',
    SETTINGS_DEFAULTS.footer,
    organizationId
  )
}

export const getCachedMetadataSettings = async (
  organizationId: string
): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-metadata-${organizationId}`)
  return readSiteSettings<MetadataSettings>(
    'metadata',
    SETTINGS_DEFAULTS.metadata,
    organizationId
  )
}
