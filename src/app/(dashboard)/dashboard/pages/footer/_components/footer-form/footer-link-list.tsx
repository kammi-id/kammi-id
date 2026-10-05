'use client'

import { useId } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  restrictToParentElement,
  restrictToVerticalAxis
} from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  DragDropVerticalIcon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Field, FieldGroup, FieldLabel } from '~/components/shadcn/ui/field'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { cn } from '~/lib/shadcn/utils'
import type { FooterLink } from '~/lib/site-links'

export type SitePage = { id: string; title: string; slug: string }

/** A footer link plus a client-only key for dnd-kit; never persisted. */
export type SortableFooterLink = FooterLink & { id: string }

type FooterLinkRowProps = {
  link: SortableFooterLink
  position: number
  pageOptions: SitePage[]
  onChange: (patch: Partial<FooterLink>) => void
  onRemove: () => void
}

const FooterLinkRow = ({
  link,
  position,
  pageOptions,
  onChange,
  onRemove
}: FooterLinkRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id })
  const name = link.label || `Tautan ${position}`

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition
      }}
      className={cn(
        'bg-card flex items-start gap-2 rounded-xl border p-3',
        isDragging && 'ring-primary/30 relative z-10 shadow-lg ring-2'
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        type='button'
        variant='ghost'
        size='icon-sm'
        className='mt-6 cursor-grab touch-none active:cursor-grabbing'
        aria-label={`Geser ${name}`}
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} />
      </Button>
      <FieldGroup className='min-w-0 flex-1 gap-3'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor={`link-title-${link.id}`}>
              Judul Tautan
            </FieldLabel>
            <Input
              id={`link-title-${link.id}`}
              value={link.label}
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`link-page-${link.id}`}>Halaman</FieldLabel>
            <Combobox
              items={pageOptions}
              itemToStringLabel={(page) => page.title}
              value={
                pageOptions.find((page) => page.id === (link.pageId ?? '')) ??
                null
              }
              onValueChange={(page) =>
                page &&
                onChange({
                  pageId: page.id || undefined,
                  href: page.id ? `/${page.slug}` : link.href
                })
              }
            >
              <ComboboxInput
                id={`link-page-${link.id}`}
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
        </div>
        {!link.pageId && (
          <Field>
            <FieldLabel htmlFor={`link-url-${link.id}`}>URL</FieldLabel>
            <Input
              id={`link-url-${link.id}`}
              value={link.href}
              onChange={(e) => onChange({ href: e.target.value })}
              placeholder='https://… atau /tentang'
            />
          </Field>
        )}
      </FieldGroup>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        className='mt-6'
        aria-label={`Hapus ${name}`}
        onClick={onRemove}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </Button>
    </li>
  )
}

type FooterLinkListProps = {
  menuTitle: string
  links: SortableFooterLink[]
  pages: SitePage[]
  onChange: (links: SortableFooterLink[]) => void
}

/**
 * One footer menu's links, reorderable by dragging the handle (pointer) or
 * by focusing it and using Space + arrow keys (keyboard). Each menu owns its
 * own `DndContext`, so links move within their menu, never across menus.
 */
export const FooterLinkList = ({
  menuTitle,
  links,
  pages,
  onChange
}: FooterLinkListProps) => {
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const pageOptions = [{ id: '', title: 'URL sendiri', slug: '' }, ...pages]

  const labelOf = (id: string | number) => {
    const index = links.findIndex((link) => link.id === id)
    return links[index]?.label || `Tautan ${index + 1}`
  }
  const positionOf = (id: string | number) =>
    links.findIndex((link) => link.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Mengambil ${labelOf(active.id)} di posisi ${positionOf(active.id)} dari ${links.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} dipindah ke posisi ${positionOf(over.id)} dari ${links.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} diletakkan di posisi ${positionOf(over.id)} dari ${links.length}.`
        : `${labelOf(active.id)} diletakkan.`,
    onDragCancel: ({ active }) =>
      `Batal menggeser ${labelOf(active.id)}; kembali ke posisi semula.`
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onChange(
      arrayMove(
        links,
        links.findIndex((link) => link.id === active.id),
        links.findIndex((link) => link.id === over.id)
      )
    )
  }

  const update = (id: string, patch: Partial<FooterLink>) =>
    onChange(
      links.map((link) => (link.id === id ? { ...link, ...patch } : link))
    )

  return (
    <div className='flex flex-col gap-3'>
      {links.length === 0 ? (
        <p className='text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm'>
          Belum ada tautan. Menu tanpa tautan disembunyikan di situs.
        </p>
      ) : (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable:
                'Tekan Spasi atau Enter untuk mengambil tautan, panah atas/bawah untuk memindahkan, Spasi atau Enter lagi untuk meletakkan, Escape untuk batal.'
            }
          }}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((link) => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol
              className='flex flex-col gap-2'
              aria-label={`Tautan ${menuTitle}`}
            >
              {links.map((link, index) => (
                <FooterLinkRow
                  key={link.id}
                  link={link}
                  position={index + 1}
                  pageOptions={pageOptions}
                  onChange={(patch) => update(link.id, patch)}
                  onRemove={() =>
                    onChange(links.filter((item) => item.id !== link.id))
                  }
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      <Button
        type='button'
        variant='outline'
        className='w-fit'
        onClick={() =>
          onChange([...links, { id: crypto.randomUUID(), label: '', href: '' }])
        }
      >
        <HugeiconsIcon
          icon={Add01Icon}
          strokeWidth={2}
          data-icon='inline-start'
        />
        Tambah Tautan
      </Button>
    </div>
  )
}
