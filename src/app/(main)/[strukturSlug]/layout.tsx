import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'
import {
  resolveStrukturForPermalinkFromParams,
  getStrukturJsonLdOrganization,
  type StrukturRouteParams
} from '../_data/struktur'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import { buildOrganization, buildWebSite } from '~/lib/seo'

// `resolveStrukturIdFromParams` awaits `params` di luar batas `'use cache'`
// (dirinya sendiri bukan fungsi ter-cache, cuma pembungkus tipis di atas
// `resolveStrukturId` yang ter-cache) — Cache Components menghitung itu
// sebagai akses data dinamis di luar `<Suspense>`, dan karena ini layout
// bersama SETIAP rute di bawah `[strukturSlug]`, tanpa opt-out ini `next
// build` menolak memprarender shell statis satu pun halaman di subtree ini
// (lihat referensi `instant`: "Place the `false` as low as possible — only
// as high as needed to cover the routes you want to opt out"). Menaruhnya
// di sini, satu tempat, menutup seluruh subtree sekaligus — tidak perlu
// diulang di tiap `page.tsx` turunannya.
export const instant = false

type MainLayoutProps = {
  children: ReactNode
  params: StrukturRouteParams
}

// Struktur-scoped `metadataBase` (ticket 02) — overrides the root layout's
// PP-apex fallback for this segment and everything below it (shallow merge,
// last segment wins). Uses the same permalink-tolerant resolver as the layout
// body below, so a Non-Aktif Struktur's still-served Berita permalink also
// gets a correctly-hosted `metadataBase`, not PP's.
export const generateMetadata = async ({
  params
}: {
  params: StrukturRouteParams
}): Promise<Metadata> => {
  const struktur = await resolveStrukturForPermalinkFromParams(params)
  if (!struktur) return {}

  const graph = await getStrukturJsonLdOrganization(struktur.id)
  if (!graph) return {}

  return { metadataBase: new URL(`https://${resolveStrukturHost(graph)}`) }
}

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const struktur = await resolveStrukturForPermalinkFromParams(params)

  // Deleted, unknown, and not-yet-active sites never serve. A Non-Aktif
  // Struktur is the one exception that reaches this layout: its Berita
  // permalink is preserved as an archive (ADR 0013), while each navigable
  // page below resolves with `resolveStrukturIdFromParams` and answers 404.
  if (!struktur) notFound()

  // Ticket 02: every Situs Struktur announces its own identity, not PP's —
  // `getStrukturJsonLdOrganization` already resolves the direct induk/anak
  // and the logo into what `buildOrganization`/`buildWebSite` need. Injected
  // here (not the root layout, which does not know which Struktur is being
  // served) so both a Non-Aktif Struktur's minimal frame and the full
  // template carry the same identity scripts.
  const graph = await getStrukturJsonLdOrganization(struktur.id)
  const jsonLdScripts = graph ? (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOrganization(graph))
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebSite(graph))
        }}
      />
    </>
  ) : null

  if (struktur.isNonActive) {
    return (
      <>
        {jsonLdScripts}
        {children}
      </>
    )
  }

  return (
    <LenisProvider>
      <div className='flex min-h-screen flex-col'>
        {jsonLdScripts}
        <Navbar organizationId={struktur.id} />
        <main className='flex-1'>{children}</main>
        <Footer organizationId={struktur.id} />
      </div>
    </LenisProvider>
  )
}

export default MainLayout
