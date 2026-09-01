import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'

/** One card's worth of Struktur + Kader-count data, as `MembersGrid` renders it. */
export type MemberBranchData = Organization & {
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  total: number
  pemandu?: number
  instruktur?: number
}
