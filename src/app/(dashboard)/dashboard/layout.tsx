import { type CSSProperties, type ReactNode } from 'react'

import { AppSidebar } from './_components/app-sidebar'
import { SiteHeader } from './_components/site-header'
import { CredentialPanelServer } from './_components/site-header/credential-panel-server'
import { LogoutDialog } from './_components/logout/logout'
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
      <AppSidebar variant='inset' user={session.user} />
      <SidebarInset>
        <SiteHeader rightSlot={<CredentialPanelServer />} />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            {children}
          </div>
        </div>
      </SidebarInset>
      <LogoutDialog />
    </SidebarProvider>
  )
}

export default DashboardLayout
