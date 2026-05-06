'use server'

import { z } from 'zod'
import { trainingQuery } from '@/db/query/training'
import { member } from '@/db/schema/member.sql'
import { db } from '@/db/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const UpdateTrainingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other']).optional(),
})

const MemberAssignmentSchema = z.object({
  trainingId: z.string().uuid(),
  memberId: z.string().uuid(),
})

const InstructorAssignmentSchema = MemberAssignmentSchema.extend({
  role: z.enum(['master', 'assistant_master', 'administrator', 'classroom_master', 'lecturer', 'observer', 'ustadz_of_training']),
})

const AttendantStatusSchema = MemberAssignmentSchema.extend({
  isPassing: z.boolean(),
})

type ActionResponse<T = any> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}

export const updateTrainingAction = async (prevState: any, formData: FormData): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = UpdateTrainingSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const data = validated.data

    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      return {
        success: false,
        message: 'End date cannot be before start date',
        errors: { endDate: ['End date cannot be before start date'] },
      }
    }

    if (data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) > new Date(data.startDate)) {
      return {
        success: false,
        message: 'Registration deadline cannot be after start date',
        errors: { registrationDeadline: ['Registration deadline cannot be after start date'] },
      }
    }

    const updated = await trainingQuery.update(data.id, data)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Training updated successfully', data: updated }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while updating training' }
  }
}

export const deleteTrainingAction = async (id: string): Promise<ActionResponse> => {
  try {
    await trainingQuery.delete(id)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Training deleted successfully' }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while deleting training' }
  }
}

export const addAttendantAction = async (prevState: any, formData: FormData): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = MemberAssignmentSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { trainingId, memberId } = validated.data

    const memberExists = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    })

    if (!memberExists) {
      return { success: false, message: 'Member not found' }
    }

    const data = await trainingQuery.addAttendant(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Attendant added successfully', data }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while adding attendant' }
  }
}

export const updateAttendantStatusAction = async (prevState: any, formData: FormData): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = AttendantStatusSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { trainingId, memberId, isPassing } = validated.data
    const data = await trainingQuery.updateAttendantStatus(trainingId, memberId, isPassing === 'true')
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Attendant status updated successfully', data }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while updating attendant status' }
  }
}

export const removeAttendantAction = async (trainingId: string, memberId: string): Promise<ActionResponse> => {
  try {
    await trainingQuery.removeAttendant(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Attendant removed successfully' }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while removing attendant' }
  }
}

export const addInstructorAction = async (prevState: any, formData: FormData): Promise<ActionResponse> => {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = InstructorAssignmentSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { trainingId, memberId, role } = validated.data

    const memberExists = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    })

    if (!memberExists) {
      return { success: false, message: 'Member not found' }
    }

    const data = await trainingQuery.addInstructor(trainingId, memberId, role)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Instructor added successfully', data }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while adding instructor' }
  }
}

export const removeInstructorAction = async (trainingId: string, memberId: string): Promise<ActionResponse> => {
  try {
    await trainingQuery.removeInstructor(trainingId, memberId)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Instructor removed successfully' }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while removing instructor' }
  }
}
