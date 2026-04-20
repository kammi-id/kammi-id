import { Separator } from '~/components/shadcn/ui/separator'
import { SidebarTrigger } from '~/components/shadcn/ui/sidebar'

/**
 * SiteHeader component provides the top navigation bar for the dashboard.
 *
 * It includes the sidebar trigger for collapsing/expanding the navigation and a
 * header title. This component is designed to maintain a consistent height
 * based on the CSS variable `--header-height`.
 *
 * @returns A React element rendering the site header.
 */
export const SiteHeader = () => {
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 h-4 data-vertical:self-auto'
        />
        <h1 className='text-base font-medium'>Documents</h1>
      </div>
    </header>
  )
}
