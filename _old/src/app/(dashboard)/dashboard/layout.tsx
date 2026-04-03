import type { JSX, ReactNode } from 'react'
import Sidebar from './_components/layout/sidebar'
import DashboardHeader from './_components/layout/header'
import DashboardOverlays from './_components/layout/overlays'
import { SidebarProvider, SidebarInset } from '~/components/shadcn/ui/sidebar'
import UserMenu from './_components/menu/user'

const DashboardLayout = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  return (
    <SidebarProvider>
      <Sidebar footer={<UserMenu />}></Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex h-full flex-col gap-4 p-4 md:gap-6 md:p-6'>
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
      <DashboardOverlays />
    </SidebarProvider>
  )
}

export default DashboardLayout
