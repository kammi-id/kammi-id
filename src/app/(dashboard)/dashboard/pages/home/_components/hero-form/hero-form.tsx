'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
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
import { ImageUpload } from '~/components/image-upload'
import { saveHeroAction, type SettingsActionState } from '../action'
import type { HeroSettings } from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: HeroSettings }

export const HeroForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveHeroAction, {})
  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl)
  const [badgeText, setBadgeText] = useState(initialData.badgeText)
  const [title, setTitle] = useState(initialData.title)
  const [titleAccent, setTitleAccent] = useState(initialData.titleAccent)
  const [subtitle, setSubtitle] = useState(initialData.subtitle)
  const [heroImageAlt, setHeroImageAlt] = useState(initialData.heroImageAlt)
  const [quoteText, setQuoteText] = useState(initialData.quoteText)
  const [quoteAttribution, setQuoteAttribution] = useState(
    initialData.quoteAttribution
  )
  const [cta1Label, setCta1Label] = useState(initialData.cta1Label)
  const [cta1Href, setCta1Href] = useState(initialData.cta1Href)
  const [cta2Label, setCta2Label] = useState(initialData.cta2Label)
  const [cta2Href, setCta2Href] = useState(initialData.cta2Href)

  const { isDirty, markClean } = useUnsavedChanges({
    badgeText, title, titleAccent, subtitle, heroImageUrl, heroImageAlt,
    quoteText, quoteAttribution, cta1Label, cta1Href, cta2Label, cta2Href
  })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan hero berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      const v = state.values
      if (v.badgeText !== undefined) setBadgeText(v.badgeText)
      if (v.title !== undefined) setTitle(v.title)
      if (v.titleAccent !== undefined) setTitleAccent(v.titleAccent)
      if (v.subtitle !== undefined) setSubtitle(v.subtitle)
      if (v.heroImageUrl !== undefined) setHeroImageUrl(v.heroImageUrl)
      if (v.heroImageAlt !== undefined) setHeroImageAlt(v.heroImageAlt)
      if (v.quoteText !== undefined) setQuoteText(v.quoteText)
      if (v.quoteAttribution !== undefined)
        setQuoteAttribution(v.quoteAttribution)
      if (v.cta1Label !== undefined) setCta1Label(v.cta1Label)
      if (v.cta1Href !== undefined) setCta1Href(v.cta1Href)
      if (v.cta2Label !== undefined) setCta2Label(v.cta2Label)
      if (v.cta2Href !== undefined) setCta2Href(v.cta2Href)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('heroImageUrl', heroImageUrl)
      formAction(fd)
    },
    [heroImageUrl, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='badgeText'>Teks Badge</FieldLabel>
          <FieldContent>
            <Input
              id='badgeText'
              name='badgeText'
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={titleAccent}
                onChange={(e) => setTitleAccent(e.target.value)}
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
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
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
            <FieldError
              errors={fe.heroImageUrl?.map((m) => ({ message: m }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='heroImageAlt'>Alt Text Foto</FieldLabel>
            <FieldContent>
              <Input
                id='heroImageAlt'
                name='heroImageAlt'
                value={heroImageAlt}
                onChange={(e) => setHeroImageAlt(e.target.value)}
                placeholder='Deskripsi foto untuk aksesibilitas'
              />
            </FieldContent>
            <FieldDescription>
              Deskripsi foto untuk pembaca layar dan Google. Contoh: Kader KAMMI berdiskusi.
            </FieldDescription>
            <FieldError
              errors={fe.heroImageAlt?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='quoteText'>Teks Kutipan Mengambang</FieldLabel>
            <FieldContent>
              <Textarea
                id='quoteText'
                name='quoteText'
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
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
                value={quoteAttribution}
                onChange={(e) => setQuoteAttribution(e.target.value)}
                placeholder='Semangat KAMMI'
              />
            </FieldContent>
            <FieldError
              errors={fe.quoteAttribution?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>Tombol CTA</p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='cta1Label'>
                Label Tombol 1 (Utama)
              </FieldLabel>
              <FieldContent>
                <Input
                  id='cta1Label'
                  name='cta1Label'
                  value={cta1Label}
                  onChange={(e) => setCta1Label(e.target.value)}
                  placeholder='Mulai Bergabung'
                />
              </FieldContent>
              <FieldError errors={fe.cta1Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta1Href'>Link Tombol 1</FieldLabel>
              <FieldContent>
                <Input
                  id='cta1Href'
                  name='cta1Href'
                  value={cta1Href}
                  onChange={(e) => setCta1Href(e.target.value)}
                  placeholder='#bergabung'
                />
              </FieldContent>
              <FieldError errors={fe.cta1Href?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Label'>
                Label Tombol 2 (Outline)
              </FieldLabel>
              <FieldContent>
                <Input
                  id='cta2Label'
                  name='cta2Label'
                  value={cta2Label}
                  onChange={(e) => setCta2Label(e.target.value)}
                  placeholder='Pelajari Visi'
                />
              </FieldContent>
              <FieldError errors={fe.cta2Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Href'>Link Tombol 2</FieldLabel>
              <FieldContent>
                <Input
                  id='cta2Href'
                  name='cta2Href'
                  value={cta2Href}
                  onChange={(e) => setCta2Href(e.target.value)}
                  placeholder='#tentang'
                />
              </FieldContent>
              <FieldError errors={fe.cta2Href?.map((m) => ({ message: m }))} />
            </Field>
          </div>
        </div>
      </FieldGroup>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button
          type='submit'
          className='px-6'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Hero'}
        </Button>
      </div>
    </form>
  )
}
