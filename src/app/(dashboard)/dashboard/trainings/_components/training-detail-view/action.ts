'use server'

import { z } from 'zod'
import {
  trainingQuery,
  searchEligibleAttendants,
  searchEligibleInstructors,
  type TrainingType
} from '~/db/query/training'
import { member } from '~/db/schema/member.sql'
import { training as trainingTable } from '~/db/schema/training.sql'
import { db } from '~/db/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createMember } from '~/db/query/member'
import { generateRegisterNumber } from '~/lib/utils/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'

const assertCanManage = async (trainingId: string): Promise<string | null> => {
  const session = await readActiveSession()
  if (!session?.user) return 'Sesi tidak ditemukan.'
  const { user } = session

  const [t] = await db
    .select({ organizationId: trainingTable.organizationId })
    .from(trainingTable)
    .where(eq(trainingTable.id, trainingId))
    .limit(1)

  if (!t) return 'Dauroh tidak ditemukan.'

  const allowed = await isOrgInScope(user, t.organizationId)
  if (!allowed)
    return 'Antum tidak memiliki hak akses untuk mengelola dauroh ini.'

  return null
}

const assertCanEditPassing = async (
  trainingId: string
): Promise<string | null> => {
  const manageError = await assertCanManage(trainingId)
  if (manageError) return manageError

  const [t] = await db
    .select({ endDate: trainingTable.endDate })
    .from(trainingTable)
    .where(eq(trainingTable.id, trainingId))
    .limit(1)

  if (!t) return 'Dauroh tidak ditemukan.'

  const endDate = new Date(t.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today <= endDate)
    return 'Kelulusan hanya dapat diubah setelah dauroh selesai.'
  const daysSinceEnd = Math.floor(
    (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceEnd > 30)
    return 'Batas waktu 30 hari setelah dauroh selesai telah terlampaui.'

  return null
}

const UpdateTrainingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other']).optional()
})

const MemberAssignmentSchema = z.object({
  trainingId: z.string().uuid(),
  memberId: z.string().uuid()
})

const InstructorAssignmentSchema = MemberAssignmentSchema.extend({
  role: z.enum([
    'master',
    'assistant_master',
    'administrator',
    'classroom_master',
    'lecturer',
    'observer',
    'ustadz_of_training'
  ])
})

const AttendantStatusSchema = MemberAssignmentSchema.extend({
  isPassing: z.union([z.boolean(), z.string().transform((v) => v === 'true')])
})

type ActionResponse<T = any> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}

export const updateTrainingAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = UpdateTrainingSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const data = validated.data

    if (
      data.startDate &&
      data.endDate &&
      new Date(data.endDate) < new Date(data.startDate)
    ) {
      return {
        success: false,
        message: 'End date cannot be before start date',
        errors: { endDate: ['End date cannot be before start date'] }
      }
    }

    if (
      data.registrationDeadline &&
      data.startDate &&
      new Date(data.registrationDeadline) > new Date(data.startDate)
    ) {
      return {
        success: false,
        message: 'Registration deadline cannot be after start date',
        errors: {
          registrationDeadline: [
            'Registration deadline cannot be after start date'
          ]
        }
      }
    }

    const updated = await trainingQuery.update(data.id, data)
    revalidatePath('/dashboard/trainings')
    return {
      success: true,
      message: 'Training updated successfully',
      data: updated
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while updating training'
    }
  }
}

export const deleteTrainingAction = async (
  id: string
): Promise<ActionResponse> => {
  try {
    await trainingQuery.delete(id)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Training deleted successfully' }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while deleting training'
    }
  }
}

export const addAttendantAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = MemberAssignmentSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const { trainingId, memberId } = validated.data

    const authError = await assertCanManage(trainingId)
    if (authError) return { success: false, message: authError }

    const [memberExists] = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.id, memberId))
      .limit(1)

    if (!memberExists) {
      return { success: false, message: 'Member not found' }
    }

    const data = await trainingQuery.addAttendant(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Attendant added successfully', data }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while adding attendant'
    }
  }
}

export const updateAttendantStatusAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = AttendantStatusSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const { trainingId, memberId, isPassing } = validated.data

    const authError = await assertCanEditPassing(trainingId)
    if (authError) return { success: false, message: authError }

    const data = await trainingQuery.updateAttendantStatus(
      trainingId,
      memberId,
      isPassing as boolean
    )
    revalidatePath('/dashboard/trainings')
    return {
      success: true,
      message: 'Attendant status updated successfully',
      data
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while updating attendant status'
    }
  }
}

export const addInstructorAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = InstructorAssignmentSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const { trainingId, memberId, role } = validated.data

    const authError = await assertCanManage(trainingId)
    if (authError) return { success: false, message: authError }

    const [memberExists] = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.id, memberId))
      .limit(1)

    if (!memberExists) {
      return { success: false, message: 'Member not found' }
    }

    const data = await trainingQuery.addInstructor(trainingId, memberId, role)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Instructor added successfully', data }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while adding instructor'
    }
  }
}

export const removeInstructorAction = async (
  trainingId: string,
  memberId: string
): Promise<ActionResponse> => {
  try {
    const authError = await assertCanManage(trainingId)
    if (authError) return { success: false, message: authError }

    await trainingQuery.removeInstructor(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Instructor removed successfully' }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while removing instructor'
    }
  }
}

export const removeAttendantAction = async (
  trainingId: string,
  memberId: string
): Promise<ActionResponse> => {
  try {
    const authError = await assertCanManage(trainingId)
    if (authError) return { success: false, message: authError }

    await trainingQuery.removeAttendant(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Peserta berhasil dihapus' }
  } catch (error) {
    return {
      success: false,
      message: 'Gagal menghapus peserta'
    }
  }
}

export const searchTrainingAttendantsAction = async (
  trainingId: string,
  trainingType: TrainingType,
  query: string
) => {
  try {
    if (query.length < 2) return { data: [], success: true }
    const data = await searchEligibleAttendants(trainingId, trainingType, query)
    return { data, success: true }
  } catch (error) {
    return { data: [], success: false, message: 'Gagal mencari kader' }
  }
}

export const searchTrainingInstructorsAction = async (
  trainingId: string,
  query: string
) => {
  try {
    if (query.length < 2) return { data: [], success: true }
    const data = await searchEligibleInstructors(trainingId, query)
    return { data, success: true }
  } catch (error) {
    return { data: [], success: false, message: 'Gagal mencari instruktur' }
  }
}

const DM1MemberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z.enum(['ikhwan', 'akhwat']),
  yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
  organizationId: z.string().uuid(),
  phone: z.string().optional().nullable(),
  addressProvince: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressSubdistrict: z.string().optional().nullable(),
  addressProvinceCode: z.string().optional().nullable(),
  addressCityCode: z.string().optional().nullable(),
  addressDistrictCode: z.string().optional().nullable(),
  addressSubdistrictCode: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable()
})

export const addDM1AttendantAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const trainingId = formData.get('trainingId') as string
    if (!trainingId)
      return { success: false, message: 'Training ID tidak ditemukan' }

    const authError = await assertCanManage(trainingId)
    if (authError) return { success: false, message: authError }

    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Tidak terautentikasi' }

    const rawData = Object.fromEntries(formData.entries())
    const validated = DM1MemberSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const { organizationId, yearOfEntry } = validated.data
    const registerNumber = await generateRegisterNumber(
      organizationId,
      yearOfEntry
    )

    const [newMember] = await createMember({
      ...validated.data,
      registerNumber,
      status: 'ab1',
      isAlumn: false,
      isSuspended: false,
      isNonActive: false,
      isCertifiedMentor: false,
      isCertifiedInstructor: false
    })

    if (!newMember)
      return { success: false, message: 'Gagal membuat kader baru' }

    await trainingQuery.addAttendant(trainingId, newMember.id)
    revalidatePath('/dashboard/trainings')

    return {
      success: true,
      message: `Kader baru "${validated.data.name}" berhasil ditambahkan sebagai peserta DM1`
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Gagal menambahkan peserta DM1'
    }
  }
}
