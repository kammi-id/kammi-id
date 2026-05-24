'use client'

import React, { useActionState, useEffect } from 'react'
import {
  updateAttendantStatusAction,
  removeInstructorAction,
  addAttendantAction,
  addInstructorAction
} from './action'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Button } from '~/components/shadcn/ui/button'
import { Checkbox } from '~/components/shadcn/ui/checkbox'
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserGroupIcon,
  UserCheckIcon,
  Delete01Icon,
  Add01Icon,
  Calendar01Icon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'
import { TrainingWithDetails } from './types'
import { toast } from 'sonner'

interface TrainingDetailViewProps {
  training: TrainingWithDetails
}

export const TrainingDetailView = ({ training }: TrainingDetailViewProps) => {
  // Action state for adding attendants
  const [attendantState, addAttendantActionWrapper, isAttendantPending] =
    useActionState(addAttendantAction, {
      success: false,
      message: '',
      errors: {}
    })

  // Action state for adding instructors
  const [instructorState, addInstructorActionWrapper, isInstructorPending] =
    useActionState(addInstructorAction, {
      success: false,
      message: '',
      errors: {}
    })

  // Handle attendant success/error
  useEffect(() => {
    if (attendantState.success) {
      toast.success('Peserta berhasil ditambahkan')
    } else if (attendantState.message && !attendantState.errors) {
      toast.error(attendantState.message)
    }
  }, [attendantState])

  // Handle instructor success/error
  useEffect(() => {
    if (instructorState.success) {
      toast.success('Instruktur berhasil ditambahkan')
    } else if (instructorState.message && !instructorState.errors) {
      toast.error(instructorState.message)
    }
  }, [instructorState])

  const handleTogglePassing = async (
    memberId: string,
    currentStatus: boolean
  ) => {
    const formData = new FormData()
    formData.append('trainingId', training.id)
    formData.append('memberId', memberId)
    formData.append('isPassing', String(!currentStatus))

    const res = await updateAttendantStatusAction(null, formData)
    if (res.success) {
      toast.success('Status kelulusan diperbarui')
    } else {
      toast.error(res.message)
    }
  }

  const handleRemoveInstructor = async (memberId: string) => {
    if (!confirm('Hapus instruktur ini?')) return

    const res = await removeInstructorAction(training.id, memberId)
    if (res.success) {
      toast.success('Instruktur dihapus')
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className='text-primary flex items-center gap-2'>
            <HugeiconsIcon icon={InformationCircleIcon} className='size-5' />
            <CardTitle>Informasi Training</CardTitle>
          </div>
          <CardDescription>{training.name}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-3'>
          <div className='flex items-center gap-2 text-sm'>
            <HugeiconsIcon
              icon={Calendar01Icon}
              className='text-muted-foreground size-4'
            />
            <span>Mulai: {training.startDate}</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <HugeiconsIcon
              icon={Calendar01Icon}
              className='text-muted-foreground size-4'
            />
            <span>Selesai: {training.endDate}</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium uppercase'>
              {training.type}
            </span>
            {training.registrationDeadline ? (
              <span className='text-muted-foreground text-xs'>
                Deadline: {training.registrationDeadline}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Attendants Section */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <div className='text-primary flex items-center gap-2'>
                <HugeiconsIcon icon={UserGroupIcon} className='size-5' />
                <CardTitle>
                  Peserta ({training.attendants?.length ?? 0})
                </CardTitle>
              </div>
              <CardDescription>
                Kelola kehadiran dan kelulusan peserta
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form action={addAttendantActionWrapper} className='flex gap-2'>
              <input type='hidden' name='trainingId' value={training.id} />
              <label htmlFor='attendant-member-id' className='sr-only'>
                Member ID Peserta
              </label>
              <Input
                id='attendant-member-id'
                name='memberId'
                placeholder='Member ID (UUID)'
                className='h-8 text-xs'
                required
              />
              <Button
                type='submit'
                size='sm'
                disabled={isAttendantPending}
                aria-label='Tambah peserta'
                className='h-8'
              >
                <HugeiconsIcon icon={Add01Icon} className='size-4' />
              </Button>
            </form>
            {attendantState.errors?.memberId && (
              <p className='text-destructive text-xs font-medium'>
                {attendantState.errors.memberId[0]}
              </p>
            )}

            <div className='space-y-2'>
              {training.attendants?.map((att) => (
                <div
                  key={att.memberId}
                  className='bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-2 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <Checkbox
                      checked={att.isPassing}
                      onCheckedChange={() =>
                        handleTogglePassing(att.memberId, att.isPassing)
                      }
                      disabled={isAttendantPending}
                      aria-label={`${att.member?.name ?? att.memberId} — lulus`}
                    />
                    <span className='text-sm font-medium'>
                      {att.member?.name}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {att.isPassing ? (
                      <span className='text-[10px] font-bold uppercase [color:var(--status-pass-text)]'>
                        Lulus
                      </span>
                    ) : null}
                    <HugeiconsIcon
                      icon={UserCheckIcon}
                      className={cn(
                        'size-4',
                        att.isPassing
                          ? '[color:var(--status-pass-text)]'
                          : 'text-muted-foreground'
                      )}
                    />
                  </div>
                </div>
              ))}
              {!training.attendants || training.attendants.length === 0 ? (
                <p className='text-muted-foreground py-4 text-center text-xs'>
                  Belum ada peserta.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Instructors Section */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <div className='text-primary flex items-center gap-2'>
                <HugeiconsIcon icon={UserCheckIcon} className='size-5' />
                <CardTitle>
                  Instruktur ({training.instructors?.length ?? 0})
                </CardTitle>
              </div>
              <CardDescription>
                Kelola pemateri dan peran mereka
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form action={addInstructorActionWrapper} className='flex gap-2'>
              <input type='hidden' name='trainingId' value={training.id} />
              <label htmlFor='instructor-member-id' className='sr-only'>
                Member ID Instruktur
              </label>
              <Input
                id='instructor-member-id'
                name='memberId'
                placeholder='Member ID'
                className='h-8 text-xs'
                required
              />
              <Select name='role' defaultValue='master'>
                <SelectTrigger size='sm' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='master'>Master</SelectItem>
                    <SelectItem value='assistant_master'>Assistant Master</SelectItem>
                    <SelectItem value='administrator'>Administrator</SelectItem>
                    <SelectItem value='classroom_master'>Classroom Master</SelectItem>
                    <SelectItem value='lecturer'>Lecturer</SelectItem>
                    <SelectItem value='observer'>Observer</SelectItem>
                    <SelectItem value='ustadz_of_training'>Ustadz of Training</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type='submit'
                size='sm'
                disabled={isInstructorPending}
                aria-label='Tambah instruktur'
                className='h-8'
              >
                <HugeiconsIcon icon={Add01Icon} className='size-4' />
              </Button>
            </form>
            {instructorState.errors?.memberId && (
              <p className='text-destructive text-xs font-medium'>
                {instructorState.errors.memberId[0]}
              </p>
            )}

            <div className='space-y-2'>
              {training.instructors?.map((ins) => (
                <div
                  key={ins.memberId}
                  className='bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-2 transition-colors'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>
                      {ins.member?.name}
                    </span>
                    <span className='text-muted-foreground text-[10px] capitalize'>
                      {ins.role.replace('_', ' ')}
                    </span>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveInstructor(ins.memberId)}
                    disabled={isInstructorPending}
                    aria-label={`Hapus instruktur ${ins.member?.name ?? ins.memberId}`}
                    className='text-destructive hover:bg-destructive/10 size-8 p-0'
                  >
                    <HugeiconsIcon icon={Delete01Icon} className='size-4' />
                  </Button>
                </div>
              ))}
              {!training.instructors || training.instructors.length === 0 ? (
                <p className='text-muted-foreground py-4 text-center text-xs'>
                  Belum ada instruktur.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
