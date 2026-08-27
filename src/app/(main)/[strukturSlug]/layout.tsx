import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'
import {
  resolveStrukturForPermalinkFromParams,
  type StrukturRouteParams
} from '../_data/struktur'

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

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const struktur = await resolveStrukturForPermalinkFromParams(params)

  // Deleted, unknown, and not-yet-active sites never serve. A Non-Aktif
  // Struktur is the one exception that reaches this layout: its Berita
  // permalink is preserved as an archive (ADR 0013), while each navigable
  // page below resolves with `resolveStrukturIdFromParams` and answers 404.
  if (!struktur) notFound()

  if (struktur.isNonActive) return children

  return (
    <LenisProvider>
      <div className='flex min-h-screen flex-col'>
        <Navbar organizationId={struktur.id} />
        <main className='flex-1'>{children}</main>
        <Footer organizationId={struktur.id} />
      </div>
    </LenisProvider>
  )
}

export default MainLayout
