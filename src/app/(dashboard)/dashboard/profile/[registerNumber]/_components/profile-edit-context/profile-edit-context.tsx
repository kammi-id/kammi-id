'use client'

import { createContext, use } from 'react'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'

interface ProfileEditContextValue {
  member: Member
  trainingHistory: MemberTrainingHistory
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
