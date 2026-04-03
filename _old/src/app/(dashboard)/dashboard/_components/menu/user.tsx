import {
  type JSX,
  type ComponentPropsWithoutRef as ComponentProps,
  Suspense
} from 'react'
import SidebarMenuTemplate from './template'
import { LogoutButton } from '../logout/dialog'
import {
  SidebarMenuItem,
  SidebarMenuButton
} from '~/components/shadcn/ui/sidebar'
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '~/components/shadcn/ui/avatar'
import Link from 'next/link'
import Image from 'next/image'
import { getActiveSession } from '~/lib/auth/cookies'
import logo from '~/assets/logo.png'

type UserMenuProps = Omit<ComponentProps<typeof SidebarMenuTemplate>, 'items'>

const UserMenu = ({ ...props }: UserMenuProps): JSX.Element => {
  return (
    <SidebarMenuTemplate
      label='Menu Pengguna'
      custom={
        <>
          <Suspense fallback={null}>
            <SidebarMenuItem>
              <UserMenuLink />
            </SidebarMenuItem>
          </Suspense>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </>
      }
      {...props}
    />
  )
}

export default UserMenu

const UserMenuLink = async (): Promise<JSX.Element | null> => {
  const session = await getActiveSession()
  if (!session) {
    return null
  }

  return (
    <SidebarMenuButton
      size='lg'
      render={<Link href='/dashboard/settings/account' />}
    >
      <Avatar>
        <AvatarImage
          render={
            <Image
              src={session.user.connectedOrganization?.logo ?? logo}
              alt='logo'
              width={36}
              height={36}
            />
          }
        />
        <AvatarFallback className='uppercase'>
          {session.user.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <span>{session.user.name}</span>
    </SidebarMenuButton>
  )
}
