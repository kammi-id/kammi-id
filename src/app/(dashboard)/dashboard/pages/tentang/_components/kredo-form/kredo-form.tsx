'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangKredoAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: { kredoImageUrl: string } }

export const KredoForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangKredoAction, {})

  const [kredoImageUrl, setKredoImageUrl] = useState(initialData.kredoImageUrl)

  const { isDirty, markClean } = useUnsavedChanges({ kredoImageUrl })

  useEffect(() => {
    if (state.success) {
      toast.success('Latar kredo berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('kredoImageUrl', kredoImageUrl)
      formAction(fd)
    },
    [kredoImageUrl, formAction]
  )

  const fe = state.fieldErrors ?? {}

  return (
    <form action={handleAction} className='space-y-8'>
      <Field>
        <FieldContent>
          <ImageUpload
            value={kredoImageUrl}
            onChange={setKredoImageUrl}
            folder='site-settings/tentang/kredo'
          />
        </FieldContent>
        <FieldDescription>
          Gambar latar di belakang teks Kredo KAMMI. Biarkan kosong untuk
          menggunakan warna perkamen default.
        </FieldDescription>
        <FieldError errors={fe.kredoImageUrl?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
