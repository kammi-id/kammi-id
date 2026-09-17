'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { Input } from '~/components/shadcn/ui/input'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { ImageUpload } from '~/components/image-upload'
import { deleteImageAction } from '~/lib/actions/storage'
import {
  updateOrganizationProfileAction,
  type OrganizationProfileState
} from './action'

interface OrganizationProfileFormProps {
  initialData: {
    name: string
    slug: string
    logo: string | null
  }
}

/**
 * **Three fields, all live. Zero dead controls** (spec §8.1).
 *
 * What is frozen is not shown here at all — `code`, Jenjang and induk are an
 * identity block at the head of the page. Hiding them outright was rejected too:
 * `code` derives the Nomor Induk of every Kader beneath this Struktur, and
 * `/dashboard/branches` only ever shows **children**, so without this page a BPH
 * has nowhere at all to read its own code.
 */
export const OrganizationProfileForm = ({
  initialData
}: OrganizationProfileFormProps) => {
  const [name, setName] = React.useState(initialData.name)
  const [slug, setSlug] = React.useState(initialData.slug)
  const [logoPath, setLogoPath] = React.useState<string | undefined>(
    initialData.logo ?? undefined
  )
  const [state, action, isPending] = React.useActionState(
    updateOrganizationProfileAction,
    {} as OrganizationProfileState
  )

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.message)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  React.useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.name) setName(state.values.name)
      if (state.values.slug) setSlug(state.values.slug)
    }
  }, [state.values, state.success])

  // Berkas yatim dibersihkan saat ditinggalkan tanpa disimpan — pola
  // `add-form.tsx` apa adanya.
  React.useEffect(() => {
    return () => {
      if (logoPath && logoPath !== initialData.logo) {
        deleteImageAction(logoPath)
      }
    }
  }, [logoPath, initialData.logo])

  return (
    <form action={action} className='space-y-6'>
      <FieldGroup>
        <Field data-invalid={!!state.errors?.name || undefined}>
          <FieldLabel htmlFor='name'>Nama Struktur</FieldLabel>
          <Input
            id='name'
            name='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-invalid={!!state.errors?.name || undefined}
          />
          <FieldError
            errors={state.errors?.name?.map((message) => ({ message }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.slug || undefined}>
          <FieldLabel htmlFor='slug'>Slug</FieldLabel>
          <Input
            id='slug'
            name='slug'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            aria-invalid={!!state.errors?.slug || undefined}
          />
          {/* Peringatan tenang, bukan dialog: mematahkan tautan lama adalah
              konsekuensi yang wajar, bukan kesalahan yang perlu diblokir. */}
          <FieldDescription>
            Mengubah slug mematahkan tautan publik yang lama.
          </FieldDescription>
          <FieldError
            errors={state.errors?.slug?.map((message) => ({ message }))}
          />
        </Field>

        <Field>
          <ImageUpload
            label='Logo'
            folder='logos'
            value={logoPath}
            onChange={(path) => setLogoPath(path)}
          />
          <input type='hidden' name='logo' value={logoPath || ''} />
        </Field>

        <div className='flex justify-end pt-2'>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className='animate-spin'
                data-icon='inline-start'
              />
            )}
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
