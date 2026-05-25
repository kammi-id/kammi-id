'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Field, FieldContent, FieldLabel } from '~/components/shadcn/ui/field'
import { Input } from '~/components/shadcn/ui/input'

export type LinkItem = { id: string; label: string; href: string }

interface LinkListEditorProps {
  links: LinkItem[]
  onChange: (next: LinkItem[]) => void
  sectionLabel: string
}

export const LinkListEditor = ({
  links,
  onChange,
  sectionLabel
}: LinkListEditorProps) => {
  const update = (id: string, field: keyof Omit<LinkItem, 'id'>, value: string) => {
    onChange(links.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }
  const add = () =>
    onChange([...links, { id: `link-${Date.now()}`, label: '', href: '' }])
  const remove = (id: string) => onChange(links.filter((l) => l.id !== id))

  return (
    <div className='space-y-2'>
      <p className='text-foreground text-sm font-medium'>{sectionLabel}</p>
      {links.length > 0 && (
        <div className='grid grid-cols-[1fr_1fr_2.25rem] gap-2'>
          <span className='text-muted-foreground px-1 text-xs'>Nama Link</span>
          <span className='text-muted-foreground px-1 text-xs'>URL</span>
          <span />
        </div>
      )}
      {links.map((link) => (
        <div key={link.id} className='grid grid-cols-[1fr_1fr_2.25rem] items-end gap-2'>
          <Field>
            <FieldLabel htmlFor={`${sectionLabel}-label-${link.id}`} className='sr-only'>
              Nama Link
            </FieldLabel>
            <FieldContent>
              <Input
                id={`${sectionLabel}-label-${link.id}`}
                value={link.label}
                onChange={(e) => update(link.id, 'label', e.target.value)}
                placeholder='Tentang Kami'
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${sectionLabel}-href-${link.id}`} className='sr-only'>
              URL
            </FieldLabel>
            <FieldContent>
              <Input
                id={`${sectionLabel}-href-${link.id}`}
                value={link.href}
                onChange={(e) => update(link.id, 'href', e.target.value)}
                placeholder='/tentang atau #seksi'
              />
            </FieldContent>
          </Field>
          <button
            type='button'
            onClick={() => remove(link.id)}
            disabled={links.length <= 1}
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-30'
            aria-label={`Hapus link ${link.label || 'ini'}`}
          >
            <HugeiconsIcon icon={Delete02Icon} className='size-4' strokeWidth={2} />
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
