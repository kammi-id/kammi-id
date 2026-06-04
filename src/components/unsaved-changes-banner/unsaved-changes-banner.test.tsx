/// <reference types="@testing-library/jest-dom" />
import { describe, test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { UnsavedChangesBanner } from './unsaved-changes-banner'

afterEach(cleanup)

describe('UnsavedChangesBanner', () => {
  test('does not render when isDirty is false', () => {
    const { container } = render(<UnsavedChangesBanner isDirty={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders banner with correct text when isDirty is true', () => {
    render(<UnsavedChangesBanner isDirty={true} />)
    expect(screen.getByText('Ada perubahan belum disimpan.')).toBeInTheDocument()
  })

  test('has correct ARIA role for accessibility', () => {
    render(<UnsavedChangesBanner isDirty={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('has aria-live attribute for screen readers', () => {
    render(<UnsavedChangesBanner isDirty={true} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
