'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { createMemberCareer, updateMemberCareer, deleteMemberCareer } from '~/db/query/career'

export type CareerActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const careerSchema = z.object({
  id: z.string().uuid().optional(),
  profession: z.string().min(1, 'Profesi wajib diisi.'),
  company: z.string().min(1, 'Perusahaan wajib diisi.'),
  yearStart: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  yearEnd: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).nullable()
  )
})

const canEdit = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
) => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const saveCareerAction = async (
  memberId: string,
  prevState: CareerActionState,
  formData: FormData
): Promise<CareerActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = careerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberCareer(data, id, memberId)
  } else {
    await createMemberCareer(data, memberId)
  }

  revalidatePath('/dashboard/profile')
  return { success: true, message: id ? 'Riwayat karir diperbarui.' : 'Riwayat karir ditambahkan.' }
}

export const deleteCareerAction = async (
  memberId: string,
  id: string
): Promise<CareerActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  await deleteMemberCareer(id, memberId)
  revalidatePath('/dashboard/profile')
  return { success: true, message: 'Riwayat karir dihapus.' }
}
