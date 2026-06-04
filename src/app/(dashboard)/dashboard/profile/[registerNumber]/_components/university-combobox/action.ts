'use server'

import { universityApi, type UniversityItem } from '~/lib/api/university'

export type FetchUniversitiesResult =
  | { success: true; data: UniversityItem[] }
  | { success: false; message: string }

export const fetchUniversitiesAction = async (
  name: string
): Promise<FetchUniversitiesResult> => {
  try {
    const data = await universityApi.search(name)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal memuat data universitas.'
    }
  }
}
