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
  data?: T
}

export const updateTrainingAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const validated = UpdateTrainingSchema.parse(formData)

    if (validated.startDate && validated.endDate && new Date(validated.endDate) < new Date(validated.startDate)) {
      return { success: false, message: 'End date cannot be before start date' }
    }

    if (validated.registrationDeadline && validated.startDate && new Date(validated.registrationDeadline) > new Date(validated.startDate)) {
      return { success: false, message: 'Registration deadline cannot be after start date' }
    }

    const data = await trainingQuery.update(validated.id, validated)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Training updated successfully', data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
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

export const addAttendantAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const { trainingId, memberId } = MemberAssignmentSchema.parse(formData)

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
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
    return { success: false, message: 'An unexpected error occurred while adding attendant' }
  }
}

export const updateAttendantStatusAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const { trainingId, memberId, isPassing } = AttendantStatusSchema.parse(formData)
    const data = await trainingQuery.updateAttendantStatus(trainingId, memberId, isPassing)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Attendant status updated successfully', data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
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

export const addInstructorAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const { trainingId, memberId, role } = InstructorAssignmentSchema.parse(formData)

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
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
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
