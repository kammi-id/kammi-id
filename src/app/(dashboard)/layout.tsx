import type { ReactNode } from 'react'
import { Toaster } from '~/components/shadcn/ui/sonner'

const RootDashboardLayout = ({
  children
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
