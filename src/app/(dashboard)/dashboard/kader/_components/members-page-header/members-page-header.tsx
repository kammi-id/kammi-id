import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Database01Icon,
  ArrowLeft02Icon,
  UserGroupIcon,
  CommandIcon
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

const typeIconMap: Record<string, IconSvgElement> = {
  kader: UserGroupIcon,
  alumni: UserGroupIcon,
  pemandu: CommandIcon,
  instruktur: CommandIcon,
  perangkat: CommandIcon
}

interface MembersPageHeaderProps {
  slug?: string[]
  pageTitle: string
  subTitle: string
  typePath: string
}

export const MembersPageHeader = ({
  slug,
  pageTitle,
  subTitle,
  typePath
}: MembersPageHeaderProps) => {
  const IconComponent = typeIconMap[typePath] ?? Database01Icon

  return (
    <div className='flex items-center gap-6'>
      {slug && slug.length > 0 && (
        <Link
          href={
            slug.length === 1
              ? `/dashboard/${typePath}/${slug[0]}`
              : `/dashboard/${typePath}/${slug.slice(0, -1).join('/')}`
          }
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'shrink-0 gap-1.5 transition-all hover:bg-primary hover:text-primary-foreground'
          )}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            className='size-4'
          />
          <span>Kembali</span>
        </Link>
      )}
      <div className='flex items-center gap-5'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 items-center justify-center rounded-2xl ring-4'>
          <HugeiconsIcon
            icon={IconComponent}
            strokeWidth={2}
            className='size-8'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-extrabold tracking-tight sm:text-4xl'>
            {pageTitle}
          </h1>
          <p className='text-muted-foreground max-w-2xl leading-relaxed'>
            {subTitle}
          </p>
        </div>
      </div>
    </div>
  )
}
