'use client'

import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import Dialog from '~/components/common/dialog'
import { SidebarMenuButton } from '~/components/shadcn/ui/sidebar'
import { useStore } from '@nanostores/react'
import { $openLogoutDialog, setOpenLogoutDialog } from './store'
import { LogOut } from 'lucide-react'

const LogoutDialog = ({
  ...props
}: ComponentProps<typeof Dialog>): JSX.Element => {
  const open = useStore($openLogoutDialog)

  return (
    <Dialog
      title='Logout'
      description='Apakah antum yakin ingin logout?'
      open={open}
      onOpenChange={setOpenLogoutDialog}
      showCloseButton={false}
      {...props}
    />
  )
}

export default LogoutDialog

export const LogoutButton = (): JSX.Element => {
  return (
    <SidebarMenuButton onClick={() => setOpenLogoutDialog(true)}>
      <LogOut />
      <span>Logout</span>
    </SidebarMenuButton>
  )
}
