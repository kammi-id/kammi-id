'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Textarea } from '~/components/shadcn/ui/textarea'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription
} from '~/components/shadcn/ui/field'
import { IconPicker } from '~/components/ui/icon-picker'
import type { SettingsActionState } from '~/app/(dashboard)/dashboard/pages/home/_components/action'
import type { FooterSettings } from '~/db/query/site-settings'
import { normalizeFooter } from '~/lib/site-links'
import { saveFooterAction } from './action'
import { FooterFormSection } from './footer-form-section'
import {
  FooterLinkList,
  type SitePage,
  type SortableFooterLink
} from './footer-link-list'
import { SITE_ICONS } from '~/lib/site-icons'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: FooterSettings; pages: SitePage[] }

// Initial keys are positional, not random, so server and client render the
// same `id`/`htmlFor` and hydration matches; links added later get a UUID.
const withSortableIds = (initialData: FooterSettings) => {
  const footer = normalizeFooter(initialData)
  return {
    ...footer,
    menus: footer.menus.map((menu, menuIndex) => ({
      ...menu,
      links: menu.links.map(
        (link, index): SortableFooterLink => ({
          ...link,
          id: `${menuIndex}-${index}`
        })
      )
    }))
  }
}

export const FooterForm = ({ initialData, pages }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveFooterAction, {})
  const [footer, setFooter] = useState(() => withSortableIds(initialData))
  const [preset, setPreset] = useState('instagram')
  const { isDirty, markClean } = useUnsavedChanges(footer)
  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan footer berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
  const setMenu = (
    index: number,
    patch: Partial<(typeof footer.menus)[number]>
  ) =>
    setFooter((current) => ({
      ...current,
      menus: current.menus.map((menu, i) =>
        i === index ? { ...menu, ...patch } : menu
      )
    }))
  return (
    <form
      action={(fd) => {
        fd.set('footer', JSON.stringify(footer))
        formAction(fd)
      }}
      className='flex flex-col gap-6'
    >
      <FooterFormSection
        index='01'
        title='Kontak'
        description='Alamat publik, telepon, dan email yang tampil di footer situs.'
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='footer-address'>Alamat Publik</FieldLabel>
            <Textarea
              id='footer-address'
              value={footer.address}
              onChange={(e) =>
                setFooter({ ...footer, address: e.target.value })
              }
            />
            <FieldDescription>
              Logo mengikuti logo Struktur. Kontak ini tampil di footer situs.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='footer-phone'>Telepon</FieldLabel>
            <Input
              id='footer-phone'
              type='tel'
              value={footer.phone}
              onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
              placeholder='+62…'
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='footer-email'>Email</FieldLabel>
            <Input
              id='footer-email'
              type='email'
              value={footer.email}
              onChange={(e) => setFooter({ ...footer, email: e.target.value })}
            />
          </Field>
        </FieldGroup>
      </FooterFormSection>
      {footer.menus.map((menu, menuIndex) => (
        <FooterFormSection
          key={menuIndex}
          index={String(menuIndex + 2).padStart(2, '0')}
          title={`Menu ${menuIndex + 1}`}
          description='Kolom tautan di footer. Geser untuk mengubah urutan; menu tanpa tautan disembunyikan.'
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`footer-menu-${menuIndex}`}>
                Judul Menu
              </FieldLabel>
              <Input
                id={`footer-menu-${menuIndex}`}
                value={menu.title}
                onChange={(e) => setMenu(menuIndex, { title: e.target.value })}
              />
            </Field>
            <FooterLinkList
              menuTitle={menu.title || `Menu ${menuIndex + 1}`}
              links={menu.links}
              pages={pages}
              onChange={(links) => setMenu(menuIndex, { links })}
            />
          </FieldGroup>
        </FooterFormSection>
      ))}
      <FooterFormSection
        index='04'
        title='Media Sosial'
        description='Ikon tautan media sosial di footer situs.'
      >
        <FieldGroup>
          {footer.socials.map((link, index) => (
            <FieldGroup key={index} className='gap-3'>
              <Field>
                <FieldLabel htmlFor={`social-label-${index}`}>Judul</FieldLabel>
                <Input
                  id={`social-label-${index}`}
                  value={link.label}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      socials: footer.socials.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item
                      )
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`social-icon-${index}`}>Ikon</FieldLabel>
                <IconPicker
                  id={`social-icon-${index}`}
                  value={link.icon}
                  onChange={(icon) =>
                    setFooter({
                      ...footer,
                      socials: footer.socials.map((item, i) =>
                        i === index ? { ...item, icon } : item
                      )
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`social-url-${index}`}>URL</FieldLabel>
                <Input
                  id={`social-url-${index}`}
                  value={link.href}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      socials: footer.socials.map((item, i) =>
                        i === index ? { ...item, href: e.target.value } : item
                      )
                    })
                  }
                  placeholder='https://…'
                />
              </Field>
              <Button
                type='button'
                variant='ghost'
                className='w-fit'
                onClick={() =>
                  setFooter({
                    ...footer,
                    socials: footer.socials.filter((_, i) => i !== index)
                  })
                }
              >
                Hapus {link.label}
              </Button>
            </FieldGroup>
          ))}
          <Field>
            <FieldLabel htmlFor='social-preset'>
              Pilih Ikon / Jejaring Sosial
            </FieldLabel>
            <IconPicker
              id='social-preset'
              value={preset}
              onChange={setPreset}
            />
            <FieldDescription>
              Pilih jejaring populer atau ikon tautan untuk menambahkan URL
              kustom.
            </FieldDescription>
          </Field>
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            onClick={() =>
              setFooter({
                ...footer,
                socials: [
                  ...footer.socials,
                  {
                    label:
                      SITE_ICONS.find((icon) => icon.value === preset)?.label ??
                      'Tautan',
                    icon: preset,
                    href: ''
                  }
                ]
              })
            }
          >
            Tambah Media Sosial / Tautan
          </Button>
        </FieldGroup>
      </FooterFormSection>
      {state.error && (
        <p role='alert' className='text-destructive text-sm'>
          {state.error}
        </p>
      )}
      {/* One action saves the whole footer, so the button stays in reach of
          every section above it. */}
      <div className='bg-background/90 sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 rounded-2xl border px-4 py-3 shadow-xs backdrop-blur'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Menyimpan…' : 'Simpan Pengaturan Footer'}
        </Button>
      </div>
    </form>
  )
}
