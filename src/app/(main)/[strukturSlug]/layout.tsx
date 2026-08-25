import type { ReactNode } from 'react'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'
import {
  resolveStrukturIdFromParams,
  type StrukturRouteParams
} from '../_data/struktur'

type MainLayoutProps = {
  children: ReactNode
  params: StrukturRouteParams
}

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const organizationId = await resolveStrukturIdFromParams(params)

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
