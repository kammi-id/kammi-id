'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  ImageAdd01Icon,
  Loading01Icon,
  StarIcon
} from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'
import { getSignedUrlAction, uploadImageAction } from '~/lib/actions/storage'
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES
} from '~/lib/api/upload-constraints'
import {
  buildInitialGalleryState,
  resolveMainImageId,
  toGalleryUploadValue,
  type GalleryImageItem,
  type GalleryUploadValue
} from './utils'

// Sama seperti `home-items-list`/`leadership-form`: cegah dnd-kit mulai
// nge-drag saat pointer-down jatuh di elemen interaktif (tombol bintang,
// tombol hapus).
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

// Sama seperti `ImageUpload`: path tersimpan (bukan http/blob/absolut) harus
// ditukar dulu ke signed URL sebelum dirender.
const useResolvedPreview = (path: string): string | null => {
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('/')
    ) {
      setPreview(path)
      return
    }
    getSignedUrlAction(path)
      .then((url) => {
        if (!cancelled) setPreview(url)
      })
      .catch(() => {
        if (!cancelled) setPreview(null)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return preview
}

const GalleryThumbnail = ({
  item,
  isMain,
  onSetMain,
  onRemove
}: {
  item: GalleryImageItem
  isMain: boolean
  onSetMain: () => void
  onRemove: () => void
}) => {
  const preview = useResolvedPreview(item.path)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border'
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- thumbnail tanpa dimensi tetap
        <img src={preview} alt='' className='h-full w-full object-cover' />
      ) : (
        <div className='flex h-full w-full items-center justify-center'>
          <HugeiconsIcon
            icon={Loading01Icon}
            className='text-muted-foreground size-5 animate-spin'
          />
        </div>
      )}

      <button
        type='button'
        {...attributes}
        {...listeners}
        className='absolute top-1 left-1 flex size-6 cursor-grab items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 active:cursor-grabbing'
        aria-label='Geser gambar'
      >
        <GripIcon className='size-3.5' />
      </button>

      <button
        type='button'
        onClick={onRemove}
        className='hover:bg-destructive absolute top-1 right-1 flex size-6 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
        aria-label='Hapus gambar'
      >
        <HugeiconsIcon icon={Delete02Icon} className='size-3.5' strokeWidth={2} />
      </button>

      <button
        type='button'
        onClick={onSetMain}
        aria-pressed={isMain}
        className={cn(
          'absolute bottom-1 left-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-opacity',
          isMain
            ? 'bg-primary text-primary-foreground opacity-100'
            : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        )}
        aria-label={
          isMain ? 'Batalkan sebagai Gambar Utama' : 'Jadikan Gambar Utama'
        }
      >
        <HugeiconsIcon icon={StarIcon} className='size-3' strokeWidth={2} />
        {isMain ? 'Utama' : 'Jadikan Utama'}
      </button>
    </div>
  )
}

const GalleryThumbnailGhost = ({ item }: { item: GalleryImageItem }) => {
  const preview = useResolvedPreview(item.path)
  return (
    <div className='border-primary/30 bg-background ring-primary/20 aspect-square overflow-hidden rounded-lg border shadow-lg ring-1'>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- thumbnail tanpa dimensi tetap
        <img src={preview} alt='' className='h-full w-full object-cover' />
      )}
    </div>
  )
}

interface GalleryUploadProps {
  value: GalleryUploadValue
  onChange: (value: GalleryUploadValue) => void
  folder: string
}

export const GalleryUpload = ({ value, onChange, folder }: GalleryUploadProps) => {
  const dndId = React.useId()
  const [initial] = React.useState(() => buildInitialGalleryState(value))
  const [items, setItems] = React.useState<GalleryImageItem[]>(initial.items)
  const [mainId, setMainId] = React.useState<string | null>(initial.mainId)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const emit = (nextItems: GalleryImageItem[], nextMainId: string | null) => {
    const resolvedMainId = resolveMainImageId(
      nextItems.map((item) => item.id),
      nextMainId
    )
    setItems(nextItems)
    setMainId(resolvedMainId)
    onChange(toGalleryUploadValue(nextItems, resolvedMainId))
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    emit(arrayMove(items, oldIndex, newIndex), mainId)
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const tooLarge = files.filter((file) => file.size > MAX_UPLOAD_BYTES)
    if (tooLarge.length > 0)
      toast.error(`${tooLarge.length} berkas melebihi batas 5MB dan dilewati.`)

    const valid = files.filter((file) => file.size <= MAX_UPLOAD_BYTES)
    if (valid.length === 0) return

    setIsUploading(true)
    try {
      const uploaded = await Promise.all(
        valid.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('folder', folder)
          const path = await uploadImageAction(formData)
          const uploadedItem: GalleryImageItem = { id: crypto.randomUUID(), path }
          return uploadedItem
        })
      )
      emit([...items, ...uploaded], mainId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengunggah gambar.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const activeItem = activeId ? (items.find((item) => item.id === activeId) ?? null) : null

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-3 gap-2'>
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            {items.map((item) => (
              <GalleryThumbnail
                key={item.id}
                item={item}
                isMain={item.id === mainId}
                onSetMain={() =>
                  emit(items, item.id === mainId ? null : item.id)
                }
                onRemove={() => emit(items.filter((i) => i.id !== item.id), mainId)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeItem ? <GalleryThumbnailGhost item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>

        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className='border-muted-foreground/25 bg-muted hover:border-primary/50 hover:bg-muted/80 text-muted-foreground flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs disabled:opacity-50'
        >
          <HugeiconsIcon
            icon={isUploading ? Loading01Icon : Add01Icon}
            className={cn('size-5', isUploading && 'animate-spin')}
          />
          {isUploading ? 'Mengunggah...' : 'Tambah'}
        </button>
      </div>

      {items.length === 0 && (
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          <HugeiconsIcon icon={ImageAdd01Icon} className='size-4' strokeWidth={1.5} />
          Belum ada gambar.
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_IMAGE_MIME_TYPES}
        multiple
        onChange={handleFilesSelected}
        disabled={isUploading}
        className='hidden'
      />

      <p className='text-muted-foreground text-xs'>
        Geser untuk mengurutkan Galeri. Klik <strong>bintang</strong> pada satu
        gambar untuk menjadikannya Gambar Utama — sisanya menjadi Galeri.
      </p>
    </div>
  )
}
