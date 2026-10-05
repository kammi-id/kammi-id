import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type FooterSettings
} from '~/db/query/site-settings'

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
