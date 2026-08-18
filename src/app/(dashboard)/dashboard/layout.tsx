import { type CSSProperties, type ReactNode } from 'react'

import { AppSidebar } from './_components/app-sidebar'
import { SiteHeader, CredentialPanelServer } from './_components/site-header'
import { LogoutDialog } from './_components/logout'
import { SidebarInset, SidebarProvider } from '~/components/shadcn/ui/sidebar'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  canManageKestrukturan,
  type StrukturJenjang
} from '~/lib/auth/kestrukturan'
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

  // Ditanyakan ke matriks, bukan ditulis ulang sebagai `role === 'root' ||
  // role === 'bpw'` — rumusan itu akan membuka keranjang sampah untuk seluruh
  // BPW se-Indonesia. Dihitung di sini, di server, sebab `kestrukturan.ts`
  // menyentuh basis data dan tidak boleh ikut ke bundel klien.
  const canRestoreStruktur = canManageKestrukturan(
    session.user.role,
    (session.user.connectedOrganization?.type ??
      null) as StrukturJenjang | null,
    'pw',
    'pulihkan'
  )

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as CSSProperties
      }
    >
      <AppSidebar
        variant='inset'
        user={session.user}
        canRestoreStruktur={canRestoreStruktur}
      />
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
