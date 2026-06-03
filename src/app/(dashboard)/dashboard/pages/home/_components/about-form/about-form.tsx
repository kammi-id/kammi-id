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
import { saveAboutAction, type SettingsActionState } from '../action'
import type { AboutSettings } from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: AboutSettings }

export const AboutForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveAboutAction, {})

  const [paragraph1, setParagraph1] = useState(initialData.paragraph1)
  const [paragraph2, setParagraph2] = useState(initialData.paragraph2)
  const [readMoreLabel, setReadMoreLabel] = useState(initialData.readMoreLabel)
  const [readMoreHref, setReadMoreHref] = useState(initialData.readMoreHref)
  const [sejarahCardTitle, setSejarahCardTitle] = useState(initialData.sejarahCardTitle)
  const [sejarahCardDescription, setSejarahCardDescription] = useState(initialData.sejarahCardDescription)
  const [sejarahCardLinkLabel, setSejarahCardLinkLabel] = useState(initialData.sejarahCardLinkLabel)
  const [sejarahCardLinkHref, setSejarahCardLinkHref] = useState(initialData.sejarahCardLinkHref)

  const { isDirty, markClean } = useUnsavedChanges({
    paragraph1,
    paragraph2,
    readMoreLabel,
    readMoreHref,
    sejarahCardTitle,
    sejarahCardDescription,
    sejarahCardLinkLabel,
    sejarahCardLinkHref
  })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan tentang berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.paragraph1 !== undefined)
        setParagraph1(state.values.paragraph1)
      if (state.values.paragraph2 !== undefined)
        setParagraph2(state.values.paragraph2)
      if (state.values.readMoreLabel !== undefined)
        setReadMoreLabel(state.values.readMoreLabel)
      if (state.values.readMoreHref !== undefined)
        setReadMoreHref(state.values.readMoreHref)
      if (state.values.sejarahCardTitle !== undefined)
        setSejarahCardTitle(state.values.sejarahCardTitle)
      if (state.values.sejarahCardDescription !== undefined)
        setSejarahCardDescription(state.values.sejarahCardDescription)
      if (state.values.sejarahCardLinkLabel !== undefined)
        setSejarahCardLinkLabel(state.values.sejarahCardLinkLabel)
      if (state.values.sejarahCardLinkHref !== undefined)
        setSejarahCardLinkHref(state.values.sejarahCardLinkHref)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className='space-y-8'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='paragraph1'>Paragraf 1</FieldLabel>
          <FieldContent>
            <Textarea
              id='paragraph1'
              name='paragraph1'
              value={paragraph1}
              onChange={(e) => setParagraph1(e.target.value)}
              rows={4}
              placeholder='KAMMI adalah wadah perjuangan...'
            />
          </FieldContent>
          <FieldError errors={fe.paragraph1?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='paragraph2'>Paragraf 2</FieldLabel>
          <FieldContent>
            <Textarea
              id='paragraph2'
              name='paragraph2'
              value={paragraph2}
              onChange={(e) => setParagraph2(e.target.value)}
              rows={3}
              placeholder='Didirikan pada 1998...'
            />
          </FieldContent>
          <FieldError errors={fe.paragraph2?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='readMoreLabel'>
              Label Tautan &quot;Lebih Jauh&quot;
            </FieldLabel>
            <FieldContent>
              <Input
                id='readMoreLabel'
                name='readMoreLabel'
                value={readMoreLabel}
                onChange={(e) => setReadMoreLabel(e.target.value)}
                placeholder='Lebih jauh tentang kami'
              />
            </FieldContent>
            <FieldError
              errors={fe.readMoreLabel?.map((m) => ({ message: m }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='readMoreHref'>Link Tautan</FieldLabel>
            <FieldContent>
              <Input
                id='readMoreHref'
                name='readMoreHref'
                value={readMoreHref}
                onChange={(e) => setReadMoreHref(e.target.value)}
                placeholder='#organisasi'
              />
            </FieldContent>
            <FieldError
              errors={fe.readMoreHref?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Card Sejarah Singkat
          </p>
          <div className='space-y-4'>
            <Field>
              <FieldLabel htmlFor='sejarahCardTitle'>Judul Card</FieldLabel>
              <FieldContent>
                <Input
                  id='sejarahCardTitle'
                  name='sejarahCardTitle'
                  value={sejarahCardTitle}
                  onChange={(e) => setSejarahCardTitle(e.target.value)}
                  placeholder='Lahir dari Rahim Reformasi'
                />
              </FieldContent>
              <FieldError errors={fe.sejarahCardTitle?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='sejarahCardDescription'>Deskripsi Card</FieldLabel>
              <FieldContent>
                <Textarea
                  id='sejarahCardDescription'
                  name='sejarahCardDescription'
                  value={sejarahCardDescription}
                  onChange={(e) => setSejarahCardDescription(e.target.value)}
                  rows={3}
                  placeholder='Dari kampus ke kampus, KAMMI tumbuh...'
                />
              </FieldContent>
              <FieldError
                errors={fe.sejarahCardDescription?.map((m) => ({ message: m }))}
              />
            </Field>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='sejarahCardLinkLabel'>Label Link Card</FieldLabel>
                <FieldContent>
                  <Input
                    id='sejarahCardLinkLabel'
                    name='sejarahCardLinkLabel'
                    value={sejarahCardLinkLabel}
                    onChange={(e) => setSejarahCardLinkLabel(e.target.value)}
                    placeholder='Baca sejarah lengkap'
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor='sejarahCardLinkHref'>Link Card</FieldLabel>
                <FieldContent>
                  <Input
                    id='sejarahCardLinkHref'
                    name='sejarahCardLinkHref'
                    value={sejarahCardLinkHref}
                    onChange={(e) => setSejarahCardLinkHref(e.target.value)}
                    placeholder='/tentang#sejarah'
                  />
                </FieldContent>
              </Field>
            </div>
          </div>
        </div>
      </FieldGroup>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Tentang'}
        </Button>
      </div>
    </form>
  )
}
