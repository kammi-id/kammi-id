import '@testing-library/jest-dom'
import { expect, mock, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import type { Organization } from '~/db/query/organization'

const push = mock(() => undefined)

mock.module('next/navigation', () => ({
  usePathname: () => '/dashboard/branches/pw-jabar',
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams()
}))

const { ChildSidebar } = await import('./child-sidebar')

const child = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'PK Telkom',
  slug: 'pk-telkom',
  code: '01.PK-1',
  codeSlug: '01-pk-1',
  type: 'pk',
  level: 4,
  logo: null,
  parentId: '00000000-0000-0000-0000-000000000002',
  isNonActive: false,
  nonActiveAt: null,
  nonActiveBy: null,
  deletedAt: null,
  deletedBy: null,
  state: 'aktif'
} satisfies Organization

test('sidebar Struktur Anak menyediakan pencarian, tautan bernama, dan pagination', () => {
  render(<ChildSidebar items={[child]} childTotal={9} page={1} />)

  expect(screen.getByRole('textbox', { name: 'Cari Struktur Anak' })).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'PK Telkom' })
  ).toHaveAttribute('href', '/dashboard/branches/pw-jabar/pk-telkom')
  expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Selanjutnya' })).toBeEnabled()
})

test('sidebar menyatakan hasil pencarian kosong', () => {
  render(<ChildSidebar items={[]} childTotal={0} page={1} />)

  expect(screen.getByText('Tidak ada Struktur Anak yang cocok.')).toBeInTheDocument()
})
