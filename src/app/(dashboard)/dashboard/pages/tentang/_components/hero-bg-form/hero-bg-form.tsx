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
import { saveTentangHeroAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: { heroImageUrl: string } }

export const HeroBgForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangHeroAction, {})

  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl)

  const { isDirty, markClean } = useUnsavedChanges({ heroImageUrl })

  useEffect(() => {
    if (state.success) {
      toast.success('Latar hero berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('heroImageUrl', heroImageUrl)
      formAction(fd)
    },
    [heroImageUrl, formAction]
  )

  const fe = state.fieldErrors ?? {}

  return (
    <form action={handleAction} className='space-y-8'>
      <Field>
        <FieldContent>
          <ImageUpload
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            folder='site-settings/tentang/hero'
          />
        </FieldContent>
        <FieldDescription>
          Gambar latar belakang untuk seksi hero halaman Tentang. Biarkan kosong
          untuk menggunakan desain default.
        </FieldDescription>
        <FieldError errors={fe.heroImageUrl?.map((m) => ({ message: m }))} />
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
