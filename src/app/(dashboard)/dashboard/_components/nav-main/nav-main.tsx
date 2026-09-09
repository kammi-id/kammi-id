'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '~/components/shadcn/ui/sidebar'

/**
 * NavMain component renders a group of navigation links within the sidebar.
 * It supports an optional group title and a list of navigation items.
 *
 * @param props - The properties for the NavMain component.
 * @param props.title - Optional title for the navigation group (e.g., "Pembinaan Kader").
 * @param props.items - Array of navigation items to be rendered as menu buttons.
 * @param props.items[].title - The text label for the navigation item.
 * @param props.items[].url - The destination URL for the navigation link.
 * @param props.items[].icon - Optional React node to be rendered as the item's icon.
 * @param props.items[].isActive - Optional boolean to indicate if the item is currently active.
 *
 * @returns A SidebarGroup containing the navigation menu.
 */
export const NavMain = ({
  title,
  items
}: {
  title?: string
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
  }[]
}) => {
  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
