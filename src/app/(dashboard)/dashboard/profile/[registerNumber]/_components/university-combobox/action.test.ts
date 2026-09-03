import { describe, it, expect, mock } from 'bun:test'
import type { UniversityItem } from '~/lib/api/university'

const searchMock = mock(async (_name: string): Promise<UniversityItem[]> => [])

mock.module('~/lib/api/university', () => ({
  universityApi: { search: searchMock }
}))

const { fetchUniversitiesAction } = await import('./action')

const sampleUniversity: UniversityItem = {
  group: 'PTN',
  address: 'Jl. Veteran No. 1',
  name: 'Universitas Brawijaya',
  short_name: 'UB',
  province: 'Jawa Timur',
  province_code: '35',
  regency: 'Kota Malang',
  regency_code: '3573',
  long: 112.617,
  lat: -7.953,
  university_type: 'negeri'
}

describe('fetchUniversitiesAction', () => {
  it('menyimpan hasil sukses ke cache in-memory dan tidak menembak vendor dua kali untuk nama yang sama', async () => {
    searchMock.mockClear()
    searchMock.mockResolvedValueOnce([sampleUniversity])

    const first = await fetchUniversitiesAction('Universitas Brawijaya Unik 1')
    const second = await fetchUniversitiesAction('universitas brawijaya unik 1')

    expect(first).toEqual({ success: true, data: [sampleUniversity] })
    expect(second).toEqual({ success: true, data: [sampleUniversity] })
    expect(searchMock).toHaveBeenCalledTimes(1)
  })

  it('mendegradasi dengan baik (bukan throw) ketika vendor membalas 429', async () => {
    searchMock.mockClear()
    searchMock.mockImplementationOnce(async () => {
      throw new Error('University API error: 429 quota_exceeded')
    })

    const result = await fetchUniversitiesAction('Institut Kuota Habis Unik 2')

    expect(result).toEqual({ success: false, data: [] })
    expect(searchMock).toHaveBeenCalledTimes(1)
  })

  it('tidak mengcache respons gagal — percobaan berikutnya tetap menembak vendor', async () => {
    searchMock.mockClear()
    searchMock.mockImplementationOnce(async () => {
      throw new Error('University API error: 429 quota_exceeded')
    })
    searchMock.mockResolvedValueOnce([sampleUniversity])

    const failed = await fetchUniversitiesAction('Kampus Retry Unik 3')
    const retried = await fetchUniversitiesAction('Kampus Retry Unik 3')

    expect(failed).toEqual({ success: false, data: [] })
    expect(retried).toEqual({ success: true, data: [sampleUniversity] })
    expect(searchMock).toHaveBeenCalledTimes(2)
  })
})
