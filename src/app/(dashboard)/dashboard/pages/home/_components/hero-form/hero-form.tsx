'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Textarea } from '~/components/shadcn/ui/textarea'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveHeroAction, type SettingsActionState } from '../action'
import type { HeroSettings } from '~/db/query/site-settings'

type Props = { initialData: HeroSettings }

export const HeroForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    saveHeroAction,
    {}
  )
  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan hero berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  const fe = state.fieldErrors ?? {}

  return (
    <form
      action={(fd) => {
        fd.set('heroImageUrl', heroImageUrl)
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='badgeText'>Teks Badge</FieldLabel>
          <FieldContent>
            <Input
              id='badgeText'
              name='badgeText'
              defaultValue={initialData.badgeText}
              placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia'
            />
          </FieldContent>
          <FieldError errors={fe.badgeText?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='title'>Judul Utama</FieldLabel>
            <FieldContent>
              <Input
                id='title'
                name='title'
                defaultValue={initialData.title}
                placeholder='Pelopor Kebaikan'
              />
            </FieldContent>
            <FieldError errors={fe.title?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='titleAccent'>Kata Aksen (merah)</FieldLabel>
            <FieldContent>
              <Input
                id='titleAccent'
                name='titleAccent'
                defaultValue={initialData.titleAccent}
                placeholder='untuk'
              />
            </FieldContent>
            <FieldError errors={fe.titleAccent?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor='subtitle'>Subjudul / Paragraf Hero</FieldLabel>
          <FieldContent>
            <Textarea
              id='subtitle'
              name='subtitle'
              defaultValue={initialData.subtitle}
              rows={3}
              placeholder='Membangun peradaban dengan...'
            />
          </FieldContent>
          <FieldError errors={fe.subtitle?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel>Foto Hero</FieldLabel>
            <FieldContent>
              <ImageUpload
                value={heroImageUrl}
                onChange={setHeroImageUrl}
                folder='site-settings/hero'
              />
            </FieldContent>
            <FieldError errors={fe.heroImageUrl?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='heroImageAlt'>Alt Text Foto</FieldLabel>
            <FieldContent>
              <Input
                id='heroImageAlt'
                name='heroImageAlt'
                defaultValue={initialData.heroImageAlt}
                placeholder='Deskripsi foto untuk aksesibilitas'
              />
            </FieldContent>
            <FieldError errors={fe.heroImageAlt?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='quoteText'>Teks Kutipan Mengambang</FieldLabel>
            <FieldContent>
              <Textarea
                id='quoteText'
                name='quoteText'
                defaultValue={initialData.quoteText}
                rows={2}
                placeholder='Seperti akar yang menancap dalam...'
              />
            </FieldContent>
            <FieldError errors={fe.quoteText?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='quoteAttribution'>Atribusi Kutipan</FieldLabel>
            <FieldContent>
              <Input
                id='quoteAttribution'
                name='quoteAttribution'
                defaultValue={initialData.quoteAttribution}
                placeholder='Semangat KAMMI'
              />
            </FieldContent>
            <FieldError errors={fe.quoteAttribution?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <div className='rounded-2xl border border-border bg-muted/40 p-5'>
          <p className='mb-4 text-sm font-medium text-foreground'>Tombol CTA</p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='cta1Label'>Label Tombol 1 (Utama)</FieldLabel>
              <FieldContent>
                <Input id='cta1Label' name='cta1Label' defaultValue={initialData.cta1Label} placeholder='Mulai Bergabung' />
              </FieldContent>
              <FieldError errors={fe.cta1Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta1Href'>Link Tombol 1</FieldLabel>
              <FieldContent>
                <Input id='cta1Href' name='cta1Href' defaultValue={initialData.cta1Href} placeholder='#bergabung' />
              </FieldContent>
              <FieldError errors={fe.cta1Href?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Label'>Label Tombol 2 (Outline)</FieldLabel>
              <FieldContent>
                <Input id='cta2Label' name='cta2Label' defaultValue={initialData.cta2Label} placeholder='Pelajari Visi' />
              </FieldContent>
              <FieldError errors={fe.cta2Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Href'>Link Tombol 2</FieldLabel>
              <FieldContent>
                <Input id='cta2Href' name='cta2Href' defaultValue={initialData.cta2Href} placeholder='#tentang' />
              </FieldContent>
              <FieldError errors={fe.cta2Href?.map((m) => ({ message: m }))} />
            </Field>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button type='submit' className='rounded-full px-8' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Hero'}
        </Button>
      </div>
    </form>
  )
}
