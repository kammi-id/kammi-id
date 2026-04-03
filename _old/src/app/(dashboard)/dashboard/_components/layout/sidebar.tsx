import type {
  JSX,
  ComponentPropsWithoutRef as ComponentProps,
  ReactNode
} from 'react'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '~/components/shadcn/ui/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import logo from '~/assets/logo.png'

const Sidebar = ({
  children,
  footer,
  ...props
}: ComponentProps<typeof SidebarRoot> & {
  footer?: ReactNode
}): JSX.Element => {
  return (
    <SidebarRoot {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href='/dashboard' />}>
              <Image src={logo} width={24} height={24} alt='Dashboard' />
              <span className='text-lg font-bold'>KAMMI.id</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </SidebarRoot>
  )
}

export default Sidebar
