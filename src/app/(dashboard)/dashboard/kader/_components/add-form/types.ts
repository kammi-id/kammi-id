import type { RegionItem } from '~/lib/api/region'

export type MemberType = 'individual' | 'organization'

/**
 * State for region-related data (provinces, cities, districts, and villages).

 */
export interface RegionDataState {
  provinces: RegionItem[]
  cities: RegionItem[]
  districts: RegionItem[]
  subdistricts: RegionItem[]
}

/**
 * State for region loading indicators.
 */
export interface RegionLoadingState {
  province: boolean
  city: boolean
  district: boolean
  subdistrict: boolean
}

/**
 * Properties for the AddMemberForm component.
 */
export interface AddMemberFormProps {
  organizationId: string
  organizations: { id: string; name: string; type: string; parentId?: string }[]
}
