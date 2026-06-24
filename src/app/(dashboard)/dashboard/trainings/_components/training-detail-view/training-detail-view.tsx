'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserGroupIcon,
  UserCheckIcon,
  Delete01Icon,
  Add01Icon,
  Calendar01Icon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  Globe02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Checkbox } from '~/components/shadcn/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '~/components/shadcn/ui/popover'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '~/components/shadcn/ui/tooltip'
import { Badge } from '~/components/shadcn/ui/badge'
import { Separator } from '~/components/shadcn/ui/separator'
import { EmptyState } from '~/components/shadcn/ui/empty-state'
import { cn } from '~/lib/shadcn/utils'
import { TrainingWithDetails } from './types'
import {
  updateAttendantStatusAction,
  removeInstructorAction,
  removeAttendantAction,
  addAttendantAction,
  addInstructorAction
} from './action'
import { TrainingAttendantCombobox } from './training-attendant-combobox'
import { TrainingInstructorCombobox } from './training-instructor-combobox'
import { DM1AddForm } from './dm1-add-form'
import { DM1BulkUploadButton } from './dm1-bulk-upload-button'
import type { EligibleMember, TrainingType } from '~/db/query/training'

interface TrainingDetailViewProps {
  training: TrainingWithDetails
  organizationName?: string
  canManage?: boolean
  canEditPassing?: boolean
  passingDeadline?: Date | null
}

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const instructorRoleLabels: Record<string, string> = {
  master: 'Master of Training',
  assistant_master: 'Assistant Master of Training',
  administrator: 'Admin Dauroh',
  classroom_master: 'Master of Classroom',
  lecturer: 'Instruktur Materi',
  observer: 'Observer',
  ustadz_of_training: 'Ustadz Dauroh'
}

const getTrainingStatus = (startDate: string, endDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (today < start) return 'scheduled'
  if (today > end) return 'completed'
  return 'ongoing'
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    const dayStart = start.toLocaleDateString('id-ID', { day: 'numeric' })
    const dayEnd = end.toLocaleDateString('id-ID', opts)
    return `${dayStart}–${dayEnd}`
  }
  return `${start.toLocaleDateString('id-ID', opts)} – ${end.toLocaleDateString('id-ID', opts)}`
}

const StatusBadge = ({
  startDate,
  endDate
}: {
  startDate: string
  endDate: string
}) => {
  const status = getTrainingStatus(startDate, endDate)
  if (status === 'scheduled') {
    return (
      <span className='font-geist-mono inline-flex items-center gap-1 rounded-full border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[var(--color-status-warning-text)] uppercase'>
        <HugeiconsIcon icon={Clock01Icon} className='size-3' />
        Terjadwal
      </span>
    )
  }
  if (status === 'ongoing') {
    return (
      <span className='border-primary/20 bg-primary/8 text-primary font-geist-mono inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase'>
        <span className='bg-primary size-1.5 animate-pulse rounded-full' />
        Berlangsung
      </span>
    )
  }
  return (
    <span className='font-geist-mono inline-flex items-center gap-1 rounded-full border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[var(--color-status-success-text)] uppercase'>
      <HugeiconsIcon icon={CheckmarkCircle01Icon} className='size-3' />
      Selesai
    </span>
  )
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className='text-muted-foreground font-geist-mono text-[11px] font-medium tracking-wider uppercase'>
    {children}
  </span>
)

const ConfirmDeleteButton = ({
  onConfirm,
  disabled,
  label,
  loading
}: {
  onConfirm: () => void
  disabled?: boolean
  label: string
  loading?: boolean
}) => {
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className='flex size-7 items-center justify-center'>
        <HugeiconsIcon
          icon={Loading03Icon}
          className='text-muted-foreground size-3.5 animate-spin'
        />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled}
            aria-label={label}
            className='text-muted-foreground hover:text-destructive hover:bg-destructive/8 size-7 p-0 opacity-0 transition-all group-hover:opacity-100'
          />
        }
      >
        <HugeiconsIcon icon={Delete01Icon} className='size-3.5' />
      </PopoverTrigger>
      <PopoverContent className='w-52 p-3'>
        <p className='text-foreground mb-3 text-xs font-medium'>
          Hapus dari daftar?
        </p>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            className='h-7 flex-1 text-xs'
            onClick={() => setOpen(false)}
          >
            Batal
          </Button>
          <Button
            size='sm'
            variant='destructive'
            className='h-7 flex-1 text-xs'
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Hapus
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const TrainingDetailView = ({
  training,
  organizationName,
  canManage = false,
  canEditPassing = false,
  passingDeadline
}: TrainingDetailViewProps) => {
  const trainingType = training.type as TrainingType
  const isDM1 = trainingType === 'dm1'

  const [isPending, startTransition] = useTransition()
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)

  const [selectedAttendantId, setSelectedAttendantId] = useState('')
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [instructorRole, setInstructorRole] = useState<string>('lecturer')
  const [showDM1Form, setShowDM1Form] = useState(false)

  const instructorRoleItems = [
    { value: 'master', label: 'Master of Training' },
    { value: 'assistant_master', label: 'Assistant Master' },
    { value: 'administrator', label: 'Admin Dauroh' },
    { value: 'classroom_master', label: 'Master of Classroom' },
    { value: 'lecturer', label: 'Instruktur Materi' },
    { value: 'observer', label: 'Observer' },
    { value: 'ustadz_of_training', label: 'Ustadz Dauroh' }
  ]

  const attendants = training.attendants ?? []
  const instructors = training.instructors ?? []
  const attendantCount = attendants.length
  const instructorCount = instructors.length
  const passingCount = attendants.filter((a) => a.isPassing).length
  const allPassing = attendantCount > 0 && passingCount === attendantCount

  const trainingStatus = getTrainingStatus(training.startDate, training.endDate)
  const isCompleted = trainingStatus === 'completed'

  const passingTooltip = !canManage
    ? 'Antum tidak memiliki hak akses untuk mengubah data ini'
    : !isCompleted
      ? 'Kelulusan hanya dapat diubah setelah dauroh selesai'
      : passingDeadline
        ? `Periode edit berakhir ${passingDeadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : 'Periode 30 hari untuk mengubah kelulusan telah berakhir'

  const handleTogglePassing = (memberId: string, currentStatus: boolean) => {
    setPendingMemberId(memberId)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('trainingId', training.id)
      formData.append('memberId', memberId)
      formData.append('isPassing', String(!currentStatus))
      const res = await updateAttendantStatusAction(null, formData)
      setPendingMemberId(null)
      if (!res.success) toast.error(res.message)
    })
  }

  const handleRemoveAttendant = (memberId: string, memberName: string) => {
    setPendingMemberId(memberId)
    startTransition(async () => {
      const res = await removeAttendantAction(training.id, memberId)
      setPendingMemberId(null)
      if (res.success) {
        toast.success(`${memberName} dihapus dari peserta`, {
          description: 'Aksi ini tidak dapat dibatalkan.'
        })
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleAddAttendant = (member: EligibleMember) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('trainingId', training.id)
      formData.append('memberId', member.id)
      const res = await addAttendantAction(null, formData)
      if (res.success) {
        toast.success(`${member.name} ditambahkan sebagai peserta`)
        setSelectedAttendantId('')
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleAddInstructor = (member: EligibleMember) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('trainingId', training.id)
      formData.append('memberId', member.id)
      formData.append('role', instructorRole)
      const res = await addInstructorAction(null, formData)
      if (res.success) {
        toast.success(`${member.name} ditambahkan sebagai instruktur`)
        setSelectedInstructorId('')
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleRemoveInstructor = (memberId: string, memberName: string) => {
    setPendingMemberId(memberId)
    startTransition(async () => {
      const res = await removeInstructorAction(training.id, memberId)
      setPendingMemberId(null)
      if (res.success) {
        toast.success(`${memberName} dihapus dari instruktur`, {
          description: 'Aksi ini tidak dapat dibatalkan.'
        })
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleToggleAllPassing = () => {
    startTransition(async () => {
      const newStatus = !allPassing
      await Promise.all(
        attendants.map(async (att) => {
          if (att.isPassing === newStatus) return
          const formData = new FormData()
          formData.append('trainingId', training.id)
          formData.append('memberId', att.memberId)
          formData.append('isPassing', String(newStatus))
          return updateAttendantStatusAction(null, formData)
        })
      )
      toast.success(
        newStatus
          ? 'Semua peserta ditandai lulus'
          : 'Semua peserta dikembalikan ke belum lulus'
      )
    })
  }

  return (
    <TooltipProvider>
      <div className='flex flex-col'>
        {/* Page Header */}
        <div className='flex flex-col gap-5 px-4 pt-6 pb-6 md:px-6 lg:px-8'>
          {/* Breadcrumb */}
          <nav aria-label='Breadcrumb'>
            <ol className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <li>
                <Link
                  href='/dashboard/trainings'
                  className='hover:text-foreground transition-colors'
                >
                  Dauroh
                </Link>
              </li>
              <li aria-hidden>
                <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
              </li>
              <li className='text-foreground font-medium' aria-current='page'>
                {training.name}
              </li>
            </ol>
          </nav>

          {/* Title row */}
          <div className='flex flex-col gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge
                variant='outline'
                className='border-primary/20 bg-primary/5 text-primary font-geist-mono text-[11px] font-bold uppercase'
              >
                {typeLabels[trainingType] ?? trainingType}
              </Badge>
              <StatusBadge
                startDate={training.startDate}
                endDate={training.endDate}
              />
            </div>
            <h1 className='font-heading text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
              {training.name}
            </h1>
          </div>

          {/* Meta strip */}
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm'>
            {organizationName && (
              <div className='flex items-center gap-1.5'>
                <HugeiconsIcon
                  icon={Globe02Icon}
                  className='size-3.5 shrink-0'
                />
                <span className='text-xs'>{organizationName}</span>
              </div>
            )}
            <div className='flex items-center gap-1.5'>
              <HugeiconsIcon
                icon={Calendar01Icon}
                className='size-3.5 shrink-0'
              />
              <span>
                {formatDateRange(training.startDate, training.endDate)}
              </span>
            </div>
            {training.registrationDeadline && (
              <div className='flex items-center gap-1.5'>
                <SectionLabel>Batas daftar</SectionLabel>
                <span className='text-xs'>
                  {new Date(training.registrationDeadline).toLocaleDateString(
                    'id-ID',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }
                  )}
                </span>
              </div>
            )}
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1'>
                <span className='text-foreground font-geist-mono text-xs font-semibold tabular-nums'>
                  {attendantCount}
                </span>
                <span className='text-xs'>peserta</span>
              </div>
              <div className='flex items-center gap-1'>
                <span
                  className={cn(
                    'font-geist-mono text-xs font-semibold tabular-nums',
                    passingCount > 0
                      ? 'text-[var(--color-status-success-text)]'
                      : 'text-muted-foreground'
                  )}
                >
                  {passingCount}
                </span>
                <span className='text-xs'>lulus</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Peserta Panel */}
        <div className='flex flex-col'>
          {/* Panel header */}
          <div className='flex items-center justify-between px-4 py-4 md:px-6 lg:px-8'>
            <div className='flex items-center gap-2'>
              <HugeiconsIcon
                icon={UserGroupIcon}
                className='text-primary size-4'
              />
              <span className='text-foreground text-sm font-semibold'>
                Peserta
              </span>
              {attendantCount > 0 && (
                <span className='text-muted-foreground font-geist-mono text-xs tabular-nums'>
                  ({attendantCount})
                </span>
              )}
            </div>

            {/* Bulk toggle */}
            {canEditPassing && attendantCount > 1 && (
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1.5 text-xs'
                onClick={handleToggleAllPassing}
                disabled={isPending}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className='size-3.5'
                />
                {allPassing ? 'Batalkan semua lulus' : 'Tandai semua lulus'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Passing restriction banner */}
          {isCompleted && !canEditPassing && (
            <div className='border-border/50 bg-muted/30 border-b px-4 py-2.5 md:px-6 lg:px-8'>
              <p className='text-muted-foreground text-xs'>
                {!canManage
                  ? 'Antum tidak memiliki hak akses untuk mengubah status kelulusan di dauroh ini.'
                  : passingDeadline
                    ? `Periode edit kelulusan berakhir ${passingDeadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                    : 'Periode 30 hari untuk mengubah kelulusan telah berakhir.'}
              </p>
            </div>
          )}

          {/* Add Attendant */}
          {canManage && (
            <div className='px-4 py-4 md:px-6 lg:px-8'>
              {isDM1 ? (
                <div className='flex flex-col gap-3'>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 flex-1 gap-1.5 text-xs'
                      onClick={() => setShowDM1Form(!showDM1Form)}
                    >
                      <HugeiconsIcon icon={Add01Icon} className='size-3.5' />
                      {showDM1Form ? 'Tutup Form' : 'Daftarkan Kader Baru'}
                    </Button>
                    <DM1BulkUploadButton
                      trainingId={training.id}
                      organizationId={(training as any).organizationId}
                    />
                  </div>
                  {showDM1Form && (
                    <div className='bg-muted/30 rounded-lg border p-4'>
                      <p className='text-muted-foreground mb-3 text-xs font-medium'>
                        Data kader baru akan dibuat otomatis dengan status AB1.
                      </p>
                      <DM1AddForm
                        trainingId={training.id}
                        organizationId={(training as any).organizationId}
                        onSuccess={() => setShowDM1Form(false)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-col gap-1.5'>
                  <SectionLabel>Tambah peserta</SectionLabel>
                  <TrainingAttendantCombobox
                    trainingId={training.id}
                    trainingType={trainingType}
                    value={selectedAttendantId}
                    onSelect={handleAddAttendant}
                    className='h-8 text-sm'
                  />
                  <p className='text-muted-foreground/70 text-xs'>
                    {trainingType === 'dm2' && 'Hanya kader berstatus AB1'}
                    {trainingType === 'dm3' &&
                      'Hanya kader AB2 berstatus Pemandu'}
                    {trainingType === 'dpmk' &&
                      'Hanya kader AB2 yang bukan Pemandu'}
                    {trainingType === 'tfi' &&
                      'Kader AB2/AB3 yang belum berstatus Instruktur'}
                  </p>
                </div>
              )}
              <Separator className='mt-4' />
            </div>
          )}

          {/* Attendant list */}
          <div className='px-4 pt-2 pb-6 md:px-6 lg:px-8'>
            {attendantCount === 0 ? (
              <EmptyState
                title='Belum ada peserta'
                description={
                  canManage
                    ? 'Tambahkan peserta menggunakan form di atas.'
                    : 'Belum ada peserta terdaftar.'
                }
              />
            ) : (
              <div
                role='list'
                aria-label='Daftar peserta'
                className='divide-border/40 divide-y'
              >
                {attendants.map((att, idx) => {
                  const name = att.member?.name ?? att.memberId
                  const isRowPending =
                    pendingMemberId === att.memberId && isPending
                  return (
                    <div
                      key={att.memberId}
                      role='listitem'
                      className={cn(
                        'group flex items-center justify-between gap-3 rounded-md px-1 py-2.5 transition-colors',
                        isRowPending ? 'opacity-50' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className='flex min-w-0 items-center gap-2.5'>
                        <span className='text-muted-foreground/40 font-geist-mono w-5 shrink-0 text-right text-[10px] tabular-nums'>
                          {idx + 1}
                        </span>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span
                                className={cn(
                                  !canEditPassing && 'cursor-not-allowed'
                                )}
                              />
                            }
                          >
                            <Checkbox
                              checked={att.isPassing}
                              onCheckedChange={
                                canEditPassing && !isRowPending
                                  ? () =>
                                      handleTogglePassing(
                                        att.memberId,
                                        att.isPassing
                                      )
                                  : undefined
                              }
                              disabled={!canEditPassing || isRowPending}
                              aria-label={`${name} — tandai lulus`}
                              className='shrink-0'
                            />
                          </TooltipTrigger>
                          {!canEditPassing && (
                            <TooltipContent side='top'>
                              <p className='max-w-[18ch] text-center text-xs'>
                                {passingTooltip}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <p className='text-foreground truncate text-sm font-medium'>
                          {name}
                        </p>
                      </div>
                      <div className='flex shrink-0 items-center gap-1.5'>
                        {att.isPassing ? (
                          <span className='font-geist-mono flex items-center gap-1 text-xs font-bold tracking-wide text-[var(--color-status-success-text)] uppercase'>
                            <HugeiconsIcon
                              icon={Tick01Icon}
                              className='size-3'
                            />
                            Lulus
                          </span>
                        ) : (
                          <span className='text-muted-foreground/40 font-geist-mono text-xs tracking-wide uppercase'>
                            Belum
                          </span>
                        )}
                        {canManage && (
                          <ConfirmDeleteButton
                            onConfirm={() =>
                              handleRemoveAttendant(att.memberId, name)
                            }
                            disabled={isPending}
                            loading={isRowPending}
                            label={`Hapus ${name} dari peserta`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Perangkat Daurah Panel */}
        <div className='flex flex-col'>
          <div className='flex items-center gap-2 px-4 py-4 md:px-6 lg:px-8'>
            <HugeiconsIcon
              icon={UserCheckIcon}
              className='text-primary size-4'
            />
            <span className='text-foreground text-sm font-semibold'>
              Perangkat Daurah
            </span>
            {instructorCount > 0 && (
              <span className='text-muted-foreground font-geist-mono text-xs tabular-nums'>
                ({instructorCount})
              </span>
            )}
          </div>

          <Separator />

          {/* Add Instructor */}
          {canManage && (
            <div className='px-4 py-4 md:px-6 lg:px-8'>
              <div className='flex flex-col gap-1.5'>
                <SectionLabel>Tambah instruktur</SectionLabel>
                <div className='flex gap-2'>
                  <TrainingInstructorCombobox
                    trainingId={training.id}
                    value={selectedInstructorId}
                    onSelect={handleAddInstructor}
                    className='h-8 flex-1 text-sm'
                  />
                  <Select
                    value={instructorRole}
                    items={instructorRoleItems}
                    onValueChange={(v) => v && setInstructorRole(v as string)}
                  >
                    <SelectTrigger
                      size='sm'
                      className='h-8 w-36 shrink-0 text-xs'
                    >
                      <SelectValue>
                        {instructorRoleItems.find(
                          (i) => i.value === instructorRole
                        )?.label ?? instructorRole}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {instructorRoleItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <p className='text-muted-foreground/70 text-xs'>
                  Hanya kader AB3 bersertifikat instruktur yang dapat dipilih
                </p>
              </div>
              <Separator className='mt-4' />
            </div>
          )}

          {/* Instructor list */}
          <div className='px-4 pt-2 pb-6 md:px-6 lg:px-8'>
            {instructorCount === 0 ? (
              <EmptyState
                title='Belum ada instruktur'
                description={
                  canManage
                    ? 'Cari kader bersertifikat instruktur di atas.'
                    : 'Belum ada instruktur terdaftar.'
                }
              />
            ) : (
              <div
                role='list'
                aria-label='Daftar instruktur'
                className='divide-border/40 divide-y'
              >
                {instructors.map((ins) => {
                  const name = ins.member?.name ?? ins.memberId
                  const isRowPending =
                    pendingMemberId === ins.memberId && isPending
                  return (
                    <div
                      key={ins.memberId}
                      role='listitem'
                      className={cn(
                        'group flex items-center justify-between gap-3 rounded-md px-1 py-2.5 transition-colors',
                        isRowPending ? 'opacity-50' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className='min-w-0'>
                        <p className='text-foreground truncate text-sm font-medium'>
                          {name}
                        </p>
                        <p className='text-muted-foreground font-geist-mono text-xs'>
                          {instructorRoleLabels[ins.role] ?? ins.role}
                        </p>
                      </div>
                      {canManage && (
                        <ConfirmDeleteButton
                          onConfirm={() =>
                            handleRemoveInstructor(ins.memberId, name)
                          }
                          disabled={isPending}
                          loading={isRowPending}
                          label={`Hapus instruktur ${name}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
