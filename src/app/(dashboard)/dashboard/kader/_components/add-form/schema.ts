import { z } from 'zod'
import {
  refineAb1Certification,
  booleanFormField as booleanSchema
} from '~/lib/validation/member'

/**
 * Ketiga boolean di bawah bukan tiga sumbu bebas — ADR-0001 menetapkan seorang
 * Kader berada pada tepat satu Keadaan, dan Aktif diwakili oleh ketiganya
 * padam. Jadi yang dijaga di sini: paling banyak satu yang menyala.
 */
const keadaanFields = ['isAlumn', 'isNonActive', 'isSuspended'] as const

export const memberSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Nama wajib diisi.'),
    gender: z.enum(['ikhwan', 'akhwat']),
    status: z.enum(['ab1', 'ab2', 'ab3']),
    yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
    organizationId: z.string().uuid(),
    phone: z.string().optional().nullable(),
    photo: z.string().optional().nullable(),
    birthPlace: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    addressProvince: z.string().optional().nullable(),
    addressCity: z.string().optional().nullable(),
    addressDistrict: z.string().optional().nullable(),
    addressSubdistrict: z.string().optional().nullable(),
    addressProvinceCode: z.string().optional().nullable(),
    addressCityCode: z.string().optional().nullable(),
    addressDistrictCode: z.string().optional().nullable(),
    addressSubdistrictCode: z.string().optional().nullable(),
    addressLine: z.string().optional().nullable(),
    isAlumn: booleanSchema.default(false),
    isSuspended: booleanSchema.default(false),
    isNonActive: booleanSchema.default(false),
    isCertifiedMentor: booleanSchema.default(false),
    isCertifiedInstructor: booleanSchema.default(false)
  })
  .superRefine((value, ctx) => {
    const menyala = keadaanFields.filter((field) => value[field])
    if (menyala.length < 2) return

    // Galat ditempelkan ke ketiga field, bukan hanya yang menyala: form
    // menandai lewat `fieldErrors`, dan pengurus perlu melihat ketiganya
    // sebagai satu pilihan yang harus diperbaiki.
    for (const field of keadaanFields) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message:
          'Kader hanya boleh berada pada satu Keadaan — pilih salah satu dari Alumni, Non-Aktif, atau Skorsing.'
      })
    }
  })
  .superRefine(refineAb1Certification)
