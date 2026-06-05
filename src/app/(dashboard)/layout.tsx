import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Toaster } from '~/components/shadcn/ui/sonner'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

const RootDashboardLayout = ({
  children,
}: Readonly<{
  children: ReactNode
}>) => {
  return (
    <>
      {children}
      <Toaster position='top-right' />
    </>
  )
}

export default RootDashboardLayout
