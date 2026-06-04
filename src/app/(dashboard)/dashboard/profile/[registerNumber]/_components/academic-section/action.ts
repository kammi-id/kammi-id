'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  createMemberAcademic,
  updateMemberAcademic,
  deleteMemberAcademic
} from '~/db/query/academic'

export type AcademicActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const degreeEnum = [
  'd1',
  'd2',
  'd3',
  'd4',
  's1',
  's2',
  's3',
  'profesi'
] as const

const academicSchema = z.object({
  id: z.string().uuid().optional(),
  degree: z.enum(degreeEnum),
  studyProgram: z.string().min(1, 'Program studi wajib diisi.'),
  institutionName: z.string().min(1, 'Institusi wajib diisi.'),
  institutionData: z
    .string()
    .min(1, 'Data institusi wajib diisi.')
    .transform((val, ctx) => {
      try {
        return JSON.parse(val) as Record<string, unknown>
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data institusi tidak valid.'
        })
        return z.NEVER
      }
    }),
  yearStart: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  yearEnd: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z.coerce
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 10)
      .nullable()
  ),
  isGraduated: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
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

export const saveAcademicAction = async (
  memberId: string,
  prevState: AcademicActionState,
  formData: FormData
): Promise<AcademicActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId))
    return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = academicSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberAcademic(data, id, memberId)
  } else {
    await createMemberAcademic(data, memberId)
  }

  revalidatePath('/dashboard/profile')
  return {
    success: true,
    message: id ? 'Data akademik diperbarui.' : 'Data akademik ditambahkan.'
  }
}

export const deleteAcademicAction = async (
  memberId: string,
  id: string
): Promise<AcademicActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId))
    return { success: false, message: 'Akses ditolak.' }

  await deleteMemberAcademic(id, memberId)
  revalidatePath('/dashboard/profile')
  return { success: true, message: 'Data akademik dihapus.' }
}
