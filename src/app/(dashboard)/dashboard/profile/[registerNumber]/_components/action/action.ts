'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { updateMember } from '~/db/query/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { profileSchema } from './schema'

export type ProfileEditState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const canEditMember = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
): boolean => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const updateMemberProfileAction = async (
  memberId: string,
  prevState: ProfileEditState,
  formData: FormData
): Promise<ProfileEditState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEditMember(session, memberId)) {
    return { success: false, message: 'Akses ditolak.' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = profileSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  await updateMember(parsed.data, memberId)
  updateTag('kader')
  revalidatePath(`/dashboard/profile`)

  return { success: true, message: 'Data berhasil diperbarui.' }
}

export const updateMemberPhotoAction = async (
  memberId: string,
  photoPath: string
): Promise<void> => {
  const session = await readActiveSession()
  if (!session) throw new Error('Tidak terautentikasi.')
  if (!canEditMember(session, memberId)) throw new Error('Akses ditolak.')

  await updateMember({ photo: photoPath }, memberId)
  updateTag('kader')
  revalidatePath(`/dashboard/profile`)
}
