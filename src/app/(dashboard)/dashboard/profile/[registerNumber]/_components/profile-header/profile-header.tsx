'use client'

import type { ReactNode, CSSProperties } from 'react'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '~/components/shadcn/ui/tooltip'
import { ProfileAvatar } from '../profile-avatar'
import { WarningTooltip } from '../warning-tooltip'
import { useProfileEdit } from '../profile-edit-context'

const statusLabel: Record<string, string> = {
  ab1: 'Anggota Biasa I — jenjang kader pertama',
  ab2: 'Anggota Biasa II — jenjang kader menengah',
  ab3: 'Anggota Biasa III — jenjang kader senior'
}

interface ProfileHeaderProps {
  editSlot?: ReactNode
  editActionsSlot?: ReactNode
  adminActionsSlot?: ReactNode
}

const statusStyles: Record<string, CSSProperties> = {
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
  editSlot,
  editActionsSlot,
  adminActionsSlot
}: ProfileHeaderProps) => {
  const { member, trainingHistory, canEdit, isEditing } = useProfileEdit()

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
              <div className='flex shrink-0 items-center gap-2'>
                {adminActionsSlot}
                {editActionsSlot ?? editSlot}
              </div>
            </div>

            <div className='mt-1 flex items-center gap-2'>
              <p className='font-geist-mono text-muted-foreground text-sm tracking-wide'>
                {member.registerNumber}
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className='inline-flex'>
                    <Badge
                      variant='outline'
                      className='cursor-default font-bold'
                      style={statusStyles[member.status]}
                    >
                      {member.status.toUpperCase()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {statusLabel[member.status] ?? member.status.toUpperCase()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!hasDm && requiredDm && (
                <WarningTooltip
                  message={`Status ${member.status.toUpperCase()} memerlukan ${requiredDm.toUpperCase()}, tapi belum ada di riwayat dauroh. Tambahkan melalui menu Dauroh.`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
