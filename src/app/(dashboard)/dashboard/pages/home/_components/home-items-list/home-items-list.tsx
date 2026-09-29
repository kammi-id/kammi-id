'use client'

import {
  useActionState,
  useEffect,
  useId,
  useState,
  useTransition
} from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  ImageAdd01Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Textarea } from '~/components/shadcn/ui/textarea'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import type { HomeItem } from '~/db/query/site-settings'
import type { SettingsActionState } from '../action'

// Prevent DnD from starting on interactive elements
const isInteractive = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName)
}

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false
        if (isInteractive(nativeEvent.target)) return false
        return true
      }
    }
  ]
}

const GripIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 16 16'
    fill='currentColor'
    className={className}
    aria-hidden='true'
  >
    <circle cx='5.5' cy='4' r='1.2' />
    <circle cx='10.5' cy='4' r='1.2' />
    <circle cx='5.5' cy='8' r='1.2' />
    <circle cx='10.5' cy='8' r='1.2' />
    <circle cx='5.5' cy='12' r='1.2' />
    <circle cx='10.5' cy='12' r='1.2' />
  </svg>
)

const ItemThumbnail = ({ url }: { url: string }) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url.startsWith('http') ? url : undefined}
      alt=''
      aria-hidden='true'
      className='size-10 shrink-0 rounded-md object-cover'
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  ) : (
    <div className='bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md'>
      <HugeiconsIcon
        icon={ImageAdd01Icon}
        className='size-4'
        strokeWidth={1.5}
      />
    </div>
  )

type SortableItemRowProps = {
  item: HomeItem
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (field: keyof HomeItem, value: string) => void
  onRemove: () => void
  folder: string
}

const SortableItemRow = ({
  item,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  folder
}: SortableItemRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='border-border overflow-hidden rounded-[10px] border bg-white'
    >
      {/* Row header — always visible */}
      <div
        onClick={(e) => {
          if (isInteractive(e.target as EventTarget)) return
          onToggle()
        }}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={isExpanded}
        className='flex cursor-pointer items-center gap-3 px-3 py-3 select-none'
      >
        <button
          type='button'
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className='text-muted-foreground hover:bg-muted flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing'
          aria-label='Geser item'
        >
          <GripIcon className='size-4' />
        </button>

        <ItemThumbnail url={item.imageUrl} />

        <div className='min-w-0 flex-1'>
          <p className='text-foreground truncate text-sm font-semibold'>
            {item.title || (
              <span className='text-muted-foreground italic'>Tanpa judul</span>
            )}
          </p>
          {item.badgeText && (
            <p className='text-muted-foreground truncate font-mono text-[10px] tracking-wide uppercase'>
              {item.badgeText}
            </p>
          )}
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded-md transition-colors'
            aria-label={`Hapus ${item.title || 'item'}`}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              className='size-3.5'
              strokeWidth={2}
            />
          </button>
          <div className='text-muted-foreground flex size-7 items-center justify-center'>
            <HugeiconsIcon
              icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
              className='size-4'
              strokeWidth={2}
            />
          </div>
        </div>
      </div>

      {/* Inline edit panel */}
      {isExpanded && (
        <div className='border-border border-t px-4 py-5'>
          <FieldGroup>
            <Field>
              <FieldLabel>Gambar Hero</FieldLabel>
              <FieldContent>
                <ImageUpload
                  value={item.imageUrl}
                  onChange={(v) => onUpdate('imageUrl', v)}
                  folder={folder}
                  variant='background'
                />
              </FieldContent>
            </Field>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor={`title-${item.id}`}>
                  Judul Utama
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={`title-${item.id}`}
                    value={item.title}
                    onChange={(e) => onUpdate('title', e.target.value)}
                    placeholder='Pelopor Kebaikan'
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor={`badge-${item.id}`}>Badge Text</FieldLabel>
                <FieldContent>
                  <Input
                    id={`badge-${item.id}`}
                    value={item.badgeText}
                    onChange={(e) => onUpdate('badgeText', e.target.value)}
                    placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia'
                  />
                </FieldContent>
                <FieldDescription>
                  Teks kecil di atas judul, tampil sebagai pill badge.
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor={`desc-${item.id}`}>Deskripsi</FieldLabel>
              <FieldContent>
                <Textarea
                  id={`desc-${item.id}`}
                  value={item.description}
                  onChange={(e) => onUpdate('description', e.target.value)}
                  rows={3}
                  placeholder='Membangun peradaban dengan...'
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>
      )}
    </div>
  )
}

const ItemRowGhost = ({ item }: { item: HomeItem }) => (
  <div className='border-primary/30 bg-background ring-primary/20 flex items-center gap-3 rounded-[10px] border px-3 py-3 shadow-lg ring-1'>
    <div className='bg-muted text-muted-foreground flex size-7 cursor-grabbing items-center justify-center rounded-md'>
      <GripIcon className='size-4' />
    </div>
    <ItemThumbnail url={item.imageUrl} />
    <p className='text-foreground flex-1 truncate text-sm font-semibold'>
      {item.title || 'Item'}
    </p>
  </div>
)

type Props = {
  label: string
  description: string
  initialItems: HomeItem[]
  folder: string
  action: (
    prev: SettingsActionState,
    formData: FormData
  ) => Promise<SettingsActionState>
}

export const HomeItemsList = ({
  label,
  description,
  initialItems,
  folder,
  action
}: Props) => {
  const dndId = useId()
  const [items, setItems] = useState<HomeItem[]>(initialItems)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id)
      const newIdx = prev.findIndex((i) => i.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  const addItem = () => {
    const id = crypto.randomUUID()
    setItems((prev) => [
      ...prev,
      { id, imageUrl: '', title: '', description: '', badgeText: '' }
    ])
    setExpandedId(id)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const updateItem = (id: string, field: keyof HomeItem, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  const save = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('items', JSON.stringify(items))
      const result = await action({}, fd)
      if (result.success) {
        toast.success(`${label} berhasil disimpan.`)
      } else {
        toast.error(result.error ?? 'Gagal menyimpan.')
      }
    })
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <p className='text-foreground text-sm font-semibold'>{label}</p>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addItem}
          className='shrink-0 gap-2'
        >
          <HugeiconsIcon icon={Add01Icon} className='size-4' strokeWidth={2} />
          Tambah Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className='border-border text-muted-foreground flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed text-sm'>
          <HugeiconsIcon
            icon={ImageAdd01Icon}
            className='size-8 opacity-40'
            strokeWidth={1.5}
          />
          <p>Belum ada section. Tambahkan yang pertama.</p>
        </div>
      ) : (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2'>
              {items.map((item) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  isExpanded={expandedId === item.id}
                  onToggle={() =>
                    setExpandedId((prev) => (prev === item.id ? null : item.id))
                  }
                  onUpdate={(field, value) => updateItem(item.id, field, value)}
                  onRemove={() => removeItem(item.id)}
                  folder={folder}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? <ItemRowGhost item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {items.length > 0 && (
        <div className='flex justify-end pt-2'>
          <Button
            type='button'
            onClick={save}
            disabled={isPending}
            className='px-6'
          >
            {isPending ? 'Menyimpan...' : `Simpan ${label}`}
          </Button>
        </div>
      )}
    </div>
  )
}
