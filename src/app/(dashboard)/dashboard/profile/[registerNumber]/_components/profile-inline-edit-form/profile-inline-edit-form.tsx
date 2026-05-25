'use client'

import React, { useActionState, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PencilEdit01Icon,
  FloppyDiskIcon,
  Cancel01Icon
} from '@hugeicons/core-free-icons'
import { updateMemberProfileAction } from '../action'
import { ProfileHeader } from '../profile-header'
import { ProfileInfo } from '../profile-info'
import { ProfileSidebar } from '../profile-sidebar'
import { ProfileTrainingHistory } from '../profile-training-history'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'

interface ProfileInlineEditFormProps {
  member: Member
  canEdit: boolean
  trainingHistory: MemberTrainingHistory
  orgHierarchySlot?: React.ReactNode
}

export const ProfileInlineEditForm = ({
  member,
  canEdit,
  trainingHistory,
  orgHierarchySlot
}: ProfileInlineEditFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const boundAction = updateMemberProfileAction.bind(null, member.id)
  const [state, formAction, isPending] = useActionState(boundAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil diperbarui.')
      setIsEditing(false)
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state])

  const handleReset = useCallback(() => {
    setFormKey((k) => k + 1)
    setIsEditing(false)
  }, [])

  const editSlot = canEdit ? (
    isEditing ? null : (
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={() => setIsEditing(true)}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} className='mr-1.5 size-3.5' />
        Edit Profil
      </Button>
    )
  ) : null

  const editActionsSlot = isEditing ? (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={handleReset}
        disabled={isPending}
      >
        <HugeiconsIcon icon={Cancel01Icon} className='mr-1.5 size-3.5' />
        Reset
      </Button>
      <Button
        size='sm'
        type='submit'
        form='profile-edit-form'
        disabled={isPending}
      >
        <HugeiconsIcon icon={FloppyDiskIcon} className='mr-1.5 size-3.5' />
        {isPending ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </div>
  ) : null

  return (
    <form id='profile-edit-form' action={formAction}>
      <ProfileHeader
        member={member}
        canEdit={canEdit}
        trainingHistory={trainingHistory}
        isEditing={isEditing}
        editSlot={editSlot}
        editActionsSlot={editActionsSlot}
      />

      <div className='px-6 py-8'>
        <div className='mx-auto max-w-5xl'>
          <div className='flex flex-col gap-8 lg:flex-row lg:gap-10'>
            <main className='min-w-0 flex-1'>
              <ProfileInfo
                key={`info-${formKey}`}
                member={member}
                isEditing={isEditing}
                fieldErrors={state.errors}
              />
              <div className='mt-8'>
                <ProfileTrainingHistory history={trainingHistory} />
              </div>
            </main>

            <aside className='w-full lg:w-64 lg:shrink-0'>
              <ProfileSidebar
                key={`sidebar-${formKey}`}
                member={member}
                trainingHistory={trainingHistory}
                isEditing={isEditing}
                orgHierarchySlot={orgHierarchySlot}
              />
            </aside>
          </div>
        </div>
      </div>
    </form>
  )
}
