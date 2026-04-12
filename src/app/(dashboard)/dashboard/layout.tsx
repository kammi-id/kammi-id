import { type CSSProperties, type ReactNode } from 'react'

import { AppSidebar } from '~/components/shadcn/app-sidebar'
import { SiteHeader } from '~/components/shadcn/site-header'
import { SidebarInset, SidebarProvider } from '~/components/shadcn/ui/sidebar'
import { readActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

const DashboardLayout = async ({
  children
}: Readonly<{
  children: ReactNode
}>) => {
  const session = await readActiveSession()

  if (!session) {
    return redirect('/login')
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayout
