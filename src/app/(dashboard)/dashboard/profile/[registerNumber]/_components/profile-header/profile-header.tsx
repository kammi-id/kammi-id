import React from 'react'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { ProfileAvatar } from '../profile-avatar'
import { WarningTooltip } from '../warning-tooltip'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'

interface ProfileHeaderProps {
  member: Member
  canEdit: boolean
  trainingHistory?: MemberTrainingHistory
  isEditing?: boolean
  editSlot?: React.ReactNode
  editActionsSlot?: React.ReactNode
}

const statusStyles: Record<string, React.CSSProperties> = {
  ab1: {
    backgroundColor: 'oklch(0.65 0.18 145 / 0.12)',
    borderColor: 'oklch(0.55 0.16 145 / 0.40)',
    color: 'oklch(0.40 0.16 145)'
  },
  ab2: {
    backgroundColor: 'oklch(0.58 0.20 25 / 0.12)',
    borderColor: 'oklch(0.48 0.18 25 / 0.40)',
    color: 'oklch(0.42 0.18 25)'
  },
  ab3: {
    backgroundColor: 'oklch(0.55 0.18 265 / 0.12)',
    borderColor: 'oklch(0.42 0.17 265 / 0.40)',
    color: 'oklch(0.38 0.17 265)'
  }
}

const statusRequiredDm: Record<string, 'dm1' | 'dm2' | 'dm3'> = {
  ab1: 'dm1',
  ab2: 'dm2',
  ab3: 'dm3'
}

export const ProfileHeader = ({
  member,
  canEdit,
  trainingHistory,
  isEditing = false,
  editSlot,
  editActionsSlot
}: ProfileHeaderProps) => {
  const requiredDm = statusRequiredDm[member.status]
  const hasDm = requiredDm
    ? (trainingHistory?.asAttendant.some((r) => r.type === requiredDm) ?? false)
    : true

  return (
    <header className='border-border bg-background border-b'>
      <div className='px-6 pt-5 pb-6'>
        <nav className='mb-5 flex items-center gap-1.5 text-sm'>
          <Link
            href='/dashboard/kader'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Kader
          </Link>
          <span className='text-muted-foreground/50'>/</span>
          <span className='text-foreground font-medium'>{member.name}</span>
        </nav>

        <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6'>
          <ProfileAvatar
            name={member.name}
            photoPath={member.photo}
            memberId={member.id}
            canEdit={canEdit && isEditing}
          />

          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <h1 className='font-heading text-foreground text-2xl font-bold leading-tight md:text-3xl'>
                {member.name}
              </h1>
              <div className='shrink-0'>
                {editActionsSlot ?? editSlot}
              </div>
            </div>

            <div className='mt-1 flex items-center gap-2'>
              <p className='font-geist-mono text-muted-foreground text-sm tracking-wide'>
                {member.registerNumber}
              </p>
              <Badge
                variant='outline'
                className='font-bold'
                style={statusStyles[member.status]}
              >
                {member.status.toUpperCase()}
              </Badge>
              {trainingHistory && !hasDm && requiredDm && (
                <WarningTooltip
                  message={`Belum ada entry ${requiredDm.toUpperCase()} di riwayat pelatihan`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
