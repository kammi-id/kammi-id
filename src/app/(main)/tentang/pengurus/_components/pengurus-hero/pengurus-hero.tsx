import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { PengurusHeroClient } from './pengurus-hero-client'

export const PengurusHero = async () => {
  const { periodLabel, heading, triumvirate } = await getLeadershipSettings()

  const hasContent = [
    triumvirate.ketua,
    triumvirate.sekretaris,
    triumvirate.bendahara
  ].some((p) => p.name || p.photoUrl)
  if (!hasContent) return null

  const [ketuaSrc, sekjSrc, bendSrc] = await Promise.all([
    resolveSiteImage(triumvirate.ketua.photoUrl),
    resolveSiteImage(triumvirate.sekretaris.photoUrl),
    resolveSiteImage(triumvirate.bendahara.photoUrl)
  ])

  return (
    <PengurusHeroClient
      periodLabel={periodLabel}
      heading={heading}
      triumvirate={{
        ketua: { name: triumvirate.ketua.name, photoSrc: ketuaSrc },
        sekretaris: {
          name: triumvirate.sekretaris.name,
          photoSrc: sekjSrc
        },
        bendahara: {
          name: triumvirate.bendahara.name,
          photoSrc: bendSrc
        }
      }}
    />
  )
}
