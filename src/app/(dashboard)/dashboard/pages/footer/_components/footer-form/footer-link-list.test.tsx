import '@testing-library/jest-dom'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FooterLinkList, type SortableFooterLink } from './footer-link-list'

afterEach(cleanup)

const links: SortableFooterLink[] = [
  { id: 'a', label: 'Tentang', href: '/tentang' },
  { id: 'b', label: 'Berita', href: '/berita' }
]

describe('FooterLinkList', () => {
  test('renders each link in order with its own drag handle', () => {
    render(
      <FooterLinkList
        menuTitle='KAMMI'
        links={links}
        pages={[]}
        onChange={() => {}}
      />
    )

    const list = screen.getByRole('list', { name: 'Tautan KAMMI' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: 'Geser Tentang' })
    ).toHaveAttribute('aria-roledescription', 'sortable')
    expect(
      screen.getByRole('button', { name: 'Geser Berita' })
    ).toBeInTheDocument()
  })

  test('adds an empty link at the end', () => {
    const onChange = mock()
    render(
      <FooterLinkList
        menuTitle='KAMMI'
        links={links}
        pages={[]}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tambah Tautan' }))

    const next = onChange.mock.calls[0][0] as SortableFooterLink[]
    expect(next).toHaveLength(3)
    expect(next[2]).toMatchObject({ label: '', href: '' })
    expect(next[2].id).not.toBe('a')
  })

  test('removes only the chosen link', () => {
    const onChange = mock()
    render(
      <FooterLinkList
        menuTitle='KAMMI'
        links={links}
        pages={[]}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus Tentang' }))

    expect(onChange).toHaveBeenCalledWith([links[1]])
  })

  test('shows an empty state when the menu has no links', () => {
    render(
      <FooterLinkList
        menuTitle='KAMMI'
        links={[]}
        pages={[]}
        onChange={() => {}}
      />
    )

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText(/Belum ada tautan/)).toBeInTheDocument()
  })
})
