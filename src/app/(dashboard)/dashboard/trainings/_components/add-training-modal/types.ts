export interface TrainingFormValues {
  organizationId: string
  name: string
  startDate: string
  endDate: string
  registrationDeadline?: string
  type: 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'
}
