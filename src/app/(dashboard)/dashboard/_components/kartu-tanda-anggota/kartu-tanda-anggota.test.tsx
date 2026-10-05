import '@testing-library/jest-dom'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { KartuTandaAnggota } from './kartu-tanda-anggota'

afterEach(cleanup)

const baseProps = {
  name: 'Budi Santoso',
  registerNumber: '01.01.001.0001',
  photoUrl: null,
  organizationName: 'PK Telkom',
  status: 'ab2',
  yearOfEntry: 2022,
  keadaan: 'aktif' as const
}

describe('KartuTandaAnggota', () => {
  test('renders name, NIA, Struktur, Jenjang, and tahun masuk', () => {
    render(<KartuTandaAnggota {...baseProps} />)

    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('01.01.001.0001')).toBeInTheDocument()
    expect(screen.getByText('PK Telkom')).toBeInTheDocument()
    expect(screen.getByText('AB2')).toBeInTheDocument()
    expect(screen.getByText('2022')).toBeInTheDocument()
  })

  test('shows no Keadaan badge when Aktif', () => {
    render(<KartuTandaAnggota {...baseProps} keadaan='aktif' />)

    expect(screen.queryByText('Alumni')).not.toBeInTheDocument()
    expect(screen.queryByText('Sanksi')).not.toBeInTheDocument()
    expect(screen.queryByText('Non-Aktif')).not.toBeInTheDocument()
  })

  test('shows the Sanksi badge when the member is under Sanksi', () => {
    render(<KartuTandaAnggota {...baseProps} keadaan='sanksi' />)

    expect(screen.getByText('Sanksi')).toBeInTheDocument()
  })

  test('shows the Alumni badge when the member is Alumni', () => {
    render(<KartuTandaAnggota {...baseProps} keadaan='alumni' />)

    expect(screen.getByText('Alumni')).toBeInTheDocument()
  })

  test('never renders a QR code or a reserved placeholder for one', () => {
    const { container } = render(<KartuTandaAnggota {...baseProps} />)

    expect(container.querySelector('[data-slot="qr-code"]')).toBeNull()
    expect(screen.queryByText(/qr/i)).not.toBeInTheDocument()
  })
})
