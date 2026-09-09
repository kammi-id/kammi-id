import { describe, expect, spyOn, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { InitialCredentialsDialog } from './initial-credentials-dialog'

describe('dialog kredensial awal', () => {
  test('menyamarkan password secara asali dan menyalin setiap field aktual', async () => {
    const user = userEvent.setup()
    const writeText = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(
      undefined
    )

    render(
      <InitialCredentialsDialog
        open
        onOpenChange={() => undefined}
        organizationSlug='pk-test'
        credentials={[
          {
            authority: 'BPH PK Test',
            username: 'bph-pk-test',
            password: 'rahasia-awal'
          }
        ]}
      />
    )

    expect(screen.queryByText('rahasia-awal')).not.toBeInTheDocument()
    expect(screen.getByText('••••••••••••')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salin username' }))
    await user.click(screen.getByRole('button', { name: 'Salin password' }))
    await user.click(screen.getByRole('button', { name: 'Salin Semua' }))

    expect(writeText).toHaveBeenNthCalledWith(1, 'bph-pk-test')
    expect(writeText).toHaveBeenNthCalledWith(2, 'rahasia-awal')
    expect(writeText).toHaveBeenNthCalledWith(
      3,
      'BPH PK Test\nUsername: bph-pk-test\nPassword: rahasia-awal'
    )

    await user.click(screen.getByRole('button', { name: 'Tampilkan password' }))
    expect(screen.getByText('rahasia-awal')).toBeInTheDocument()
    writeText.mockRestore()
  })
})
