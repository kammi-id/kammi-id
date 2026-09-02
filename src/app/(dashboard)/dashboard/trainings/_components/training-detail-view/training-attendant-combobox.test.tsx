import '@testing-library/jest-dom'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EligibleMember } from '~/db/query/training'

const searchTrainingAttendantsActionMock = mock(async () => ({
  success: true,
  data: [] as EligibleMember[]
}))

mock.module('./action', () => ({
  searchTrainingAttendantsAction: searchTrainingAttendantsActionMock
}))

const { TrainingAttendantCombobox } = await import(
  './training-attendant-combobox'
)

afterEach(() => {
  cleanup()
  searchTrainingAttendantsActionMock.mockClear()
})

const buildMember = (
  overrides: Partial<EligibleMember> = {}
): EligibleMember => ({
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Fulan',
  registerNumber: '01.PK-1.001',
  status: 'ab2',
  isCertifiedMentor: false,
  isCertifiedInstructor: false,
  pw: 'PW Jabar',
  ...overrides
})

const renderAndSearch = async (member: EligibleMember) => {
  searchTrainingAttendantsActionMock.mockResolvedValueOnce({
    success: true,
    data: [member]
  })
  const user = userEvent.setup()
  render(
    <TrainingAttendantCombobox
      trainingId='training-1'
      trainingType='dm1'
      value=''
      onSelect={() => undefined}
    />
  )

  const input = screen.getByPlaceholderText('Cari kader...')
  await user.type(input, 'Ful')

  return waitFor(
    () => expect(searchTrainingAttendantsActionMock).toHaveBeenCalled(),
    { timeout: 1500 }
  )
}

describe('TrainingAttendantCombobox — label Pemandu/Instruktur/PW', () => {
  test('kader dengan kedua sertifikasi menampilkan Pemandu dan Instruktur sekaligus', async () => {
    await renderAndSearch(
      buildMember({ isCertifiedMentor: true, isCertifiedInstructor: true })
    )

    const option = await screen.findByText(/Pemandu · Instruktur/, {}, {
      timeout: 1500
    })
    expect(option).toBeInTheDocument()
  })

  test('hanya Pemandu ditampilkan sendiri', async () => {
    await renderAndSearch(buildMember({ isCertifiedMentor: true }))

    expect(
      await screen.findByText(/Pemandu/, {}, { timeout: 1500 })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Instruktur/)).not.toBeInTheDocument()
  })

  test('hanya Instruktur ditampilkan sendiri', async () => {
    await renderAndSearch(buildMember({ isCertifiedInstructor: true }))

    expect(
      await screen.findByText(/Instruktur/, {}, { timeout: 1500 })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Pemandu/)).not.toBeInTheDocument()
  })

  test('tidak ada sertifikasi: kedua slot tidak muncul sama sekali', async () => {
    await renderAndSearch(
      buildMember({ isCertifiedMentor: false, isCertifiedInstructor: false })
    )

    const label = await screen.findByText(/PW Jabar/, {}, { timeout: 1500 })
    expect(label.textContent).not.toMatch(/Pemandu/)
    expect(label.textContent).not.toMatch(/Instruktur/)
  })
})
