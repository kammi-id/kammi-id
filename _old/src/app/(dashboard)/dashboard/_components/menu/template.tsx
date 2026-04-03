import type { JSX, ComponentProps, ReactNode } from 'react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '~/components/shadcn/ui/sidebar'
import Link from 'next/link'

type LinkItem = {
  label: string
  uri: string
  icon: ReactNode
  hide?: boolean
}

type SidebarMenuTemplateProps = {
  items?: Array<LinkItem>
  label?: string
  custom?: ReactNode
} & ComponentProps<typeof SidebarGroup>

const SidebarMenuTemplate = ({
  items,
  label,
  custom,
  ...props
}: SidebarMenuTemplateProps): JSX.Element => {
  return (
    <SidebarGroup {...props}>
      {label && (
        <SidebarGroupLabel className='uppercase'>{label}</SidebarGroupLabel>
      )}
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items &&
            items
              .filter((item) => !item.hide)
              .map((item, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton render={<Link href={item.uri} />}>
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          {custom}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export default SidebarMenuTemplate
