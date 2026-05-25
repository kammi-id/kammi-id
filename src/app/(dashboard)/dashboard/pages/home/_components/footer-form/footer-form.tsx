'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { saveFooterAction, type SettingsActionState } from '../action'
import type { FooterSettings } from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'
import { LinkListEditor, type LinkItem } from '~/components/ui/link-list-editor'

type Props = { initialData: FooterSettings }

const toLinksWithId = (links: { label: string; href: string }[], prefix: string): LinkItem[] =>
  links.map((l, i) => ({ ...l, id: `${prefix}-${i}-${Date.now()}` }))

export const FooterForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveFooterAction, {})
  const [footerKAMMI, setFooterKAMMI] = useState<LinkItem[]>(() =>
    toLinksWithId(initialData.footerKAMMI, 'kammi')
  )
  const [footerBeritaData, setFooterBeritaData] = useState<LinkItem[]>(() =>
    toLinksWithId(initialData.footerBeritaData, 'berita')
  )
  const [footerIkutiKami, setFooterIkutiKami] = useState<LinkItem[]>(() =>
    toLinksWithId(initialData.footerIkutiKami, 'ikuti')
  )
  const [socialIG, setSocialIG] = useState(initialData.socialIG)
  const [socialTwitter, setSocialTwitter] = useState(initialData.socialTwitter)
  const [socialYoutube, setSocialYoutube] = useState(initialData.socialYoutube)
  const [socialTelegram, setSocialTelegram] = useState(initialData.socialTelegram)

  const { isDirty, markClean } = useUnsavedChanges({
    footerKAMMI, footerBeritaData, footerIkutiKami,
    socialIG, socialTwitter, socialYoutube, socialTelegram
  })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan footer berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.socialIG !== undefined) setSocialIG(state.values.socialIG)
      if (state.values.socialTwitter !== undefined)
        setSocialTwitter(state.values.socialTwitter)
      if (state.values.socialYoutube !== undefined)
        setSocialYoutube(state.values.socialYoutube)
      if (state.values.socialTelegram !== undefined)
        setSocialTelegram(state.values.socialTelegram)
    }
  }, [state.values, state.success])

  const stripId = useCallback(
    (links: LinkItem[]) => links.map(({ label, href }) => ({ label, href })),
    []
  )

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('footerKAMMI', JSON.stringify(stripId(footerKAMMI)))
      fd.set('footerBeritaData', JSON.stringify(stripId(footerBeritaData)))
      fd.set('footerIkutiKami', JSON.stringify(stripId(footerIkutiKami)))
      formAction(fd)
    },
    [footerKAMMI, footerBeritaData, footerIkutiKami, stripId, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <FieldGroup>
        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Tautan Media Sosial
          </p>
          <FieldDescription className='mb-4'>
            Isi URL lengkap atau biarkan kosong untuk menyembunyikan ikon.
          </FieldDescription>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[
              {
                name: 'socialIG',
                label: 'Instagram',
                value: socialIG,
                onChange: setSocialIG
              },
              {
                name: 'socialTwitter',
                label: 'Twitter / X',
                value: socialTwitter,
                onChange: setSocialTwitter
              },
              {
                name: 'socialYoutube',
                label: 'YouTube',
                value: socialYoutube,
                onChange: setSocialYoutube
              },
              {
                name: 'socialTelegram',
                label: 'Telegram',
                value: socialTelegram,
                onChange: setSocialTelegram
              }
            ].map(({ name, label, value, onChange }) => (
              <Field key={name}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <FieldContent>
                  <Input
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder='https://...'
                  />
                </FieldContent>
              </Field>
            ))}
          </div>
        </div>

        <LinkListEditor
          links={footerKAMMI}
          onChange={setFooterKAMMI}
          sectionLabel='Kolom Footer: KAMMI'
        />
        <LinkListEditor
          links={footerBeritaData}
          onChange={setFooterBeritaData}
          sectionLabel='Kolom Footer: Berita & Data'
        />
        <LinkListEditor
          links={footerIkutiKami}
          onChange={setFooterIkutiKami}
          sectionLabel='Kolom Footer: Ikuti Kami'
        />
      </FieldGroup>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Footer'}
        </Button>
      </div>
    </form>
  )
}
