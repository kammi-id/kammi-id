import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type NavSettings
} from '~/db/query/site-settings'

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
