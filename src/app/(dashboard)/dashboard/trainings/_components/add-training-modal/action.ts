'use server'

import { z } from 'zod'
import { trainingQuery } from '~/db/query/training'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'

const TrainingSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().refine(
    (date) => {
      const start = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return start >= today
    },
    { message: 'Start date must be in the future or today' }
  ),
  endDate: z.string(),
  registrationDeadline: z.string().optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other'])
})

type ActionResponse<T = any> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}

export const createTrainingAction = async (
  prevState: any,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const { user } = session
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' }

    const mutationRoles = ['root', 'bpk']
    if (!mutationRoles.includes(user.role)) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk menambah dauroh.'
      }
    }

    const rawData = Object.fromEntries(formData.entries())
    const validated = TrainingSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors
      }
    }

    const data = validated.data

    if (new Date(data.endDate) < new Date(data.startDate)) {
      return {
        success: false,
        message: 'End date cannot be before start date',
        errors: { endDate: ['End date cannot be before start date'] }
      }
    }

    if (
      data.registrationDeadline &&
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

    const created = await trainingQuery.create(data)
    revalidatePath('/dashboard/trainings')
    return {
      success: true,
      message: 'Training created successfully',
      data: created
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while creating training'
    }
  }
}
