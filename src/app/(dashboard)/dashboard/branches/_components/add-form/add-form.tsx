'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Button } from '~/components/shadcn/ui/button'
import { orgFormStore, resetOrgForm, orgSheetStore } from './store'
import {
  createOrganizationAction,
  updateOrganizationAction,
  type OrgFormState
} from './action'
import { type Organization } from '../branches-table/columns'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { ImageUpload } from '~/components/image-upload'
import { deleteImageAction } from '~/lib/actions/storage'

export const AddOrganizationForm = ({
  parentOrg,
  editData,
  onClose
}: {
  parentOrg: Organization
  editData?: Organization | null
  onClose: () => void
}) => {
  const [logoPath, setLogoPath] = React.useState<string | undefined>(
    editData?.logo
  )
  const [state, action, isPending] = React.useActionState(
    async (prevState: OrgFormState, formData: FormData) => {
      if (editData) {
        return updateOrganizationAction(prevState, formData)
      }
      return createOrganizationAction(prevState, formData)
    },
    { success: false } as OrgFormState
  )

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      orgSheetStore.set(false)
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state])

  React.useEffect(() => {
    return () => {
      if (logoPath && logoPath !== editData?.logo) {
        deleteImageAction(logoPath)
      }
    }
  }, [logoPath, editData?.logo])

  const childTypes: Record<string, { value: string; label: string }[]> = {
    pp: [
      { value: 'pw', label: 'Pengurus Wilayah (PW)' },
      { value: 'pdln', label: 'Pengurus Daerah Luar Negeri (PDLN)' }
    ],
    pw: [{ value: 'pd', label: 'Pengurus Daerah (PD)' }],
    pd: [{ value: 'pk', label: 'Pengurus Komisariat (PK)' }],
    pdln: [{ value: 'pk', label: 'Pengurus Komisariat (PK)' }],
    pk: []
  }

  const availableTypes = childTypes[parentOrg.type] || []

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='parentId' value={parentOrg.id} />
      {editData && <input type='hidden' name='id' value={editData.id} />}

      <FieldGroup>
        <Field data-invalid={!!state.errors?.name || undefined}>
          <FieldLabel htmlFor='name'>Nama Organisasi</FieldLabel>
          <Input
            id='name'
            name='name'
            placeholder='Contoh: Pengurus Daerah Jakarta'
            defaultValue={editData?.name}
            required
            aria-invalid={!!state.errors?.name || undefined}
          />
          <FieldError
            errors={state.errors?.name?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.code || undefined}>
          <FieldLabel htmlFor='code'>Kode Organisasi</FieldLabel>
          <Input
            id='code'
            name='code'
            placeholder='Contoh: PD-JKT'
            defaultValue={editData?.code}
            required
            aria-invalid={!!state.errors?.code || undefined}
          />
          <FieldError
            errors={state.errors?.code?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.type || undefined}>
          <FieldLabel htmlFor='type'>Tipe Organisasi</FieldLabel>
          <Select name='type' defaultValue={editData?.type}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Pilih tipe' />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            errors={state.errors?.type?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.slug || undefined}>
          <FieldLabel htmlFor='slug'>Slug</FieldLabel>
          <Input
            id='slug'
            name='slug'
            placeholder='slug-organisasi'
            defaultValue={editData?.slug}
            required
            aria-invalid={!!state.errors?.slug || undefined}
          />
          <FieldError
            errors={state.errors?.slug?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field>
          <ImageUpload
            label='Logo Wilayah'
            folder='logos'
            value={logoPath}
            onChange={(path) => setLogoPath(path)}
          />
          <input type='hidden' name='logo' value={logoPath || ''} />
        </Field>

        <div className='flex justify-end gap-3 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => orgSheetStore.set(false)}
          >
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className='animate-spin'
                data-icon='inline-start'
              />
            )}
            {isPending ? 'Menyimpan...' : 'Simpan Organisasi'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
