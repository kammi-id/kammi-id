'use client'

import { useActionState, useEffect, useState } from 'react'
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
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

type FooterLink = { label: string; href: string }
type Props = { initialData: FooterSettings }

const LinkListEditor = ({
  links,
  onChange,
  label
}: {
  links: FooterLink[]
  onChange: (next: FooterLink[]) => void
  label: string
}) => {
  const update = (i: number, field: keyof FooterLink, value: string) => {
    onChange(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }
  const add = () => onChange([...links, { label: '', href: '' }])
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i))

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium text-foreground'>{label}</p>
      {links.map((link, i) => (
        <div key={i} className='flex items-end gap-2'>
          <Field className='flex-1'>
            <FieldLabel htmlFor={`${label}-label-${i}`} className='sr-only'>Label</FieldLabel>
            <FieldContent>
              <Input
                id={`${label}-label-${i}`}
                value={link.label}
                onChange={(e) => update(i, 'label', e.target.value)}
                placeholder='Label'
              />
            </FieldContent>
          </Field>
          <Field className='flex-1'>
            <FieldLabel htmlFor={`${label}-href-${i}`} className='sr-only'>Link</FieldLabel>
            <FieldContent>
              <Input
                id={`${label}-href-${i}`}
                value={link.href}
                onChange={(e) => update(i, 'href', e.target.value)}
                placeholder='#atau/path'
              />
            </FieldContent>
          </Field>
          <button
            type='button'
            onClick={() => remove(i)}
            disabled={links.length <= 1}
            className='mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30'
            aria-label='Hapus link'
          >
            <HugeiconsIcon icon={Delete02Icon} className='size-4' strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type='button'
        onClick={add}
        className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary'
      >
        <HugeiconsIcon icon={Add01Icon} className='size-4' strokeWidth={2} />
        Tambah Link
      </button>
    </div>
  )
}

export const FooterForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    saveFooterAction,
    {}
  )
  const [footerKAMMI, setFooterKAMMI] = useState(initialData.footerKAMMI)
  const [footerBeritaData, setFooterBeritaData] = useState(initialData.footerBeritaData)
  const [footerIkutiKami, setFooterIkutiKami] = useState(initialData.footerIkutiKami)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan footer berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form
      action={(fd) => {
        fd.set('footerKAMMI', JSON.stringify(footerKAMMI))
        fd.set('footerBeritaData', JSON.stringify(footerBeritaData))
        fd.set('footerIkutiKami', JSON.stringify(footerIkutiKami))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='rounded-2xl border border-border bg-muted/40 p-5'>
          <p className='mb-4 text-sm font-medium text-foreground'>Tautan Media Sosial</p>
          <FieldDescription className='mb-4'>
            Isi URL lengkap atau biarkan kosong untuk menyembunyikan ikon.
          </FieldDescription>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[
              { name: 'socialIG', label: 'Instagram', defaultValue: initialData.socialIG },
              { name: 'socialTwitter', label: 'Twitter / X', defaultValue: initialData.socialTwitter },
              { name: 'socialYoutube', label: 'YouTube', defaultValue: initialData.socialYoutube },
              { name: 'socialTelegram', label: 'Telegram', defaultValue: initialData.socialTelegram }
            ].map(({ name, label, defaultValue }) => (
              <Field key={name}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <FieldContent>
                  <Input
                    id={name}
                    name={name}
                    defaultValue={defaultValue}
                    placeholder='https://...'
                  />
                </FieldContent>
              </Field>
            ))}
          </div>
        </div>

        <LinkListEditor links={footerKAMMI} onChange={setFooterKAMMI} label='Kolom Footer: KAMMI' />
        <LinkListEditor links={footerBeritaData} onChange={setFooterBeritaData} label='Kolom Footer: Berita & Data' />
        <LinkListEditor links={footerIkutiKami} onChange={setFooterIkutiKami} label='Kolom Footer: Ikuti Kami' />
      </FieldGroup>

      <div className='flex justify-end'>
        <Button type='submit' className='rounded-full px-8' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Footer'}
        </Button>
      </div>
    </form>
  )
}
