import React from 'react'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Database01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'

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
  return (
    <div className='flex items-center gap-6'>
      {slug && slug.length > 0 && (
        <Link
          href={
            slug.length === 1
              ? `/dashboard/${typePath}/${slug[0] === 'kader' ? 'kader' : slug[0]}`
              : `/dashboard/${typePath}/${slug.slice(0, -1).join('/')}`
          }
          className={cn(
            buttonVariants({ variant: 'outline', size: 'icon' }),
            'hover:bg-primary hover:text-primary-foreground size-11 shrink-0 rounded-2xl transition-all'
          )}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            className='size-5'
          />
        </Link>
      )}
      <div className='flex items-center gap-5'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 items-center justify-center rounded-2xl ring-4'>
          <HugeiconsIcon
            icon={Database01Icon}
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
