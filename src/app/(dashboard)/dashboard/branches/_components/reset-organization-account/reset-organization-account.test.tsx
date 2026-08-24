import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetOrganizationAccount } from './reset-organization-account'

describe('reset akun kepengurusan', () => {
  test('menampilkan tombol mata untuk melihat password pelaku', async () => {
    const user = userEvent.setup()

    render(
      <ResetOrganizationAccount
        accounts={[
          {
            id: '019eb0fb-af13-7309-91df-406d7f268ea3',
            authority: 'BPH',
            username: 'bph-kalteng'
          }
        ]}
        organizationId='019eb0fb-af13-7309-91df-406d7f268ea4'
        organizationName='PW KAMMI Kalimantan Tengah'
      />
    )

    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    const passwordInput = screen.getByLabelText('Password saat ini')

    expect(passwordInput).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Tampilkan password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Sembunyikan password' })
    ).toBeInTheDocument()
  })

  test('menampilkan username setelah akun dipilih, bukan ID akun', async () => {
    const user = userEvent.setup()

    render(
      <ResetOrganizationAccount
        accounts={[
          {
            id: '019eb0fb-af13-7309-91df-406d7f268ea3',
            authority: 'BPH',
            username: 'bph-kalteng'
          }
        ]}
        organizationId='019eb0fb-af13-7309-91df-406d7f268ea4'
        organizationName='PW KAMMI Kalimantan Tengah'
      />
    )

    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'BPH — bph-kalteng' }))

    expect(screen.getByRole('combobox')).toHaveTextContent('BPH — bph-kalteng')
    expect(screen.getByRole('combobox')).not.toHaveTextContent(
      '019eb0fb-af13-7309-91df-406d7f268ea3'
    )
  })
})
