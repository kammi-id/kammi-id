import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type TentangSettings
} from '~/db/query/site-settings'

export const getCachedTentangSettings = async (
  organizationId: string
): Promise<TentangSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-tentang-${organizationId}`)
  return readSiteSettings<TentangSettings>(
    'tentang',
    SETTINGS_DEFAULTS.tentang,
    organizationId
  )
}
