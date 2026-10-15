import type { KeadaanKader } from '~/lib/kader/keadaan-kader'

export type KartuTandaAnggotaProps = {
  name: string
  registerNumber: string
  photoUrl: string | null
  organizationName: string
  status: string
  yearOfEntry: number
  keadaan: KeadaanKader
}
