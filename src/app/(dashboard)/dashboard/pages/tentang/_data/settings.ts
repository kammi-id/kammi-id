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

  const [heroData, prinsipData, paradigmaData, kredoData] = await Promise.all([
    readSiteSettings<{ heroImageUrl: string }>(
      'tentang-hero',
      { heroImageUrl: SETTINGS_DEFAULTS.tentang.heroImageUrl },
      organizationId
    ),
    readSiteSettings<{ prinsipImages: TentangSettings['prinsipImages'] }>(
      'tentang-prinsip',
      { prinsipImages: SETTINGS_DEFAULTS.tentang.prinsipImages },
      organizationId
    ),
    readSiteSettings<{ paradigmaImages: TentangSettings['paradigmaImages'] }>(
      'tentang-paradigma',
      { paradigmaImages: SETTINGS_DEFAULTS.tentang.paradigmaImages },
      organizationId
    ),
    readSiteSettings<{ kredoImageUrl: string }>(
      'tentang-kredo',
      { kredoImageUrl: SETTINGS_DEFAULTS.tentang.kredoImageUrl },
      organizationId
    )
  ])

  return {
    heroImageUrl: heroData.heroImageUrl,
    prinsipImages: prinsipData.prinsipImages,
    paradigmaImages: paradigmaData.paradigmaImages,
    kredoImageUrl: kredoData.kredoImageUrl
  }
}
