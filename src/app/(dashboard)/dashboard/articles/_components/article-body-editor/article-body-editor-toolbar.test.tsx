import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { ArticleBodyEditorToolbar } from './article-body-editor-toolbar'

afterEach(() => {
  cleanup()
  mock.restore()
})

// Editor tiruan: sekadar cukup untuk mengetes toolbar tanpa membangun
// instance ProseMirror sungguhan (lambat & rawan di jsdom/happy-dom).
// Toolbar cuma pernah memanggil editor.isActive, editor.getAttributes, dan
// rantai editor.chain().<perintah>().run() — jadi itu saja yang ditiru.
const createFakeEditor = (
  isActive: (name: string) => boolean = () => false
) => {
  const run = mock(() => true)
  const chain: Record<string, unknown> = {}
  const chainable = [
    'focus',
    'toggleBold',
    'toggleItalic',
    'toggleHeading',
    'toggleBulletList',
    'toggleOrderedList',
    'toggleBlockquote',
    'extendMarkRange',
    'setLink',
    'unsetLink',
    'setImage'
  ]
  for (const method of chainable) {
    chain[method] = mock(() => chain)
  }
  chain.run = run

  return {
    isActive,
    getAttributes: () => ({ href: '' }),
    chain: () => chain,
    _chain: chain,
    _run: run
  }
}

describe('ArticleBodyEditorToolbar', () => {
  test('tidak me-render apa pun ketika editor belum siap', () => {
    const { container } = render(<ArticleBodyEditorToolbar editor={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('menyediakan tombol tajuk, tebal, miring, daftar, kutipan, tautan, dan gambar yang terjangkau papan ketik', () => {
    const editor = createFakeEditor()
    render(<ArticleBodyEditorToolbar editor={editor as never} />)

    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toBeInTheDocument()

    for (const name of [
      'Tajuk 2',
      'Tajuk 3',
      'Tebal',
      'Miring',
      'Daftar poin',
      'Daftar bernomor',
      'Kutipan',
      'Tautan',
      'Sisipkan gambar'
    ]) {
      const button = screen.getByRole('button', { name })
      expect(button.tagName).toBe('BUTTON')
      expect(button).not.toHaveAttribute('tabindex', '-1')
    }
  })

  test('menekan tombol Tebal memanggil chain().focus().toggleBold().run()', () => {
    const editor = createFakeEditor()
    render(<ArticleBodyEditorToolbar editor={editor as never} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tebal' }))

    expect(editor._chain.focus).toHaveBeenCalled()
    expect(editor._chain.toggleBold).toHaveBeenCalled()
    expect(editor._run).toHaveBeenCalled()
  })

  test('tombol tajuk mencerminkan status aktif via aria-pressed', () => {
    const editor = createFakeEditor((name) => name === 'heading')
    render(<ArticleBodyEditorToolbar editor={editor as never} />)

    expect(screen.getByRole('button', { name: 'Tajuk 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})
