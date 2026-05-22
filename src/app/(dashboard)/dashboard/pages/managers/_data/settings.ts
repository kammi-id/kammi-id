import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type LeadershipSettings
} from '~/db/query/site-settings'

export const getCachedLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-leadership')
  return readSiteSettings<LeadershipSettings>('leadership', SETTINGS_DEFAULTS.leadership)
}
