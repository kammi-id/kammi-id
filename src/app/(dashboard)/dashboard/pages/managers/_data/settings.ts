import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type LeadershipSettings
} from '~/db/query/site-settings'

export const getLeadershipSettings = async (): Promise<LeadershipSettings> => {
  return readSiteSettings<LeadershipSettings>('leadership', SETTINGS_DEFAULTS.leadership)
}
