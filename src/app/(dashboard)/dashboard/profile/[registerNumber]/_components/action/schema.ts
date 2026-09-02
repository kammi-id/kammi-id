import { z } from 'zod'
import {
  refineAb1Certification,
  booleanFormField as booleanField
} from '~/lib/validation/member'

export const profileSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    gender: z.enum(['ikhwan', 'akhwat']),
    status: z.enum(['ab1', 'ab2', 'ab3']),
    yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
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
    isAlumn: booleanField.default(false),
    isSuspended: booleanField.default(false),
    isNonActive: booleanField.default(false),
    isCertifiedMentor: booleanField.default(false),
    isCertifiedInstructor: booleanField.default(false)
  })
  .superRefine(refineAb1Certification)
