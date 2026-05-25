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
    backgroundColor: 'var(--status-ab1-bg)',
    borderColor: 'var(--status-ab1-border)',
    color: 'var(--status-ab1-text)'
  },
  ab2: {
    backgroundColor: 'var(--status-ab2-bg)',
    borderColor: 'var(--status-ab2-border)',
    color: 'var(--status-ab2-text)'
  },
  ab3: {
    backgroundColor: 'var(--status-ab3-bg)',
    borderColor: 'var(--status-ab3-border)',
    color: 'var(--status-ab3-text)'
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
              <h1 className='font-heading text-foreground text-2xl leading-tight font-bold md:text-3xl'>
                {member.name}
              </h1>
              <div className='shrink-0'>{editActionsSlot ?? editSlot}</div>
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
