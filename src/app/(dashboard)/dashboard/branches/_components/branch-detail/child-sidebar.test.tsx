import '@testing-library/jest-dom'
import { afterEach, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import type { Organization } from '~/db/query/organization'

const push = mock(() => undefined)
const refresh = mock(() => undefined)

mock.module('next/navigation', () => ({
  usePathname: () => '/dashboard/branches/pw-jabar',
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams()
}))

const { ChildSidebar } = await import('./child-sidebar')

afterEach(cleanup)

const child = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'PK Telkom',
  slug: 'pk-telkom',
  code: '01.PK-1',
  codeSlug: '01-pk-1',
  type: 'pk',
  level: 4,
  logo: null,
  isSiteActive: false,
  parentId: '00000000-0000-0000-0000-000000000002',
  isNonActive: false,
  nonActiveAt: null,
  nonActiveBy: null,
  deletedAt: null,
  deletedBy: null,
  state: 'aktif'
} satisfies Organization

const pwJabar = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'PW Jabar',
  slug: 'pw-jabar',
  code: '01',
  type: 'pw',
  level: 2,
  parentId: null
}

const renderSidebar = (props: Partial<Parameters<typeof ChildSidebar>[0]>) =>
  render(
    <ChildSidebar
      items={[child]}
      childTotal={1}
      directChildrenTotal={1}
      page={1}
      parentOrg={pwJabar}
      buatAnak={false}
      basePath='/dashboard/branches/pw-jabar'
      {...props}
    />
  )

test('sidebar Struktur Anak menyediakan pencarian, tautan bernama, dan pagination', () => {
  renderSidebar({ childTotal: 9, directChildrenTotal: 9 })

  expect(
    screen.getByRole('textbox', { name: 'Cari Struktur Anak' })
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'PK Telkom' })).toHaveAttribute(
    'href',
    '/dashboard/branches/pw-jabar/pk-telkom'
  )
  expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Selanjutnya' })).toBeEnabled()
})

test('sidebar menyatakan hasil pencarian kosong', () => {
  renderSidebar({ items: [], childTotal: 0, directChildrenTotal: 9 })

  expect(
    screen.getByText('Tidak ada Struktur Anak yang cocok.')
  ).toBeInTheDocument()
  expect(
    screen.getByRole('textbox', { name: 'Cari Struktur Anak' })
  ).toBeEnabled()
})

// Dua keadaan kosong yang berbeda. Tanpa Struktur Anak sama sekali tidak ada
// yang bisa dicari, jadi kolom pencarian mati dan kalimatnya mengajak membuat
// yang pertama, bukan mengganti kata kunci.
test('sidebar membedakan belum ada Struktur Anak dari pencarian nihil', () => {
  renderSidebar({ items: [], childTotal: 0, directChildrenTotal: 0 })

  expect(screen.getByText('Belum ada Struktur Anak.')).toBeInTheDocument()
  expect(
    screen.getByRole('textbox', { name: 'Cari Struktur Anak' })
  ).toBeDisabled()
})

test('tombol Tambah menamai Jenjang anak yang sah', () => {
  renderSidebar({ buatAnak: true })

  expect(screen.getByRole('button', { name: 'Tambah PD' })).toBeInTheDocument()
})

test('tombol Tambah absen tanpa kemampuan buat', () => {
  renderSidebar({ buatAnak: false })

  expect(screen.queryByRole('button', { name: 'Tambah PD' })).toBeNull()
})

// Regresi yang memicu perubahan ini: PW tanpa satu pun PD kehilangan sidebar,
// sehingga tidak ada tempat untuk menambah PD pertamanya.
test('sidebar tetap menawarkan Tambah saat belum ada Struktur Anak', () => {
  renderSidebar({
    items: [],
    childTotal: 0,
    directChildrenTotal: 0,
    buatAnak: true
  })

  expect(screen.getByRole('button', { name: 'Tambah PD' })).toBeInTheDocument()
  expect(screen.getByText('Belum ada Struktur Anak.')).toBeInTheDocument()
})
