import type { KeadaanKader } from '~/lib/kader/keadaan-kader'
import type { TrainingType } from '~/db/query/training'

export type MemberDashboardSummaryProps = {
  registerNumber: string
  orgChain: Array<{ id: string; name: string; type: string }>
  status: string
  yearOfEntry: number
  keadaan: KeadaanKader
  trainingHistory: Array<{
    id: string
    name: string
    type: TrainingType
    year: number
    isPassing: boolean
    organizationName: string | null
  }>
  isCertifiedMentor: boolean
  isCertifiedInstructor: boolean
}
