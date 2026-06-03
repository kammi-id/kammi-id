'use client'

import { createContext, use } from 'react'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'
import type { MemberAcademic } from '~/db/query/academic'
import type { MemberCareer } from '~/db/query/career'
import type { MemberOrganizationHistory } from '~/db/query/organization-history'

interface ProfileEditContextValue {
  member: Member
  trainingHistory: MemberTrainingHistory
  academicHistory: MemberAcademic[]
  careerHistory: MemberCareer[]
  organizationHistory: MemberOrganizationHistory[]
  canEdit: boolean
  isEditing: boolean
  isPending: boolean
  fieldErrors?: Record<string, string[]>
}

const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

export const ProfileEditProvider = ProfileEditContext.Provider

export const useProfileEdit = (): ProfileEditContextValue => {
  const ctx = use(ProfileEditContext)
  if (!ctx)
    throw new Error('useProfileEdit must be used within ProfileEditProvider')
  return ctx
}
