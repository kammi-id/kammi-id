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
  const [miniStrategiTitle, setMiniStrategiTitle] = useState(
    initialData.miniStrategiTitle
  )
  const [miniStrategiDescription, setMiniStrategiDescription] = useState(
    initialData.miniStrategiDescription
  )
  const [miniStrategiLinkLabel, setMiniStrategiLinkLabel] = useState(
    initialData.miniStrategiLinkLabel
  )
  const [miniStrategiLinkHref, setMiniStrategiLinkHref] = useState(
    initialData.miniStrategiLinkHref
  )

  const { isDirty, markClean } = useUnsavedChanges({
    paragraph1,
    paragraph2,
    readMoreLabel,
    readMoreHref,
    miniStrategiTitle,
    miniStrategiDescription,
    miniStrategiLinkLabel,
    miniStrategiLinkHref
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
      if (state.values.miniStrategiTitle !== undefined)
        setMiniStrategiTitle(state.values.miniStrategiTitle)
      if (state.values.miniStrategiDescription !== undefined)
        setMiniStrategiDescription(state.values.miniStrategiDescription)
      if (state.values.miniStrategiLinkLabel !== undefined)
        setMiniStrategiLinkLabel(state.values.miniStrategiLinkLabel)
      if (state.values.miniStrategiLinkHref !== undefined)
        setMiniStrategiLinkHref(state.values.miniStrategiLinkHref)
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
            Card Mini Strategi
          </p>
          <div className='space-y-4'>
            <Field>
              <FieldLabel htmlFor='miniStrategiTitle'>Judul Card</FieldLabel>
              <FieldContent>
                <Input
                  id='miniStrategiTitle'
                  name='miniStrategiTitle'
                  value={miniStrategiTitle}
                  onChange={(e) => setMiniStrategiTitle(e.target.value)}
                  placeholder='Mini Strategi'
                />
              </FieldContent>
              <FieldError
                errors={fe.miniStrategiTitle?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='miniStrategiDescription'>
                Deskripsi Card
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id='miniStrategiDescription'
                  name='miniStrategiDescription'
                  value={miniStrategiDescription}
                  onChange={(e) => setMiniStrategiDescription(e.target.value)}
                  rows={3}
                  placeholder='Membangun kader yang memiliki...'
                />
              </FieldContent>
              <FieldError
                errors={fe.miniStrategiDescription?.map((m) => ({
                  message: m
                }))}
              />
            </Field>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='miniStrategiLinkLabel'>
                  Label Link Card
                </FieldLabel>
                <FieldContent>
                  <Input
                    id='miniStrategiLinkLabel'
                    name='miniStrategiLinkLabel'
                    value={miniStrategiLinkLabel}
                    onChange={(e) => setMiniStrategiLinkLabel(e.target.value)}
                    placeholder='Selengkapnya'
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor='miniStrategiLinkHref'>
                  Link Card
                </FieldLabel>
                <FieldContent>
                  <Input
                    id='miniStrategiLinkHref'
                    name='miniStrategiLinkHref'
                    value={miniStrategiLinkHref}
                    onChange={(e) => setMiniStrategiLinkHref(e.target.value)}
                    placeholder='#strategi'
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
