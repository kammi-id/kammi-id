import type { ReactNode } from 'react'
import { Navbar } from './_components/navbar'
import { Footer } from './_components/footer'

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex min-h-screen flex-col'>
      <Navbar />
      <main className='flex-1'>{children}</main>
      <Footer />
    </div>
  )
}

export default MainLayout
