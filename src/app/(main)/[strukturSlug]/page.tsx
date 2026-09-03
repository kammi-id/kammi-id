import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMetadataSettings } from '../_data/site-settings'
import {
  getHomeHeroItemsSettings,
  getAboutSettings,
  getLeadershipSettings
} from '../_data/site-settings'
import { getNetworkStats, getPWOrganizations } from '../_data/network'
import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '../_data/struktur'
import { resolveSitusTemplateVariant } from '~/lib/struktur/situs-template'
import { jenjangLabel } from '~/lib/struktur/jenjang'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { HomeScene } from './_components/home-scene'
import { ExtraSection } from './_components/extra-section'
import { LeanHomeScene } from './_components/lean-home-scene'
import { BeritaPreviewSection } from './_components/berita-preview-section'
import { BeritaJaringanSection } from './_components/berita-jaringan-section'

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
    alternates: { canonical: '/' },
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
  if (!orgId) notFound()
  const identity = await getStrukturIdentity(orgId)

  // `layout.tsx` already answers not-found for a null organization id before
  // this page ever renders (ticket 02), so `identity` is null here only if
  // the organization vanished between that resolve and this one — 'lengkap'
  // is the pre-ticket-04 behavior, the safest fallback for a case that
  // shouldn't reach this line in practice.
  const variant = identity
    ? resolveSitusTemplateVariant(identity.type)
    : 'lengkap'

  if (variant === 'ramping' && identity) {
    const leadership = await getLeadershipSettings(orgId)

    const [ketuaSrc, sekjSrc, bendSrc, logoSrc] = await Promise.all([
      resolveSiteImage(leadership.triumvirate.ketua.photoUrl),
      resolveSiteImage(leadership.triumvirate.sekretaris.photoUrl),
      resolveSiteImage(leadership.triumvirate.bendahara.photoUrl),
      identity.logo ? resolveSiteImage(identity.logo) : Promise.resolve('')
    ])

    const resolvedLeaderBlocks = await Promise.all(
      leadership.leaderBlocks.map(async (block) => ({
        id: block.id,
        title: block.title,
        members: await Promise.all(
          block.members.map(async (member) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            photoSrc: (await resolveSiteImage(member.photoUrl)) || null
          }))
        )
      }))
    )

    return (
      <>
        <LeanHomeScene
          identity={{
            name: identity.name,
            jenjangLabel: jenjangLabel(identity.type),
            logoSrc: logoSrc || null
          }}
          leadership={{
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
            },
            leaderBlocks: resolvedLeaderBlocks
          }}
        />
        <BeritaPreviewSection
          organizationId={orgId}
          strukturName={identity.name}
        />
      </>
    )
  }

  // ── Template lengkap (PP) — unchanged from before ticket 04 ────────────────

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
      <BeritaPreviewSection
        organizationId={orgId}
        strukturName={identity?.name ?? null}
      />
      <BeritaJaringanSection />
      <ExtraSection organizationId={orgId} />
    </>
  )
}

export default Page
