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
    editData?.logo ?? undefined
  )
  const [name, setName] = React.useState(editData?.name ?? '')
  const [code, setCode] = React.useState(editData?.code ?? '')
  const [slug, setSlug] = React.useState(editData?.slug ?? '')
  const [type, setType] = React.useState(editData?.type ?? '')
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
    if (state.values && !state.success) {
      if (state.values.name) setName(state.values.name)
      if (state.values.code) setCode(state.values.code)
      if (state.values.slug) setSlug(state.values.slug)
      if (state.values.type) setType(state.values.type)
    }
  }, [state.values, state.success])

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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            aria-invalid={!!state.errors?.code || undefined}
          />
          <FieldDescription>
            Singkatan unik organisasi, contoh: PD-JKT, PK-UNY.
          </FieldDescription>
          <FieldError
            errors={state.errors?.code?.map((m) => ({ message: m }))}
          />
        </Field>

        {/* Tipe ditetapkan sekali saat pembuatan dan tidak pernah berubah
            sesudahnya — memindahkan sebuah Struktur ke Jenjang lain bukan
            penyuntingan, dan server mengabaikan `type` yang dikirim saat
            memperbarui. Jadi saat mengedit ia ditampilkan sebagai keterangan,
            bukan sebagai kontrol yang tampak bisa dipakai. */}
        {editData ? (
          <Field>
            <FieldLabel>Tipe Organisasi</FieldLabel>
            <p className='text-foreground text-sm font-medium'>
              {availableTypes.find((t) => t.value === editData.type)?.label ??
                editData.type.toUpperCase()}
            </p>
            <FieldDescription>
              Tipe tidak dapat diubah setelah organisasi dibuat.
            </FieldDescription>
          </Field>
        ) : (
          <Field data-invalid={!!state.errors?.type || undefined}>
            <FieldLabel htmlFor='type'>Tipe Organisasi</FieldLabel>
            <Select
              name='type'
              value={type}
              onValueChange={(val) => {
                if (val) setType(val)
              }}
            >
              <SelectTrigger id='type' className='w-full'>
                <SelectValue placeholder='Pilih tipe' />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((typeOption) => (
                  <SelectItem key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={state.errors?.type?.map((m) => ({ message: m }))}
            />
          </Field>
        )}

        <Field data-invalid={!!state.errors?.slug || undefined}>
          <FieldLabel htmlFor='slug'>Slug</FieldLabel>
          <Input
            id='slug'
            name='slug'
            placeholder='slug-organisasi'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            aria-invalid={!!state.errors?.slug || undefined}
          />
          <FieldDescription>
            Huruf kecil dan tanda-hubung saja, contoh: pengurus-daerah-jakarta.
          </FieldDescription>
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
