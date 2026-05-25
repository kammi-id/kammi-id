'use client'

import { useActionState, useEffect } from 'react'
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

type Props = { initialData: AboutSettings }

export const AboutForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveAboutAction, {})

  useEffect(() => {
    if (state.success) toast.success('Pengaturan tentang berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

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
              defaultValue={initialData.paragraph1}
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
              defaultValue={initialData.paragraph2}
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
                defaultValue={initialData.readMoreLabel}
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
                defaultValue={initialData.readMoreHref}
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
                  defaultValue={initialData.miniStrategiTitle}
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
                  defaultValue={initialData.miniStrategiDescription}
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
                    defaultValue={initialData.miniStrategiLinkLabel}
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
                    defaultValue={initialData.miniStrategiLinkHref}
                    placeholder='#strategi'
                  />
                </FieldContent>
              </Field>
            </div>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Tentang'}
        </Button>
      </div>
    </form>
  )
}
