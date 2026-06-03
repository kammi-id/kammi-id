import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HomeHeroItemsSettings,
  type HomeExtraItemsSettings
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
