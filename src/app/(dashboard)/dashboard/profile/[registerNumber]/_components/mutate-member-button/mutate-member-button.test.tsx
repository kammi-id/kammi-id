import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mutateMemberActionMock = mock<
  typeof import('./action').mutateMemberAction
>(async () => ({
  success: true,
  message: 'Kader berhasil dimutasi.'
}))
const refreshMock = mock(() => undefined)

mock.module('./action', () => ({ mutateMemberAction: mutateMemberActionMock }))
mock.module('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock })
}))

const { MutateMemberButton } = await import('./mutate-member-button')

const organizations = [
  { id: 'org-1', name: 'PD Sleman' },
  { id: 'org-2', name: 'PD Bantul' },
  { id: 'org-3', name: 'PD Bandung' }
]

const openDialog = async (items = organizations) => {
  const user = userEvent.setup()
  render(
    <MutateMemberButton
      memberId='member-1'
      name='Fulan'
      currentOrganizationId='org-1'
      currentOrganizationName='PD Sleman'
      organizations={items}
    />
  )
  await user.click(screen.getByRole('button', { name: 'Mutasi Struktur' }))
  return { user, input: screen.getByRole('combobox') }
}

afterEach(() => {
  cleanup()
  mutateMemberActionMock.mockClear()
  refreshMock.mockClear()
})

describe('MutateMemberButton', () => {
  it('memfilter nama Struktur dan mengirim ID tujuan yang dipilih', async () => {
    const { user, input } = await openDialog()
    await user.type(input, 'bAnTu')

    expect(input).toHaveValue('bAnTu')
    expect(
      await screen.findByRole('option', { name: 'PD Bantul' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'PD Bandung' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'PD Sleman' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'PD Bantul' }))
    expect(input).toHaveValue('PD Bantul')
    await user.click(screen.getByRole('button', { name: 'Ya, Mutasi' }))
    await waitFor(() =>
      expect(mutateMemberActionMock).toHaveBeenCalledWith('member-1', 'org-2')
    )
  })

  it('menampilkan hasil kosong lalu memulihkan daftar ketika pencarian dihapus', async () => {
    const { user, input } = await openDialog()
    const confirm = screen.getByRole('button', { name: 'Ya, Mutasi' })
    await user.type(input, 'tidak ditemukan')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(
      await screen.findByText('Tidak ada Struktur tujuan.')
    ).toBeInTheDocument()
    expect(confirm).toBeDisabled()
    await user.clear(input)
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
  })

  it('memilih hasil pencarian melalui keyboard', async () => {
    const { user, input } = await openDialog()
    await user.type(input, 'Bandung')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('PD Bandung')
    expect(screen.getByRole('button', { name: 'Ya, Mutasi' })).toBeEnabled()
    expect(mutateMemberActionMock).not.toHaveBeenCalled()
  })

  it('tidak menawarkan Struktur asal ketika tidak ada tujuan lain', async () => {
    const { user, input } = await openDialog([organizations[0]])
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(
      await screen.findByText('Tidak ada Struktur tujuan.')
    ).toBeInTheDocument()
  })

  it('mengosongkan pilihan setelah dialog dibatalkan dan dibuka kembali', async () => {
    const { user, input } = await openDialog()
    await user.type(input, 'Bantul')
    await user.click(await screen.findByRole('option', { name: 'PD Bantul' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Mutasi Struktur' }))
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Ya, Mutasi' })).toBeDisabled()
    expect(mutateMemberActionMock).not.toHaveBeenCalled()
  })
})
