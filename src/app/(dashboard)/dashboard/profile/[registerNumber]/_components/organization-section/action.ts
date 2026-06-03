'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  createMemberOrganizationHistory,
  updateMemberOrganizationHistory,
  deleteMemberOrganizationHistory
} from '~/db/query/organization-history'

export type OrgHistoryActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const orgHistorySchema = z.object({
  id: z.string().uuid().optional(),
  position: z.string().min(1, 'Jabatan wajib diisi.'),
  organization: z.string().min(1, 'Nama organisasi wajib diisi.'),
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

export const saveOrgHistoryAction = async (
  memberId: string,
  prevState: OrgHistoryActionState,
  formData: FormData
): Promise<OrgHistoryActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = orgHistorySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberOrganizationHistory(data, id, memberId)
  } else {
    await createMemberOrganizationHistory(data, memberId)
  }

  revalidatePath('/dashboard/profile')
  return {
    success: true,
    message: id ? 'Riwayat organisasi diperbarui.' : 'Riwayat organisasi ditambahkan.'
  }
}

export const deleteOrgHistoryAction = async (
  memberId: string,
  id: string
): Promise<OrgHistoryActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  await deleteMemberOrganizationHistory(id, memberId)
  revalidatePath('/dashboard/profile')
  return { success: true, message: 'Riwayat organisasi dihapus.' }
}
