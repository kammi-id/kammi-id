'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Textarea } from '~/components/shadcn/ui/textarea'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { saveMetadataAction, type SettingsActionState } from '../action'
import type { MetadataSettings } from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: MetadataSettings }

export const MetadataForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveMetadataAction, {})
  const [pageTitle, setPageTitle] = useState(initialData.pageTitle)
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription
  )
  const [ogImageUrl, setOgImageUrl] = useState(initialData.ogImageUrl)

  const { isDirty, markClean } = useUnsavedChanges({ pageTitle, metaDescription, ogImageUrl })

  useEffect(() => {
    if (state.success) {
      toast.success('Metadata halaman berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.pageTitle !== undefined) setPageTitle(state.values.pageTitle)
      if (state.values.metaDescription !== undefined)
        setMetaDescription(state.values.metaDescription)
      if (state.values.ogImageUrl !== undefined)
        setOgImageUrl(state.values.ogImageUrl)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className='space-y-8'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='pageTitle'>Judul Halaman (Title Tag)</FieldLabel>
          <FieldContent>
            <Input
              id='pageTitle'
              name='pageTitle'
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder='KAMMI.id — Pelopor Kebaikan untuk Indonesia'
            />
          </FieldContent>
          <FieldDescription>
            Muncul di tab browser dan hasil pencarian Google.
          </FieldDescription>
          <FieldError errors={fe.pageTitle?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='metaDescription'>Deskripsi Meta</FieldLabel>
          <FieldContent>
            <Textarea
              id='metaDescription'
              name='metaDescription'
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia...'
            />
          </FieldContent>
          <FieldDescription>
            Ideal 150-160 karakter. Ditampilkan di hasil pencarian.
          </FieldDescription>
          <FieldError
            errors={fe.metaDescription?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='ogImageUrl'>
            URL Gambar OG (Open Graph)
          </FieldLabel>
          <FieldContent>
            <Input
              id='ogImageUrl'
              name='ogImageUrl'
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder='/assets/logo.png atau https://...'
            />
          </FieldContent>
          <FieldDescription>
            Gambar yang muncul saat halaman dibagikan di WhatsApp, Twitter, dll.
            Ukuran ideal 1200x630px.
          </FieldDescription>
          <FieldError errors={fe.ogImageUrl?.map((m) => ({ message: m }))} />
        </Field>
      </FieldGroup>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button
          type='submit'
          className='px-6'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Metadata'}
        </Button>
      </div>
    </form>
  )
}
