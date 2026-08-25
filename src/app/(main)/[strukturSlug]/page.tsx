import type { Metadata } from 'next'
import { getMetadataSettings } from '../_data/site-settings'
import {
  getHomeHeroItemsSettings,
  getAboutSettings,
  getLeadershipSettings
} from '../_data/site-settings'
import { getNetworkStats, getPWOrganizations } from '../_data/network'
import {
  resolveStrukturIdFromParams,
  type StrukturRouteParams
} from '../_data/struktur'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { HomeScene } from './_components/home-scene'
import { ExtraSection } from './_components/extra-section'

type PageProps = {
  params: StrukturRouteParams
}

export const generateMetadata = async ({
  params
}: PageProps): Promise<Metadata> => {
  const orgId = await resolveStrukturIdFromParams(params)
  const meta = await getMetadataSettings(orgId)
  return {
    title: { absolute: meta.pageTitle },
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
    },
    twitter: {
      title: meta.pageTitle,
      description: meta.metaDescription,
      images: [meta.ogImageUrl]
    }
  }
}

const Page = async ({ params }: PageProps) => {
  const orgId = await resolveStrukturIdFromParams(params)

  // ── Fetch all scene data in parallel ──────────────────────────────────────
  const [heroSettings, about, leadership, networkStats, pwOrgs] =
    await Promise.all([
      getHomeHeroItemsSettings(orgId),
      getAboutSettings(orgId),
      getLeadershipSettings(orgId),
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
    <>
      <HomeScene
        heroItems={heroItems}
        about={about}
        leadership={resolvedLeadership}
        networkStats={networkStats}
        pwOrgs={pwOrgs}
      />
      <ExtraSection organizationId={orgId} />
    </>
  )
}

export default Page
