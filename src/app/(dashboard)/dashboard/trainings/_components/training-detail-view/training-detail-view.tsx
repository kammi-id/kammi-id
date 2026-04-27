'use client'

import React, { useTransition } from 'react'
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
  HugeiconsIcon
} from '@hugeicons/react'
import {
  UserGroupIcon,
  UserCheckIcon,
  Trash01Icon,
  Add01Icon,
  Calendar01Icon,
  Info01Icon
} from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'
import { TrainingWithDetails } from './types'
import { toast } from 'sonner'

interface TrainingDetailViewProps {
  training: TrainingWithDetails
}

export const TrainingDetailView = ({ training }: TrainingDetailViewProps) => {
  const [isPending, startTransition] = useTransition()

  const handleTogglePassing = async (memberId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await updateAttendantStatusAction({
        trainingId: training.id,
        memberId,
        isPassing: !currentStatus,
      })
      if (res.success) {
        toast.success('Status kelulusan diperbarui')
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleRemoveInstructor = async (memberId: string) => {
    if (!confirm('Hapus instruktur ini?')) return

    startTransition(async () => {
      const res = await removeInstructorAction(training.id, memberId)
      if (res.success) {
        toast.success('Instruktur dihapus')
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleAddAttendant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const memberId = formData.get('memberId') as string

    if (!memberId) return

    startTransition(async () => {
      const res = await addAttendantAction({
        trainingId: training.id,
        memberId,
      })
      if (res.success) {
        toast.success('Peserta berhasil ditambahkan')
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleAddInstructor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const memberId = formData.get('memberId') as string
    const role = formData.get('role') as any

    if (!memberId || !role) return

    startTransition(async () => {
      const res = await addInstructorAction({
        trainingId: training.id,
        memberId,
        role,
      })
      if (res.success) {
        toast.success('Instruktur berhasil ditambahkan')
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <HugeiconsIcon icon={Info01Icon} className="h-5 w-5" />
            <CardTitle>Informasi Training</CardTitle>
          </div>
          <CardDescription>{training.name}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-muted-foreground" />
            <span>Mulai: {training.startDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <HugeiconsPicon icon={Calendar01Icon} className="h-4 w-4 text-muted-foreground" />
            <span>Selesai: {training.endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs uppercase">
              {training.type}
            </span>
            {training.registrationDeadline && (
              <span className="text-muted-foreground text-xs">
                Deadline: {training.registrationDeadline}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendants Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />
                <CardTitle>Peserta ({training._attendants?.length ?? 0})</CardTitle>
              </div>
              <CardDescription>Kelola kehadiran dan kelulusan peserta</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddAttendant} className="flex gap-2">
              <Input name="memberId" placeholder="Member ID (UUID)" className="h-8 text-xs" />
              <Button type="submit" size="sm" disabled={isPending} className="h-8">
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {training._attendants?.map((att) => (
                <div
                  key={att.memberId}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={att.isPassing}
                      onCheckedChange={() => handleTogglePassing(att.memberId, att.isPassing)}
                      disabled={isPending}
                    />
                    <span className="text-sm font-medium">{att.member?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {att.isPassing && (
                      <span className="text-[10px] font-bold text-green-600 uppercase">Lulus</span>
                    )}
                    <HugeiconsIcon
                      icon={UserCheckIcon}
                      className={cn("h-4 w-4", att.isPassing ? "text-green-500" : "text-muted-foreground")}
                    />
                  </div>
                </div>
              ))}
              {(!training._attendants || training._attendants.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4">Belum ada peserta.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructors Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <HugeiconsIcon icon={UserCheckIcon} className="h-5 w-5" />
                <CardTitle>Instruktur ({training._instructors?.length ?? 0})</CardTitle>
              </div>
              <CardDescription>Kelola pemateri dan peran mereka</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddInstructor} className="flex gap-2">
              <Input name="memberId" placeholder="Member ID" className="h-8 text-xs" />
              <select
                name="role"
                className="h-8 text-xs rounded-md border bg-background px-2 text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="master">Master</option>
                <option value="assistant_master">Assistant Master</option>
                <option value="administrator">Administrator</option>
                <option value="classroom_master">Classroom Master</option>
                <option value="lecturer">Lecturer</option>
                <option value="observer">Observer</option>
                <option value="ustadz_of_training">Ustadz of Training</option>
              </select>
              <Button type="submit" size="sm" disabled={isPending} className="h-8">
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {training._instructors?.map((ins) => (
                <div
                  key={ins.memberId}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ins.member?.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{ins.role.replace('_', ' ')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstructor(ins.memberId)}
                    disabled={isPending}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <HugeiconsIcon icon={Trash01Icon} className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!training._instructors || training._instructors.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4">Belum ada instruktur.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
