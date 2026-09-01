'use server'

import { z } from 'zod'
import {
  trainingQuery,
  searchEligibleInstructorsByType,
  type TrainingType
} from '~/db/query/training'
import { revalidatePath, updateTag } from 'next/cache'
import { type SessionUser } from '~/lib/auth/cookies'
import { requireDaurahCreationAccess } from '~/lib/auth/daurah'
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'training'])

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
  registrationDeadline: z
    .string()
    .transform((v) => v || undefined)
    .optional(),
  registrationStartDate: z
    .string()
    .transform((v) => v || undefined)
    .optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other']),
  masterId: z.string().min(1, 'Master of Training wajib diisi')
})

type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
  values?: Record<string, string>
}

export const searchMasterCandidatesAction = async (
  query: string,
  trainingType: TrainingType
) => {
  try {
    // Gate mendahului pintasan `query.length < 2`: aksi ini endpoint POST
    // tersendiri, jadi tidak boleh mengandalkan form yang sudah menyaring di
    // sisi klien.
    const access = await requireDaurahCreationAccess()
    if (!access.allowed)
      return { data: [], success: false, message: access.message }

    if (query.length < 2) return { data: [], success: true }

    const data = await searchEligibleInstructorsByType(trainingType, query)
    return { data, success: true }
  } catch {
    return { data: [], success: false }
  }
}

export const createTrainingAction = async (
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> => {
  let user: SessionUser | undefined
  let rawData: Record<string, FormDataEntryValue> | undefined

  try {
    const access = await requireDaurahCreationAccess()
    if (!access.allowed) return { success: false, message: access.message }

    user = access.user

    rawData = Object.fromEntries(formData.entries())
    const validated = TrainingSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
        values: Object.fromEntries(
          Object.entries(rawData).filter(([, v]) => v != null)
        ) as Record<string, string>
      }
    }

    const data = validated.data

    if (new Date(data.endDate) < new Date(data.startDate)) {
      return {
        success: false,
        message: 'End date cannot be before start date',
        errors: { endDate: ['End date cannot be before start date'] },
        values: Object.fromEntries(
          Object.entries(rawData).filter(
            ([, v]) => v != null && typeof v === 'string'
          )
        ) as Record<string, string>
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
        },
        values: Object.fromEntries(
          Object.entries(rawData).filter(
            ([, v]) => v != null && typeof v === 'string'
          )
        ) as Record<string, string>
      }
    }

    if (
      data.registrationStartDate &&
      data.registrationDeadline &&
      new Date(data.registrationStartDate) > new Date(data.registrationDeadline)
    ) {
      return {
        success: false,
        message:
          'Registration start date cannot be after registration deadline',
        errors: {
          registrationStartDate: [
            'Registration start date cannot be after registration deadline'
          ]
        },
        values: Object.fromEntries(
          Object.entries(rawData).filter(
            ([, v]) => v != null && typeof v === 'string'
          )
        ) as Record<string, string>
      }
    }

    if (
      data.registrationStartDate &&
      new Date(data.registrationStartDate) > new Date(data.startDate)
    ) {
      return {
        success: false,
        message: 'Registration start date cannot be after start date',
        errors: {
          registrationStartDate: [
            'Registration start date cannot be after start date'
          ]
        },
        values: Object.fromEntries(
          Object.entries(rawData).filter(
            ([, v]) => v != null && typeof v === 'string'
          )
        ) as Record<string, string>
      }
    }

    const created = await trainingQuery.create(data)

    await trainingQuery.addInstructor(created.id, data.masterId, 'master')

    updateTag('dauroh')
    revalidatePath('/dashboard/trainings')

    logger.info('Daurah dibuat', {
      actorId: user.id,
      actorRole: user.role,
      trainingId: created.id,
      masterId: data.masterId
    })

    return {
      success: true,
      message: 'Training created successfully',
      data: created
    }
  } catch (error) {
    logger.error('Gagal membuat daurah: {error}', {
      error,
      actorId: user?.id,
      input: redact(rawData ?? {})
    })
    return {
      success: false,
      message: 'An unexpected error occurred while creating training'
    }
  }
}
