import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UniversityItem } from '~/lib/api/university'
import type { FetchUniversitiesResult } from './action'

const fetchUniversitiesActionMock = mock(
  async (_name: string): Promise<FetchUniversitiesResult> => ({
    success: true,
    data: []
  })
)

mock.module('./action', () => ({
  fetchUniversitiesAction: fetchUniversitiesActionMock
}))

const { UniversityCombobox } = await import('./university-combobox')

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

afterEach(() => {
  cleanup()
  fetchUniversitiesActionMock.mockClear()
})

describe('UniversityCombobox', () => {
  it('tidak menembak upstream saat baru mengetik 3 karakter (di bawah ambang)', async () => {
    const user = userEvent.setup()
    render(
      <UniversityCombobox nameField='institutionName' dataField='institutionData' />
    )

    const input = screen.getByPlaceholderText('Cari nama institusi...')
    await user.type(input, 'Uni')

    // Debounce-nya 600ms; tunggu lebih lama dari itu untuk memastikan
    // upstream memang tidak pernah ditembak untuk 3 karakter.
    await new Promise((resolve) => setTimeout(resolve, 750))
    expect(fetchUniversitiesActionMock).not.toHaveBeenCalled()
  })

  it('menembak upstream setelah mencapai 4 karakter', async () => {
    const user = userEvent.setup()
    render(
      <UniversityCombobox nameField='institutionName' dataField='institutionData' />
    )

    const input = screen.getByPlaceholderText('Cari nama institusi...')
    await user.type(input, 'Univ')

    await waitFor(
      () => expect(fetchUniversitiesActionMock).toHaveBeenCalledWith('Univ'),
      { timeout: 1500 }
    )
  })

  it('mengetik teks bebas tanpa memilih tetap mengisi nameField; dataField berisi objek kosong', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <UniversityCombobox nameField='institutionName' dataField='institutionData' />
    )

    const input = screen.getByPlaceholderText('Cari nama institusi...')
    await user.type(input, 'Kampus Tidak Dikenal Vendor')

    const nameHidden = container.querySelector(
      'input[name="institutionName"]'
    ) as HTMLInputElement
    const dataHidden = container.querySelector(
      'input[name="institutionData"]'
    ) as HTMLInputElement

    await waitFor(() =>
      expect(nameHidden.value).toBe('Kampus Tidak Dikenal Vendor')
    )
    expect(dataHidden.value).toBe('{}')
  })

  it('memilih item dari daftar tetap mengisi dataField dengan objek vendor lengkap', async () => {
    fetchUniversitiesActionMock.mockResolvedValueOnce({
      success: true,
      data: [sampleUniversity]
    })
    const user = userEvent.setup()
    const { container } = render(
      <UniversityCombobox nameField='institutionName' dataField='institutionData' />
    )

    const input = screen.getByPlaceholderText('Cari nama institusi...')
    await user.type(input, 'Univ')

    const option = await screen.findByRole(
      'option',
      { name: /Universitas Brawijaya/ },
      { timeout: 1500 }
    )
    await user.click(option)

    const nameHidden = container.querySelector(
      'input[name="institutionName"]'
    ) as HTMLInputElement
    const dataHidden = container.querySelector(
      'input[name="institutionData"]'
    ) as HTMLInputElement

    await waitFor(() => expect(nameHidden.value).toBe(sampleUniversity.name))
    expect(JSON.parse(dataHidden.value)).toEqual(sampleUniversity)
  })
})
