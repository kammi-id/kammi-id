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
import { saveTentangParadigmaAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

const PARADIGMA_LABELS = [
  'KAMMI adalah gerakan dakwah tauhid',
  'KAMMI adalah intelektual profetik',
  'KAMMI adalah gerakan sosial independen',
  'KAMMI adalah gerakan politik ekstraparlementer'
]

type Props = { initialData: { paradigmaImages: readonly string[] } }

export const ParadigmaForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangParadigmaAction, {})

  const [images, setImages] = useState<string[]>(
    initialData.paradigmaImages.length === 4
      ? [...initialData.paradigmaImages]
      : ['', '', '', '']
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
      toast.success('Gambar paradigma berhasil disimpan.')
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
      fd.set('paradigmaImages', JSON.stringify(images))
      formAction(fd)
    },
    [images, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        {PARADIGMA_LABELS.map((label, i) => (
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
                folder='site-settings/tentang/paradigma'
              />
            </FieldContent>
          </Field>
        ))}
      </div>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Gambar Paradigma'}
        </Button>
      </div>
    </form>
  )
}
