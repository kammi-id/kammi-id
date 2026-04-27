'use server'

import { z } from 'zod'
import { trainingQuery } from '@/db/query/training'
import { revalidatePath } from 'next/cache'

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

type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
}

export const createTrainingAction = async (formData: unknown): Promise<ActionResponse> => {
  try {
    const validated = TrainingSchema.parse(formData)

    if (new Date(validated.endDate) < new Date(validated.startDate)) {
      return { success: false, message: 'End date cannot be before start date' }
    }

    if (validated.registrationDeadline && new Date(validated.registrationDeadline) > new Date(validated.startDate)) {
      return { success: false, message: 'Registration deadline cannot be after start date' }
    }

    const data = await trainingQuery.create(validated)
    revalidatePath('/dashboard/trainings')
    return { success: true, message: 'Training created successfully', data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message }
    }
    return { success: false, message: 'An unexpected error occurred while creating training' }
  }
}
