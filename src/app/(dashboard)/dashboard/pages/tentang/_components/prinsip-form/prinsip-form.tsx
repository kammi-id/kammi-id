'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangPrinsipAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

const PRINSIP_LABELS = [
  'Kemenangan Islam adalah jiwa perjuangan KAMMI',
  'Kebatilan adalah musuh abadi KAMMI',
  'Solusi Islam adalah tawaran perjuangan KAMMI',
  'Perbaikan adalah tradisi perjuangan KAMMI',
  'Kepemimpinan ummat adalah strategi perjuangan KAMMI',
  'Persaudaraan adalah watak muamalah KAMMI'
]

type Props = { initialData: { prinsipImages: readonly string[] } }

export const PrinsipForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangPrinsipAction, {})

  const [images, setImages] = useState<string[]>(
    initialData.prinsipImages.length === 6
      ? [...initialData.prinsipImages]
      : ['', '', '', '', '', '']
  )

  const updateImage = useCallback((i: number, url: string) => {
    setImages((prev) => {
      const next = [...prev]
      next[i] = url
      return next
    })
  }, [])

  const { isDirty, markClean } = useUnsavedChanges({ images })

  useEffect(() => {
    if (state.success) {
      toast.success('Gambar prinsip berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      toast.error('Data gambar tidak valid. Coba lagi.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('prinsipImages', JSON.stringify(images))
      formAction(fd)
    },
    [images, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {PRINSIP_LABELS.map((label, i) => (
          <Field key={i}>
            <FieldLabel>
              <span className='text-muted-foreground font-mono text-xs'>
                {String(i + 1).padStart(2, '0')}
              </span>{' '}
              {label}
            </FieldLabel>
            <FieldContent>
              <ImageUpload
                value={images[i] ?? ''}
                onChange={(url) => updateImage(i, url)}
                folder='site-settings/tentang/prinsip'
              />
            </FieldContent>
          </Field>
        ))}
      </div>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Gambar Prinsip'}
        </Button>
      </div>
    </form>
  )
}
