'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readMember, updateMember } from '~/db/query/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { requireMemberEditAccess } from '~/lib/auth/kaderisasi'
import { memberSelfEditSchema, memberManagedSchema } from './schema'

export type ProfileEditState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const DENIED = 'Akses ditolak.'

export const updateMemberProfileAction = async (
  memberId: string,
  prevState: ProfileEditState,
  formData: FormData
): Promise<ProfileEditState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }

  const [target] = await readMember({ id: [memberId] })
  if (!target) return { success: false, message: DENIED }

  const canEdit = await requireMemberEditAccess(memberId, target.organizationId)
  if (!canEdit) return { success: false, message: DENIED }

  // ADR 0027 — skema dipilih dari peran si pemanggil, bukan dari isi
  // FormData: seorang `member` hanya pernah menemui `memberSelfEditSchema`,
  // sehingga kolom Jenjang Kaderisasi, Keadaan Kader, dan sertifikasi
  // Perangkat tidak pernah lolos parse baginya, sekalipun sebuah POST rakitan
  // tangan membawanya.
  const schema =
    session.user.role === 'member' ? memberSelfEditSchema : memberManagedSchema

  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse(raw)

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

  const [target] = await readMember({ id: [memberId] })
  if (!target) throw new Error(DENIED)

  const canEdit = await requireMemberEditAccess(memberId, target.organizationId)
  if (!canEdit) throw new Error(DENIED)

  await updateMember({ photo: photoPath }, memberId)
  updateTag('kader')
  revalidatePath(`/dashboard/profile`)
}
