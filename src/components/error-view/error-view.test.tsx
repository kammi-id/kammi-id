/// <reference types="@testing-library/jest-dom" />
import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorView } from './error-view'

afterEach(cleanup)

// Mock GSAP — not available in happy-dom and not needed for content tests
mock.module('gsap', () => ({
  default: {
    context: (_fn: () => void) => ({ revert: () => {} }),
    fromTo: () => {},
    to: () => {}
  }
}))

describe('ErrorView', () => {
  test('renders 404 public view with correct heading', () => {
    render(<ErrorView type="404" context="public" />)
    expect(screen.getByText('Yah, nyasar ya?')).toBeInTheDocument()
    expect(screen.getByText('Balik ke Home')).toBeInTheDocument()
  })

  test('404 public action button links to home', () => {
    const { container } = render(<ErrorView type="404" context="public" />)
    // BaseUI Button renders <a role="button"> — use anchor query directly
    expect(container.querySelector('a[href="/"]')).toBeInTheDocument()
  })

  test('renders general error dashboard view', () => {
    render(<ErrorView type="general" context="dashboard" />)
    expect(screen.getByText('Terjadi kesalahan sistem')).toBeInTheDocument()
    expect(screen.getByText('Kembali ke Dashboard')).toBeInTheDocument()
  })

  test('dashboard action button links to /dashboard', () => {
    const { container } = render(<ErrorView type="general" context="dashboard" />)
    expect(container.querySelector('a[href="/dashboard"]')).toBeInTheDocument()
  })

  test('renders 404 dashboard view with correct heading', () => {
    render(<ErrorView type="404" context="dashboard" />)
    expect(screen.getByText('Ups, halaman tidak ditemukan')).toBeInTheDocument()
  })

  test('renders public general error with correct heading', () => {
    render(<ErrorView type="general" context="public" />)
    expect(screen.getByText('Waduh, ada kendala teknis!')).toBeInTheDocument()
  })
})
