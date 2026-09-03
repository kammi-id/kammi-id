import { z, type RefinementCtx } from 'zod'

/**
 * `FormData` entries arrive as strings, never real booleans — every checkbox
 * in the Kader forms (add-form's `memberSchema`, profile's `profileSchema`)
 * needs this exact coercion, so it lives here once rather than as two copies
 * that can drift on case-sensitivity the way they already had.
 */
export const booleanFormField = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true
    if (val.toLowerCase() === 'false') return false
  }
  return val
}, z.boolean())

interface Ab1CertificationFields {
  status: string
  isCertifiedMentor?: boolean
  isCertifiedInstructor?: boolean
}

const AB1_CERTIFICATION_FIELDS = [
  'isCertifiedMentor',
  'isCertifiedInstructor'
] as const

const AB1_CERTIFICATION_MESSAGE =
  'Anggota Biasa I tidak dapat memegang Perangkat Pengkaderan (Pemandu/Instruktur).'

/**
 * Aturan organisasi: AB1 tidak pernah memegang Perangkat Pengkaderan
 * (Pemandu maupun Instruktur). Satu predikat dipakai lewat dua schema
 * (`memberSchema` di add-form, `profileSchema` di profil) supaya keduanya
 * tidak bisa diam-diam berbeda aturan.
 */
export const isAb1WithCertification = (
  value: Ab1CertificationFields
): boolean =>
  value.status === 'ab1' &&
  Boolean(value.isCertifiedMentor || value.isCertifiedInstructor)

/**
 * Wrapper `.superRefine`-compatible: tempelkan galat ke kedua field
 * sertifikasi supaya form bisa menandai keduanya, meniru pola galat
 * Keadaan yang sudah ada di `memberSchema`.
 */
export const refineAb1Certification = <T extends Ab1CertificationFields>(
  value: T,
  ctx: RefinementCtx
): void => {
  if (!isAb1WithCertification(value)) return

  for (const field of AB1_CERTIFICATION_FIELDS) {
    ctx.addIssue({
      code: 'custom',
      path: [field],
      message: AB1_CERTIFICATION_MESSAGE
    })
  }
}
