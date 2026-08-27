import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'
import {
  resolveStrukturIdFromParams,
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
  const organizationId = await resolveStrukturIdFromParams(params)

  // `resolveStrukturIdFromParams` already folds "slug tidak dikenal",
  // "Struktur Terhapus", and "Situs belum aktif" into the same `null` —
  // gating here, once, covers every route under `[strukturSlug]` instead of
  // each page repeating the check (ticket 02).
  if (!organizationId) notFound()

  return (
    <LenisProvider>
      <div className='flex min-h-screen flex-col'>
        <Navbar organizationId={organizationId} />
        <main className='flex-1'>{children}</main>
        <Footer organizationId={organizationId} />
      </div>
    </LenisProvider>
  )
}

export default MainLayout
