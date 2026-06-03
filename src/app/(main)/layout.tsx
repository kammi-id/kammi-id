import type { ReactNode } from 'react'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'
import { LenisProvider } from '~/components/lenis-provider'

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <LenisProvider>
      <div className='flex min-h-screen flex-col'>
        <Navbar />
        <main className='flex-1'>{children}</main>
        <Footer />
      </div>
    </LenisProvider>
  )
}

export default MainLayout
