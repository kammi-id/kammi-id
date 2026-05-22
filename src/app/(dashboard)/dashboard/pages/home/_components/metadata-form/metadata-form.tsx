'use client'

import { useActionState, useEffect } from 'react'
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

type Props = { initialData: MetadataSettings }

export const MetadataForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    saveMetadataAction,
    {}
  )

  useEffect(() => {
    if (state.success) toast.success('Metadata halaman berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

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
              defaultValue={initialData.pageTitle}
              placeholder='KAMMI.id — Pelopor Kebaikan untuk Indonesia'
            />
          </FieldContent>
          <FieldDescription>Muncul di tab browser dan hasil pencarian Google.</FieldDescription>
          <FieldError errors={fe.pageTitle?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='metaDescription'>Deskripsi Meta</FieldLabel>
          <FieldContent>
            <Textarea
              id='metaDescription'
              name='metaDescription'
              defaultValue={initialData.metaDescription}
              rows={3}
              placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia...'
            />
          </FieldContent>
          <FieldDescription>Ideal 150-160 karakter. Ditampilkan di hasil pencarian.</FieldDescription>
          <FieldError errors={fe.metaDescription?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='ogImageUrl'>URL Gambar OG (Open Graph)</FieldLabel>
          <FieldContent>
            <Input
              id='ogImageUrl'
              name='ogImageUrl'
              defaultValue={initialData.ogImageUrl}
              placeholder='/assets/logo.png atau https://...'
            />
          </FieldContent>
          <FieldDescription>
            Gambar yang muncul saat halaman dibagikan di WhatsApp, Twitter, dll. Ukuran ideal 1200x630px.
          </FieldDescription>
          <FieldError errors={fe.ogImageUrl?.map((m) => ({ message: m }))} />
        </Field>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button type='submit' className='rounded-full px-8' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Metadata'}
        </Button>
      </div>
    </form>
  )
}
