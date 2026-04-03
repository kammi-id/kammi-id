'use server'

import { createTraining, updateTraining } from '~/db/mutations/training'
import authorizeSessionAction from '../../../../_actions/authorize'
import { updateTag } from 'next/cache'
import z from 'zod'

const trainingSchema = z
  .object({
    name: z.string().min(1, 'Nama dauroh wajib diisi.'),
    type: z.enum(['dm1', 'dm2', 'dm3', 'dpmk', 'tfi', 'other'], {
      message: 'Jenis dauroh tidak valid.'
    }),
    dateStart: z.coerce.date({ message: 'Tanggal mulai wajib diisi.' }),
    dateEnd: z.coerce.date({ message: 'Tanggal selesai wajib diisi.' }),
    registrationUntil: z.coerce.date().optional(),
    organizerId: z.uuidv7('Organizer tidak valid.')
  })
  .superRefine((data, ctx) => {
    if (data.dateStart && data.dateEnd && data.dateEnd < data.dateStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateEnd'],
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
      })
    }
    if (
      data.dateStart &&
      data.registrationUntil &&
      data.registrationUntil > data.dateStart
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['registrationUntil'],
        message: 'Pendaftaran tidak boleh ditutup setelah tanggal mulai dauroh.'
      })
    }
  })

type TrainingActionState =
  | {
      errors: z.core.$ZodIssue[]
      inputs: z.input<typeof trainingSchema>
      success?: undefined
    }
  | {
      errors?: undefined
      inputs?: undefined
      success: true
    }

export const trainingAction = async (
  _state: TrainingActionState | undefined,
  formData: FormData
): Promise<TrainingActionState> => {
  const inputs = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    dateStart: formData.get('dateStart') as string,
    dateEnd: formData.get('dateEnd') as string,
    registrationUntil: formData.get('registrationUntil') || undefined,
    organizerId: formData.get('organizerId') as string
  } as z.input<typeof trainingSchema>

  const auth = await authorizeSessionAction(['bpk'])
  if (!auth.authorized) {
    return {
      errors: [auth.error],
      inputs
    }
  }

  const id = formData.get('id') as string | null

  if (id) {
    const idValidation = z.uuidv7('ID dauroh tidak valid.').safeParse(id)
    if (!idValidation.success) {
      return {
        errors: idValidation.error.issues,
        inputs
      }
    }

    const validated = trainingSchema.partial().safeParse(inputs)
    if (!validated.success) {
      return {
        errors: validated.error.issues,
        inputs
      }
    }

    const [error] = await updateTraining(idValidation.data, validated.data)
    if (error) {
      return {
        errors: [
          {
            code: 'custom',
            path: [],
            message: error.message
          }
        ],
        inputs
      }
    }

    updateTag(`training:id:${idValidation.data}`)

    return { success: true }
  }

  const validated = trainingSchema.safeParse(inputs)
  if (!validated.success) {
    return {
      errors: validated.error.issues,
      inputs
    }
  }

  const [error] = await createTraining([validated.data])
  if (error) {
    return {
      errors: [
        {
          code: 'custom',
          path: [],
          message: error.message
        }
      ],
      inputs
    }
  }

  updateTag('training')
  updateTag(`training:organizer:${validated.data.organizerId}`)

  return { success: true }
}
