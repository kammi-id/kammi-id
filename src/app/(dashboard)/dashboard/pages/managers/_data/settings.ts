import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type LeadershipSettings
} from '~/db/query/site-settings'

export const getLeadershipSettings = async (
  organizationId: string
): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('site-settings', `site-settings-leadership-${organizationId}`)
  const raw = await readSiteSettings<Partial<LeadershipSettings>>(
    'leadership',
    SETTINGS_DEFAULTS.leadership,
    organizationId
  )
  const d = SETTINGS_DEFAULTS.leadership
  return {
    periodLabel: raw.periodLabel ?? d.periodLabel,
    heading: raw.heading ?? d.heading,
    triumvirate: raw.triumvirate ?? d.triumvirate,
    leaders: raw.leaders ?? d.leaders,
    leaderBlocks: raw.leaderBlocks ?? d.leaderBlocks
  }
}
