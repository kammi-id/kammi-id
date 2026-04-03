import type { JSX } from 'react'
import { SidebarTrigger } from '~/components/shadcn/ui/sidebar'
import { Separator } from '~/components/shadcn/ui/separator'
import { Button } from '~/components/shadcn/ui/button'
import Link from 'next/link'
import { LucideExternalLink } from 'lucide-react'

const DashboardHeader = (): JSX.Element => {
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 py-2 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-8'
        />
        <div className='ml-auto flex items-center gap-2'>
          <Button
            variant='link'
            size='sm'
            className='dark:text-foreground hidden sm:flex'
            data-icon='inline-start'
            nativeButton={false}
            render={<Link href='/' target='_blank' />}
          >
            <LucideExternalLink />
            <span>Beranda KAMMI.id</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
