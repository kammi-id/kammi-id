interface RegionItem {
  code: string
  name: string
}

interface RegionApiResponse<T> {
  data: T
  is_success: boolean
  message: string
}

const BASE_URL = 'https://use.api.co.id'

const fetchRegionData = async <T>(endpoint: string): Promise<T> => {
  const token = process.env.API_CO_ID_TOKEN

  if (!token) {
    throw new Error('API_CO_ID_TOKEN is missing from environment variables')
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-api-co-id': token,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(
      `Region API error: ${response.status} ${response.statusText}`
    )
  }

  try {
    const result = (await response.json()) as RegionApiResponse<T>
    if (!result.is_success) {
      throw new Error(result.message || 'API returned is_success: false')
    }
    return result.data
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response from Region API: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const regionApi = {
  async getProvinces(): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>('/regional/indonesia/provinces')
  },

  async getCities(provinceCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/provinces/${provinceCode}/regencies`
    )
  },

  async getDistricts(cityCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/regencies/${cityCode}/districts`
    )
  },

  async getVillages(districtCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/districts/${districtCode}/villages`
    )
  }
}
