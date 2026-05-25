'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { saveNavAction, type SettingsActionState } from '../action'
import type { NavSettings } from '~/db/query/site-settings'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

type NavLink = NavSettings['navLinks'][number]
type Props = { initialData: NavSettings }

const LinkListEditor = ({
  links,
  onChange,
  label
}: {
  links: NavLink[]
  onChange: (next: NavLink[]) => void
  label: string
}) => {
  const update = (i: number, field: keyof NavLink, value: string) => {
    onChange(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }
  const add = () => onChange([...links, { label: '', href: '' }])
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i))

  return (
    <div className='space-y-2'>
      <p className='text-foreground text-sm font-medium'>{label}</p>
      {links.map((link, i) => (
        <div key={i} className='flex items-end gap-2'>
          <Field className='flex-1'>
            <FieldLabel htmlFor={`${label}-label-${i}`} className='sr-only'>
              Label {i + 1}
            </FieldLabel>
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
            <FieldLabel htmlFor={`${label}-href-${i}`} className='sr-only'>
              Link {i + 1}
            </FieldLabel>
            <FieldContent>
              <Input
                id={`${label}-href-${i}`}
                value={link.href}
                onChange={(e) => update(i, 'href', e.target.value)}
                placeholder='/halaman atau #seksi'
              />
            </FieldContent>
          </Field>
          <button
            type='button'
            onClick={() => remove(i)}
            disabled={links.length <= 1}
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-30'
            aria-label={`Hapus link ${i + 1}`}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              className='size-4'
              strokeWidth={2}
            />
          </button>
        </div>
      ))}
      <button
        type='button'
        onClick={add}
        className='border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm transition-colors'
      >
        <HugeiconsIcon icon={Add01Icon} className='size-4' strokeWidth={2} />
        Tambah Link
      </button>
    </div>
  )
}

export const NavForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveNavAction, {})
  const [navLinks, setNavLinks] = useState<NavLink[]>(initialData.navLinks)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan navigasi berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  const fe = state.fieldErrors ?? {}

  return (
    <form
      action={(fd) => {
        fd.set('navLinks', JSON.stringify(navLinks))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <LinkListEditor
          links={navLinks}
          onChange={setNavLinks}
          label='Menu Navigasi Utama'
        />

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Tombol CTA Navbar
          </p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='ctaBergabungLabel'>Label Tombol</FieldLabel>
              <FieldContent>
                <Input
                  id='ctaBergabungLabel'
                  name='ctaBergabungLabel'
                  defaultValue={initialData.ctaBergabungLabel}
                  placeholder='Bergabung di KAMMI'
                />
              </FieldContent>
              <FieldError
                errors={fe.ctaBergabungLabel?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='ctaBergabungHref'>Link Tombol</FieldLabel>
              <FieldContent>
                <Input
                  id='ctaBergabungHref'
                  name='ctaBergabungHref'
                  defaultValue={initialData.ctaBergabungHref}
                  placeholder='#bergabung'
                />
              </FieldContent>
              <FieldError
                errors={fe.ctaBergabungHref?.map((m) => ({ message: m }))}
              />
            </Field>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Navigasi'}
        </Button>
      </div>
    </form>
  )
}
