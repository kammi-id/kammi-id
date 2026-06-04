import type { Metadata } from 'next'
import { getMetadataSettings } from './_data/site-settings'
import {
  getHomeHeroItemsSettings,
  getAboutSettings,
  getLeadershipSettings
} from './_data/site-settings'
import { getNetworkStats, getPWOrganizations } from './_data/network'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { HomeScene } from './_components/home-scene'
import { ExtraSection } from './_components/extra-section'

export const generateMetadata = async (): Promise<Metadata> => {
  const meta = await getMetadataSettings()
  return {
    title: meta.pageTitle,
    description: meta.metaDescription,
    openGraph: {
      title: meta.pageTitle,
      description: meta.metaDescription,
      images: [
        {
          url: meta.ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'KAMMI.id'
        }
      ]
    }
  }
}

const Page = async () => {
  // ── Fetch all scene data in parallel ──────────────────────────────────────
  const [heroSettings, about, leadership, networkStats, pwOrgs] =
    await Promise.all([
      getHomeHeroItemsSettings(),
      getAboutSettings(),
      getLeadershipSettings(),
      // Network data: graceful fallback if DB is unavailable
      getNetworkStats().catch(() => ({
        wilayah: 0,
        daerah: 0,
        komisariat: 0
      })),
      getPWOrganizations().catch(() => [])
    ])

  // ── Resolve S3 / signed image URLs server-side ─────────────────────────────
  const heroItems = await Promise.all(
    heroSettings.items.map(async (item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      badgeText: item.badgeText,
      resolvedImageUrl: await resolveSiteImage(item.imageUrl)
    }))
  )

  const [ketuaSrc, sekjSrc, bendSrc] = await Promise.all([
    resolveSiteImage(leadership.triumvirate.ketua.photoUrl),
    resolveSiteImage(leadership.triumvirate.sekretaris.photoUrl),
    resolveSiteImage(leadership.triumvirate.bendahara.photoUrl)
  ])

  const resolvedLeadership = {
    periodLabel: leadership.periodLabel,
    heading: leadership.heading,
    triumvirate: {
      ketua: {
        name: leadership.triumvirate.ketua.name,
        photoSrc: ketuaSrc || null
      },
      sekretaris: {
        name: leadership.triumvirate.sekretaris.name,
        photoSrc: sekjSrc || null
      },
      bendahara: {
        name: leadership.triumvirate.bendahara.name,
        photoSrc: bendSrc || null
      }
    }
  }

  return (
    // Stable root wrapper — React Activity uses this div as the reference node
    // for insertBefore during navigation. Without it, GSAP's pin-spacer wrappers
    // would be the reference node, causing React to throw "not a child of this node".
    <div>
      <HomeScene
        heroItems={heroItems}
        about={about}
        leadership={resolvedLeadership}
        networkStats={networkStats}
        pwOrgs={pwOrgs}
      />
      <ExtraSection />
    </div>
  )
}

export default Page
