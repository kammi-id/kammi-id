export interface UniversityItem {
  group: string
  address: string
  name: string
  short_name: string
  province: string
  province_code: string
  regency: string
  regency_code: string
  long: number
  lat: number
  university_type: string
}

interface UniversityApiResponse {
  data: UniversityItem[]
  is_success: boolean
  message: string
}

const BASE_URL = 'https://use.api.co.id'

export const universityApi = {
  async search(name: string): Promise<UniversityItem[]> {
    const token = process.env.API_CO_ID_TOKEN
    if (!token) throw new Error('API_CO_ID_TOKEN is missing')

    const url = `${BASE_URL}/regional/indonesia/universities?name=${encodeURIComponent(name)}`
    const response = await fetch(url, {
      headers: {
        'x-api-co-id': token,
        'Content-Type': 'application/json'
      },
      cache: 'force-cache',
      next: { revalidate: 86400 }
    })

    if (!response.ok) {
      throw new Error(`University API error: ${response.status} ${response.statusText}`)
    }

    try {
      const result = (await response.json()) as UniversityApiResponse
      if (!result.is_success) {
        throw new Error(result.message || 'API returned is_success: false')
      }
      return result.data
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response from University API: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
