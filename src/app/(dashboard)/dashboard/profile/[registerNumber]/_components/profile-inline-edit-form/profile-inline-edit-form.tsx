'use client'

import { useActionState, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PencilEdit01Icon,
  FloppyDiskIcon,
  Cancel01Icon
} from '@hugeicons/core-free-icons'
import { updateMemberProfileAction } from '../action'
import { ProfileEditProvider } from '../profile-edit-context'
import { ProfileHeader } from '../profile-header'
import { ProfileInfo } from '../profile-info'
import { ProfileSidebar } from '../profile-sidebar'
import { AcademicSection } from '../academic-section'
import { CareerSection } from '../career-section'
import { OrganizationSection } from '../organization-section'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'
import type { MemberAcademic } from '~/db/query/academic'
import type { MemberCareer } from '~/db/query/career'
import type { MemberOrganizationHistory } from '~/db/query/organization-history'

interface ProfileInlineEditFormProps {
  member: Member
  canEdit: boolean
  trainingHistory: MemberTrainingHistory
  academicHistory: MemberAcademic[]
  careerHistory: MemberCareer[]
  organizationHistory: MemberOrganizationHistory[]
  orgHierarchySlot?: ReactNode
  adminActionsSlot?: ReactNode
  dangerZoneSlot?: ReactNode
}

export const ProfileInlineEditForm = ({
  member,
  canEdit,
  trainingHistory,
  academicHistory,
  careerHistory,
  organizationHistory,
  orgHierarchySlot,
  adminActionsSlot,
  dangerZoneSlot
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
    <ProfileEditProvider
      value={{
        member,
        trainingHistory,
        academicHistory,
        careerHistory,
        organizationHistory,
        canEdit,
        isEditing,
        isPending,
        fieldErrors: state.errors
      }}
    >
      <form id='profile-edit-form' action={formAction}>
        <ProfileHeader
          editSlot={editSlot}
          editActionsSlot={editActionsSlot}
          adminActionsSlot={adminActionsSlot}
        />

        <div className='px-6 py-8'>
          <div className='mx-auto max-w-5xl'>
            <div className='flex flex-col gap-8 lg:flex-row lg:gap-10'>
              <main className='min-w-0 flex-1'>
                <ProfileInfo key={`info-${formKey}`} />
                <div className='mt-8'>
                  <AcademicSection />
                </div>
                <div className='mt-8'>
                  <CareerSection />
                </div>
                <div className='mt-8'>
                  <OrganizationSection />
                </div>
                {dangerZoneSlot && (
                  <div className='border-destructive/30 bg-destructive/5 mt-8 rounded-2xl border p-4'>
                    <h3 className='text-destructive text-sm font-semibold'>
                      Zona Berbahaya
                    </h3>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Tindakan di bawah ini bersifat permanen dan tidak dapat
                      dibatalkan.
                    </p>
                    <div className='mt-3'>{dangerZoneSlot}</div>
                  </div>
                )}
              </main>

              <aside className='w-full lg:w-64 lg:shrink-0'>
                <ProfileSidebar
                  key={`sidebar-${formKey}`}
                  orgHierarchySlot={orgHierarchySlot}
                />
              </aside>
            </div>
          </div>
        </div>
      </form>
    </ProfileEditProvider>
  )
}
