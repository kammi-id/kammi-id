'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '~/components/shadcn/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/shadcn/ui/dropdown-menu'
import Link from 'next/link'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '~/components/shadcn/ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  UserCircle02Icon,
  Notification03Icon,
  Logout01Icon
} from '@hugeicons/core-free-icons'
import { openLogoutDialog } from './logout/store'

export const NavUser = ({
  user
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) => {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuButton
                size='lg'
                className='aria-expanded:bg-muted'
                {...props}
              >
                <UserInfo user={user} />
                <HugeiconsIcon
                  icon={MoreVerticalCircle01Icon}
                  strokeWidth={2}
                  className='ml-auto size-4'
                />
              </SidebarMenuButton>
            )}
          ></DropdownMenuTrigger>
          <DropdownMenuContent
            className='min-w-56'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <UserInfo user={user} className='size-8' />
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={(props) => (
                  <Link href='/dashboard/user/account' {...props}>
                    <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />
                    Account
                  </Link>
                )}
              />
              <DropdownMenuItem
                render={(props) => (
                  <Link href='/dashboard/user/notifications' {...props}>
                    <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
                    Notifications
                  </Link>
                )}
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openLogoutDialog()}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const UserInfo = ({
  user,
  className = 'size-8'
}: {
  user: { name: string; email: string; avatar: string }
  className?: string
}) => {
  return (
    <>
      <Avatar className={`${className} rounded-lg grayscale`}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className='rounded-lg'>
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='grid flex-1 text-left text-sm leading-tight'>
        <span className='truncate font-medium'>{user.name}</span>
        <span className='text-foreground/70 truncate text-xs'>
          {user.email}
        </span>
      </div>
    </>
  )
}
