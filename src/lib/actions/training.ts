'use server'

import { z } from 'zod'
import { trainingQuery } from '@/db/query/training'
import { member } from '@/db/schema/member.sql'
import { db } from '@/db/db'
import { eq } from 'drizzle-orm'

// --- Validation Schemas ---

const TrainingSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().refine((date) => {
    const start = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return start >= today
  }, { message: 'Start date must be in the future or today' }),
  endDate: z.string(),
  registrationDeadline: z.string().optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other']),
})

const UpdateTrainingSchema = TrainingSchema.partial().extend({
  id: z.string().uuid(),
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

// --- Action Response Type ---

type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
}

// --- Actions ---

export const createTrainingAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const validated = TrainingSchema.parse(formData)

    // Additional date logic: endDate >= startDate
    if (new Date(validated.endDate) < new Date(validated.startDate)) {
      return { success: false, message: 'End date cannot be before start date' }
    }

    // Additional date logic: registrationDeadline <= startDate
    if (validated.registrationDeadline && new Date(validated.registrationDeadline) > new Date(validated.startDate)) {
      return { success: false, message: 'Registration deadline cannot be after start date' }
    }

    const data = await trainingQuery.create(validated)
    return { success: true, message: 'Training created successfully', data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
    return { success: false, message: 'An unexpected error occurred while creating training' }
  }
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
    return { success: true, message: 'Instructor removed successfully' }
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred while removing instructor' }
  }
}
