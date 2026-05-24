import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  User02Icon,
  Mortarboard01Icon,
  TeacherIcon,
  Globe02Icon
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

const typeIconMap: Record<string, IconSvgElement> = {
  kader: User02Icon,
  alumni: Mortarboard01Icon,
  pemandu: TeacherIcon,
  instruktur: TeacherIcon,
  perangkat: TeacherIcon
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
  const IconComponent = typeIconMap[typePath] ?? Globe02Icon

  const backHref =
    slug && slug.length > 0
      ? slug.length === 1
        ? `/dashboard/${typePath}`
        : `/dashboard/${typePath}/${slug.slice(0, -1).join('/')}`
      : null

  return (
    <div className='space-y-3'>
      {backHref && (
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'icon' }),
            'size-8 shrink-0 transition-all hover:bg-primary hover:text-primary-foreground'
          )}
          aria-label='Kembali'
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className='size-4' />
        </Link>
      )}
      <div className='flex items-start gap-5'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon icon={IconComponent} strokeWidth={2} className='size-7' />
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
