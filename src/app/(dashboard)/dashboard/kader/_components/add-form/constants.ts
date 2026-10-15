import type { RegionDataState, RegionLoadingState } from './types'

/**
 * Initial state for the region data.
 */
export const INITIAL_REGION_DATA: RegionDataState = {
  provinces: [],
  cities: [],
  districts: [],
  subdistricts: []
}

/**
 * Initial state for the region loading indicators.
 */
export const INITIAL_LOADING_STATE: RegionLoadingState = {
  province: false,
  city: false,
  district: false,
  subdistrict: false
}
