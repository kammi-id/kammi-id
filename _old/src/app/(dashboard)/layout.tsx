import type { JSX, ReactNode } from 'react'
import { Toaster } from '~/components/shadcn/ui/sonner'

const DashboardRootLayout = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

export default DashboardRootLayout
