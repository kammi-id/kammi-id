import type { TrainingType, InstructorRole } from '~/db/query/training'

/**
 * Jenis Daurah label, `CONTEXT.md` wording. Copy-pasted across five
 * component files before this module existed — `dm1: 'DM 1'` etc., always
 * identical, always redefined locally.
 */
const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dm3: 'DM 3',
  dpmk: 'DPMK',
  tfi: 'TFI',
  other: 'Lainnya'
}

const isTrainingType = (value: string): value is TrainingType =>
  value in TRAINING_TYPE_LABELS

/**
 * Human-facing Jenis Daurah label. Unmapped values fall back to the raw
 * code, uppercased — a safety net, not a translation.
 */
export const trainingTypeLabel = (type: string): string =>
  isTrainingType(type) ? TRAINING_TYPE_LABELS[type] : type.toUpperCase()

/** Peran Instruktur label, held by a member on a Daurah's instructor roll. */
const INSTRUCTOR_ROLE_LABELS: Record<InstructorRole, string> = {
  master: 'Master of Training',
  assistant_master: 'Assistant Master of Training',
  administrator: 'Admin Daurah',
  classroom_master: 'Master of Classroom',
  lecturer: 'Instruktur Materi',
  observer: 'Observer',
  ustadz_of_training: 'Ustadz Daurah'
}

const isInstructorRole = (value: string): value is InstructorRole =>
  value in INSTRUCTOR_ROLE_LABELS

/**
 * Human-facing Peran Instruktur label. Unmapped values fall back to the raw
 * code, uppercased — a safety net, not a translation.
 */
export const instructorRoleLabel = (role: string): string =>
  isInstructorRole(role) ? INSTRUCTOR_ROLE_LABELS[role] : role.toUpperCase()
