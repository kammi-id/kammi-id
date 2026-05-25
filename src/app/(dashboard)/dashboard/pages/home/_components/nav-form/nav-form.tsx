'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
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
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'
import { LinkListEditor, type LinkItem } from '~/components/ui/link-list-editor'

type Props = { initialData: NavSettings }

const toLinksWithId = (links: { label: string; href: string }[]): LinkItem[] =>
  links.map((l, i) => ({ ...l, id: `link-${i}-${Date.now()}` }))

export const NavForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveNavAction, {})
  const [navLinks, setNavLinks] = useState<LinkItem[]>(() =>
    toLinksWithId(initialData.navLinks)
  )
  const [ctaBergabungLabel, setCtaBergabungLabel] = useState(
    initialData.ctaBergabungLabel
  )
  const [ctaBergabungHref, setCtaBergabungHref] = useState(
    initialData.ctaBergabungHref
  )

  const { isDirty, markClean } = useUnsavedChanges({ navLinks, ctaBergabungLabel, ctaBergabungHref })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan navigasi berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.ctaBergabungLabel !== undefined)
        setCtaBergabungLabel(state.values.ctaBergabungLabel)
      if (state.values.ctaBergabungHref !== undefined)
        setCtaBergabungHref(state.values.ctaBergabungHref)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('navLinks', JSON.stringify(navLinks.map(({ label, href }) => ({ label, href }))))
      formAction(fd)
    },
    [navLinks, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <FieldGroup>
        <LinkListEditor
          links={navLinks}
          onChange={setNavLinks}
          sectionLabel='Menu Navigasi Utama'
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
                  value={ctaBergabungLabel}
                  onChange={(e) => setCtaBergabungLabel(e.target.value)}
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
                  value={ctaBergabungHref}
                  onChange={(e) => setCtaBergabungHref(e.target.value)}
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

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Navigasi'}
        </Button>
      </div>
    </form>
  )
}
