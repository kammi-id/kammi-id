import { fetcher } from './fetcher'

type Region = {
  name: string
  code: string
}

type RegionType = 'provinces' | 'regencies' | 'districts' | 'villages'

/**
 * Fetches a single region by its code.
 *
 * @param code - The unique region code.
 * @param type - The type of region ('provinces', 'regencies', 'districts', or 'villages').
 * @returns A promise resolving to a [Error, undefined] or [undefined, Region] tuple.
 */
export const getRegion = async (code: string, type: RegionType) => {
  const path = `${type}/${code}`
  return await fetcher<Region>(path)
}

/**
 * Fetches multiple regions, optionally filtered by parent code or name.
 *
 * Support hierarchical fetching:
 * - If `parentCode` is provided, fetches sub-regions of that parent.
 * - If `name` is provided, filters regions by name.
 *
 * @param type - The type of regions to fetch.
 * @param options - Filtering and pagination options.
 * @param options.parentCode - The code of the parent region to filter by.
 * @param options.name - The name of the region to search for.
 * @param options.page - The page number for pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Region[]] tuple.
 */
export const getRegions = async (
  type: RegionType,
  {
    parentCode,
    name,
    page
  }: { parentCode?: string; name?: string; page?: string } = {}
) => {
  if (parentCode && type !== 'provinces') {
    const parentType: RegionType =
      type === 'villages'
        ? 'districts'
        : type === 'districts'
          ? 'regencies'
          : 'provinces'
    const path = `${parentType}/${parentCode}/${type}`
    return await fetcher<Array<Region>>(path, { name, page })
  }

  return await fetcher<Array<Region>>(type)
}
