'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Globe02Icon } from '@hugeicons/core-free-icons'
import { Switch } from '~/components/shadcn/ui/switch'
import {
  Field,
  FieldContent,
  FieldTitle,
  FieldDescription
} from '~/components/shadcn/ui/field'
import { setSiteActiveAction } from './action'

type SiteActiveToggleClientProps = {
  organizationSlug: string
  initialIsActive: boolean
  hasPublishedArticle: boolean
}

// RSC/client boundary (AGENTS.md "*-client.tsx"): only the interactive
// switch itself needs to be a Client Component — the data fetch that feeds
// it stays in the server-rendered `site-active-toggle.tsx`.
export const SiteActiveToggleClient = ({
  organizationSlug,
  initialIsActive,
  hasPublishedArticle
}: SiteActiveToggleClientProps) => {
  const [isActive, setIsActive] = React.useState(initialIsActive)
  const [isPending, startTransition] = React.useTransition()

  // Turning off never has a prerequisite (spec "Aktivasi Situs"), so the
  // switch only ever disables on the way to "on" — never on the way off.
  const disabled = isPending || (!isActive && !hasPublishedArticle)

  const handleChange = (nextActive: boolean) => {
    startTransition(async () => {
      const result = await setSiteActiveAction(nextActive)
      setIsActive(result.isActive)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  const description = isActive
    ? `Sedang melayani publik di ${organizationSlug}.kammi.id.`
    : hasPublishedArticle
      ? 'Nyalakan agar alamat publik Struktur ini mulai melayani.'
      : 'Terbitkan minimal satu Berita lebih dulu sebelum Situs bisa dinyalakan.'

  return (
    <div className='border-primary/20 bg-primary/5 rounded-3xl border px-6 py-5'>
      <Field orientation='horizontal'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-11 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={Globe02Icon}
            strokeWidth={2}
            className='size-5'
          />
        </div>
        <FieldContent>
          <FieldTitle>Situs Aktif</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <Switch
          checked={isActive}
          disabled={disabled}
          onCheckedChange={handleChange}
          aria-label='Situs Aktif'
        />
      </Field>
    </div>
  )
}
