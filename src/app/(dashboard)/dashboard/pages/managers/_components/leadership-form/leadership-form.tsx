'use client'

import { useActionState, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { TransparentImageUpload } from '../transparent-image-upload'
import { saveLeadershipAction, type SettingsActionState } from '../action'
import type {
  LeadershipSettings,
  LeaderBlock,
  LeaderMember
} from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

// Prevent DnD sensor from activating on interactive elements
const isInteractiveElement = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName)
}

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false
        if (isInteractiveElement(nativeEvent.target)) return false
        return true
      }
    }
  ]
}

type Triumvirate = LeadershipSettings['triumvirate']
type TriumvirateKey = keyof Triumvirate
type Props = { initialData: LeadershipSettings }

const TRIUMVIRATE_META: { key: TriumvirateKey; label: string }[] = [
  { key: 'ketua', label: 'Ketua Umum' },
  { key: 'sekretaris', label: 'Sekretaris Jenderal' },
  { key: 'bendahara', label: 'Bendahara Umum' }
]

const SectionHeader = ({
  title,
  description
}: {
  title: string
  description: string
}) => (
  <div className='space-y-1'>
    <p className='text-foreground text-sm font-semibold'>{title}</p>
    <p className='text-muted-foreground text-sm'>{description}</p>
  </div>
)

// Drag handle icon (6-dot grip)
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

// Draggable member card
const SortableMemberCard = ({
  member,
  blockId,
  onUpdate,
  onRemove
}: {
  member: LeaderMember
  blockId: string
  onUpdate: (field: keyof LeaderMember, value: string) => void
  onRemove: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member.id, data: { type: 'member', blockId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='border-border bg-background overflow-hidden rounded-[10px] border'
    >
      {/* Card header */}
      <div className='border-border flex items-center justify-between border-b px-3 py-2'>
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='text-muted-foreground hover:bg-muted flex size-7 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing'
          aria-label='Geser card'
        >
          <GripIcon className='size-4' />
        </button>
        <button
          type='button'
          onClick={onRemove}
          className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded-md transition-colors'
          aria-label={`Hapus ${member.name || 'pengurus'}`}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            className='size-3.5'
            strokeWidth={2}
          />
        </button>
      </div>

      <TransparentImageUpload
        value={member.photoUrl}
        onChange={(path) => onUpdate('photoUrl', path)}
        folder='site-settings/leadership'
        height={140}
      />

      <div className='border-border space-y-3 border-t px-3 py-3'>
        <Field>
          <FieldLabel htmlFor={`member-name-${member.id}`}>Nama</FieldLabel>
          <FieldContent>
            <Input
              id={`member-name-${member.id}`}
              value={member.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              placeholder='Nama Lengkap'
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor={`member-role-${member.id}`}>Jabatan</FieldLabel>
          <FieldContent>
            <Input
              id={`member-role-${member.id}`}
              value={member.role}
              onChange={(e) => onUpdate('role', e.target.value)}
              placeholder='Direktur Kebijakan Publik'
            />
          </FieldContent>
        </Field>
      </div>
    </div>
  )
}

// Drag overlay card (ghost while dragging)
const MemberCardGhost = ({ member }: { member: LeaderMember }) => (
  <div className='border-primary/30 bg-background ring-primary/20 overflow-hidden rounded-[10px] border shadow-lg ring-1'>
    <div className='border-border flex items-center justify-between border-b px-3 py-2'>
      <div className='bg-muted text-muted-foreground flex size-7 cursor-grabbing items-center justify-center rounded-md'>
        <GripIcon className='size-4' />
      </div>
    </div>
    <div className='border-border border-t px-3 py-3'>
      <p className='text-foreground text-xs font-semibold'>
        {member.name || 'Pengurus'}
      </p>
      <p className='text-muted-foreground text-[10px]'>{member.role || '—'}</p>
    </div>
  </div>
)

// Droppable block container
const BlockDropZone = ({
  block,
  children
}: {
  block: LeaderBlock
  children: React.ReactNode
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: block.id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-lg transition-colors ${isOver ? 'bg-primary/5 ring-primary/20 ring-1' : ''}`}
    >
      {children}
    </div>
  )
}

// Sortable block wrapper — drag handle isolated so inputs inside remain editable
const SortableBlockWrapper = ({
  block,
  onRemove,
  onUpdateTitle,
  children
}: {
  block: LeaderBlock
  onRemove: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  children: React.ReactNode
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id, data: { type: 'block' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='border-border overflow-hidden rounded-[12px] border'
    >
      <div className='border-border bg-muted/30 flex items-center gap-2 border-b px-3 py-2.5'>
        {/* Block drag handle */}
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='text-muted-foreground hover:bg-muted flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing'
          aria-label='Geser blok'
        >
          <GripIcon className='size-4' />
        </button>

        <Input
          value={block.title}
          onChange={(e) => onUpdateTitle(block.id, e.target.value)}
          placeholder='Nama Blok'
          className='h-8 flex-1 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0'
          aria-label='Judul blok'
        />

        <button
          type='button'
          onClick={() => onRemove(block.id)}
          className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 shrink-0 items-center justify-center rounded-md transition-colors'
          aria-label={`Hapus blok ${block.title}`}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            className='size-3.5'
            strokeWidth={2}
          />
        </button>
      </div>

      {children}
    </div>
  )
}

// Initialise blocks from stored data, falling back to migrating legacy `leaders`
const initBlocks = (data: LeadershipSettings): LeaderBlock[] => {
  if (data.leaderBlocks.length > 0) return data.leaderBlocks
  if (data.leaders.length > 0) {
    return [
      {
        id: crypto.randomUUID(),
        title: 'Pengurus Pusat',
        members: data.leaders.map((l) => ({
          id: crypto.randomUUID(),
          name: l.name,
          role: l.role,
          photoUrl: l.photoUrl
        }))
      }
    ]
  }
  return []
}

export const LeadershipForm = ({ initialData }: Props) => {
  const dndId = useId()
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveLeadershipAction, {})

  const [triumvirate, setTriumvirate] = useState<Triumvirate>(
    initialData.triumvirate
  )
  const [periodLabel, setPeriodLabel] = useState(initialData.periodLabel)
  const [heading, setHeading] = useState(initialData.heading)
  const [blocks, setBlocks] = useState<LeaderBlock[]>(() =>
    initBlocks(initialData)
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'block' | 'member' | null>(null)

  const { isDirty, markClean } = useUnsavedChanges({
    blocks,
    periodLabel,
    heading,
    triumvirate
  })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan kepemimpinan berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.periodLabel !== undefined)
        setPeriodLabel(state.values.periodLabel)
      if (state.values.heading !== undefined) setHeading(state.values.heading)
    }
  }, [state.values, state.success])

  // ── Triumvirate helpers ────────────────────────────────────────────────────
  const updateTriumvirate = (
    key: TriumvirateKey,
    field: 'name' | 'photoUrl',
    value: string
  ) => {
    setTriumvirate((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  // ── Block helpers ──────────────────────────────────────────────────────────
  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: 'Blok Baru', members: [] }
    ])
  }

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  const updateBlockTitle = (blockId: string, title: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title } : b))
    )
  }

  // ── Member helpers ─────────────────────────────────────────────────────────
  const addMember = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              members: [
                ...b.members,
                { id: crypto.randomUUID(), name: '', role: '', photoUrl: '' }
              ]
            }
          : b
      )
    )
  }

  const removeMember = (blockId: string, memberId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, members: b.members.filter((m) => m.id !== memberId) }
          : b
      )
    )
  }

  const updateMember = (
    blockId: string,
    memberId: string,
    field: keyof LeaderMember,
    value: string
  ) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              members: b.members.map((m) =>
                m.id === memberId ? { ...m, [field]: value } : m
              )
            }
          : b
      )
    )
  }

  // ── DnD helpers ────────────────────────────────────────────────────────────
  const findBlockOfMember = (memberId: string) =>
    blocks.find((b) => b.members.some((m) => m.id === memberId))

  const findMember = (memberId: string): LeaderMember | undefined => {
    for (const block of blocks) {
      const m = block.members.find((m) => m.id === memberId)
      if (m) return m
    }
  }

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setActiveType(
      (event.active.data.current?.type as 'block' | 'member') ?? null
    )
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    // Block drags are handled entirely in dragEnd
    if (active.data.current?.type === 'block') return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const activeBlock = findBlockOfMember(activeId)
    if (!activeBlock) return

    // Is overId a block container or a member?
    const overBlock =
      blocks.find((b) => b.id === overId) ?? findBlockOfMember(overId)
    if (!overBlock || overBlock.id === activeBlock.id) return

    // Cross-block move
    setBlocks((prev) => {
      const next = prev.map((b) => ({ ...b, members: [...b.members] }))
      const from = next.find((b) => b.id === activeBlock.id)!
      const to = next.find((b) => b.id === overBlock.id)!

      const memberIdx = from.members.findIndex((m) => m.id === activeId)
      const [member] = from.members.splice(memberIdx, 1)

      const overMemberIdx = to.members.findIndex((m) => m.id === overId)
      if (overMemberIdx >= 0) {
        to.members.splice(overMemberIdx, 0, member)
      } else {
        to.members.push(member)
      }
      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    // Block reorder
    if (active.data.current?.type === 'block') {
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === activeId)
        const newIdx = prev.findIndex((b) => b.id === overId)
        if (oldIdx === -1 || newIdx === -1) return prev
        return arrayMove(prev, oldIdx, newIdx)
      })
      return
    }

    // Member reorder within same block
    const activeBlock = findBlockOfMember(activeId)
    const overBlock = findBlockOfMember(overId)
    if (!activeBlock || !overBlock || activeBlock.id !== overBlock.id) return

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== activeBlock.id) return b
        const oldIdx = b.members.findIndex((m) => m.id === activeId)
        const newIdx = b.members.findIndex((m) => m.id === overId)
        return { ...b, members: arrayMove(b.members, oldIdx, newIdx) }
      })
    )
  }

  const activeMember =
    activeId && activeType === 'member' ? findMember(activeId) : null
  const activeBlock =
    activeId && activeType === 'block'
      ? blocks.find((b) => b.id === activeId)
      : null
  const fe = state.fieldErrors ?? {}

  return (
    <form
      action={(fd) => {
        fd.set('triumvirate', JSON.stringify(triumvirate))
        fd.set('leaders', JSON.stringify([]))
        fd.set('leaderBlocks', JSON.stringify(blocks))
        formAction(fd)
      }}
      className='@container space-y-10'
    >
      {/* Section 01: Teks Halaman */}
      <section className='space-y-4'>
        <SectionHeader
          title='Teks Halaman'
          description='Label periode dan judul seksi yang tampil di halaman utama.'
        />
        <FieldGroup>
          <div className='grid grid-cols-1 gap-4 @sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='periodLabel'>Label Periode</FieldLabel>
              <FieldContent>
                <Input
                  id='periodLabel'
                  name='periodLabel'
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder='Masa Jabatan KAMMI'
                />
              </FieldContent>
              <FieldError
                errors={fe.periodLabel?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
              <FieldContent>
                <Input
                  id='heading'
                  name='heading'
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder='Mengenal Pengurus Pusat KAMMI'
                />
              </FieldContent>
              <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Section 02: Pimpinan Inti */}
      <section className='space-y-4'>
        <SectionHeader
          title='Pimpinan Inti'
          description='Foto PNG transparan. Ditampilkan sebagai wajah utama organisasi di halaman publik.'
        />
        <div className='grid grid-cols-1 gap-4 @md:grid-cols-3'>
          {TRIUMVIRATE_META.map(({ key, label }) => (
            <div
              key={key}
              className='border-border overflow-hidden rounded-[10px] border'
            >
              <div className='border-border border-b px-4 py-3'>
                <span className='text-muted-foreground font-mono text-[10px] font-medium tracking-wide uppercase'>
                  {label}
                </span>
              </div>

              <TransparentImageUpload
                value={triumvirate[key].photoUrl}
                onChange={(path) => updateTriumvirate(key, 'photoUrl', path)}
                folder='site-settings/leadership'
                height={192}
              />

              <div className='border-border border-t px-4 py-4'>
                <Input
                  value={triumvirate[key].name}
                  onChange={(e) =>
                    updateTriumvirate(key, 'name', e.target.value)
                  }
                  placeholder='Nama Lengkap'
                  aria-label={`Nama ${label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 03: Daftar Pengurus (blocks) */}
      <section className='space-y-6'>
        <SectionHeader
          title='Daftar Pengurus'
          description='Kelompokkan pengurus dalam blok dengan judul masing-masing. Drag untuk mengubah urutan antar blok.'
        />

        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-6'>
              {blocks.map((block) => (
                <SortableBlockWrapper
                  key={block.id}
                  block={block}
                  onRemove={removeBlock}
                  onUpdateTitle={updateBlockTitle}
                >
                  {/* Sortable member grid */}
                  <div className='p-4'>
                    <SortableContext
                      items={block.members.map((m) => m.id)}
                      strategy={rectSortingStrategy}
                    >
                      <BlockDropZone block={block}>
                        {block.members.length > 0 ? (
                          <div className='grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-3'>
                            {block.members.map((member) => (
                              <SortableMemberCard
                                key={member.id}
                                member={member}
                                blockId={block.id}
                                onUpdate={(field, value) =>
                                  updateMember(
                                    block.id,
                                    member.id,
                                    field,
                                    value
                                  )
                                }
                                onRemove={() =>
                                  removeMember(block.id, member.id)
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <div className='border-border flex min-h-[80px] items-center justify-center rounded-lg border border-dashed'>
                            <p className='text-muted-foreground text-sm'>
                              Taruh pengurus di sini
                            </p>
                          </div>
                        )}
                      </BlockDropZone>
                    </SortableContext>

                    <button
                      type='button'
                      onClick={() => addMember(block.id)}
                      className='border-border text-muted-foreground hover:border-primary/40 hover:text-primary mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed py-2.5 text-sm transition-colors'
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        className='size-4'
                        strokeWidth={2}
                      />
                      Tambah Pengurus
                    </button>
                  </div>
                </SortableBlockWrapper>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeMember ? <MemberCardGhost member={activeMember} /> : null}
            {activeBlock ? (
              <div className='border-primary/30 bg-background ring-primary/20 overflow-hidden rounded-[12px] border opacity-90 shadow-lg ring-1'>
                <div className='border-border bg-muted/30 flex items-center gap-2 border-b px-3 py-2.5'>
                  <div className='bg-muted text-muted-foreground flex size-7 cursor-grabbing items-center justify-center rounded-md'>
                    <GripIcon className='size-4' />
                  </div>
                  <span className='text-foreground flex-1 text-sm font-semibold'>
                    {activeBlock.title || 'Blok'}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {activeBlock.members.length} pengurus
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          type='button'
          onClick={addBlock}
          className='border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed py-3.5 text-sm font-medium transition-colors'
        >
          <HugeiconsIcon icon={Add01Icon} className='size-4' strokeWidth={2} />
          Tambah Blok
        </button>
      </section>

      {/* Save bar */}
      <div className='border-border flex items-center justify-end gap-3 border-t pt-6'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  )
}
