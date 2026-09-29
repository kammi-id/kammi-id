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
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { IconPicker } from '~/components/ui/icon-picker'
import { saveFooterAction, type SettingsActionState } from '../action'
import type { FooterSettings } from '~/db/query/site-settings'
import { normalizeFooter, type FooterLink } from '~/lib/site-links'
import { SITE_ICONS } from '~/lib/site-icons'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type SitePage = { id: string; title: string; slug: string }
type Props = { initialData: FooterSettings; pages: SitePage[] }

export const FooterForm = ({ initialData, pages }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveFooterAction, {})
  const [footer, setFooter] = useState(() => normalizeFooter(initialData))
  const [preset, setPreset] = useState('instagram')
  const { isDirty, markClean } = useUnsavedChanges(footer)
  const pageOptions = [{ id: '', title: 'URL sendiri', slug: '' }, ...pages]
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
  const setLink = (
    menuIndex: number,
    index: number,
    patch: Partial<FooterLink>
  ) =>
    setMenu(menuIndex, {
      links: footer.menus[menuIndex].links.map((link, i) =>
        i === index ? { ...link, ...patch } : link
      )
    })
  const moveLink = (menuIndex: number, index: number, offset: number) => {
    const links = [...footer.menus[menuIndex].links]
    ;[links[index], links[index + offset]] = [
      links[index + offset],
      links[index]
    ]
    setMenu(menuIndex, { links })
  }
  return (
    <form
      action={(fd) => {
        fd.set('footer', JSON.stringify(footer))
        formAction(fd)
      }}
      className='flex flex-col gap-8'
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='footer-address'>Alamat Publik</FieldLabel>
          <Textarea
            id='footer-address'
            value={footer.address}
            onChange={(e) => setFooter({ ...footer, address: e.target.value })}
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
      {footer.menus.map((menu, menuIndex) => (
        <FieldGroup key={menuIndex}>
          <Field>
            <FieldLabel htmlFor={`footer-menu-${menuIndex}`}>
              Judul Menu {menuIndex + 1}
            </FieldLabel>
            <Input
              id={`footer-menu-${menuIndex}`}
              value={menu.title}
              onChange={(e) => setMenu(menuIndex, { title: e.target.value })}
            />
            <FieldDescription>
              Menu tanpa tautan disembunyikan.
            </FieldDescription>
          </Field>
          {menu.links.map((link, index) => (
            <FieldGroup key={index} className='gap-3'>
              <Field>
                <FieldLabel htmlFor={`link-title-${menuIndex}-${index}`}>
                  Judul Tautan {index + 1}
                </FieldLabel>
                <Input
                  id={`link-title-${menuIndex}-${index}`}
                  value={link.label}
                  onChange={(e) =>
                    setLink(menuIndex, index, { label: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`link-page-${menuIndex}-${index}`}>
                  Tujuan
                </FieldLabel>
                <Combobox
                  items={pageOptions}
                  itemToStringLabel={(page) => page.title}
                  value={
                    pageOptions.find(
                      (page) => page.id === (link.pageId ?? '')
                    ) ?? null
                  }
                  onValueChange={(page) =>
                    page &&
                    setLink(menuIndex, index, {
                      pageId: page.id || undefined,
                      href: page.id ? `/${page.slug}` : link.href
                    })
                  }
                >
                  <ComboboxInput
                    id={`link-page-${menuIndex}-${index}`}
                    placeholder='Cari Halaman atau pilih URL sendiri…'
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Halaman tidak ditemukan.</ComboboxEmpty>
                    <ComboboxList>
                      {(page: SitePage) => (
                        <ComboboxItem key={page.id} value={page}>
                          {page.title}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              {!link.pageId && (
                <Field>
                  <FieldLabel htmlFor={`link-url-${menuIndex}-${index}`}>
                    URL
                  </FieldLabel>
                  <Input
                    id={`link-url-${menuIndex}-${index}`}
                    value={link.href}
                    onChange={(e) =>
                      setLink(menuIndex, index, { href: e.target.value })
                    }
                    placeholder='https://… atau /tentang'
                  />
                </Field>
              )}
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={index === 0}
                  onClick={() => moveLink(menuIndex, index, -1)}
                >
                  Naik<span className='sr-only'>: {link.label}</span>
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={index === menu.links.length - 1}
                  onClick={() => moveLink(menuIndex, index, 1)}
                >
                  Turun<span className='sr-only'>: {link.label}</span>
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setMenu(menuIndex, {
                      links: menu.links.filter((_, i) => i !== index)
                    })
                  }
                >
                  Hapus Tautan<span className='sr-only'>: {link.label}</span>
                </Button>
              </div>
            </FieldGroup>
          ))}
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            onClick={() =>
              setMenu(menuIndex, {
                links: [...menu.links, { label: '', href: '' }]
              })
            }
          >
            Tambah Tautan Menu {menuIndex + 1}
          </Button>
        </FieldGroup>
      ))}
      <FieldGroup>
        <h3 className='text-lg font-semibold'>Media Sosial</h3>
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
          <IconPicker id='social-preset' value={preset} onChange={setPreset} />
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
      {state.error && (
        <p role='alert' className='text-destructive text-sm'>
          {state.error}
        </p>
      )}
      <div className='flex flex-wrap items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Menyimpan…' : 'Simpan Pengaturan Footer'}
        </Button>
      </div>
    </form>
  )
}
