import { fetcher } from './fetcher'

type University = {
  group: string
  address: string
  name: string
  shortName: string
  province: string
  provinceCode: string
  regency: string
  regencyCode: string
  long: number
  lat: number
  universityType: string
}

/**
 * Fetches a list of universities based on provided filters.
 *
 * Supports filtering by geographical location (province, regency) and university attributes.
 * Filter keys are automatically converted to snake_case for the API request.
 *
 * @param filters - Filtering and pagination options.
 * @param filters.provinceCode - Filter by province code.
 * @param filters.regencyCode - Filter by regency code.
 * @param filters.name - Search by university name (supports partial match).
 * @param filters.group - Filter by university group (e.g., 'UNIVERSITAS').
 * @param filters.universityType - Filter by type (e.g., 'PERGURUAN TINGGI').
 * @param filters.page - Page number for pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, University[]] tuple.
 */
export const getUniversities = async ({
  provinceCode,
  regencyCode,
  name,
  group,
  universityType,
  page
}: {
  provinceCode?: string
  regencyCode?: string
  name?: string
  group?: string
  universityType?: string
  page?: string
} = {}) => {
  return await fetcher<Array<University>>('universities', {
    provinceCode,
    regencyCode,
    name,
    group,
    universityType,
    page
  })
}
