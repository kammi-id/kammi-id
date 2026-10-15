import { afterEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, render, waitFor } from '@testing-library/react'

// Jalur unggah diganti sebelum komponen dimuat: tes ini soal kabel tempelan,
// bukan soal penyimpanan. `uploadImageAction` mengembalikan kunci, dan
// `getSignedUrlAction` membungkusnya jadi alamat proksi — persis kontrak
// `~/lib/actions/storage` yang asli.
const uploadImageAction = mock(async () => 'articles/tempelan.png')
const importImageFromUrlAction = mock(async () => 'articles/salinan.png')
mock.module('~/lib/actions/storage', () => ({
  uploadImageAction,
  importImageFromUrlAction,
  getSignedUrlAction: async (path: string) => `/api/images/${path}`
}))

const { ArticleBodyEditor } = await import('./article-body-editor')

afterEach(() => {
  cleanup()
  uploadImageAction.mockClear()
  importImageFromUrlAction.mockClear()
})

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type JSONNode = { type?: string; attrs?: Record<string, unknown> }

const pasteInto = (element: Element, clipboard: Record<string, string>) => {
  const event = new window.Event('paste', {
    bubbles: true,
    cancelable: true
  }) as Event & { clipboardData: unknown }
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: [],
      getData: (type: string) => clipboard[type] ?? ''
    }
  })
  act(() => {
    element.dispatchEvent(event)
  })
}

describe('ArticleBodyEditor — gambar tempelan', () => {
  test('gambar base64 dari tempelan diunggah dan masuk dokumen sebagai /api/images/...', async () => {
    let body: { content?: JSONNode[] } = {}
    const { container } = render(
      <ArticleBodyEditor
        onChange={(value) => {
          body = value as { content?: JSONNode[] }
        }}
      />
    )

    const surface = await waitFor(() => {
      const element = container.querySelector('.ProseMirror')
      if (!element) throw new Error('editor belum siap')
      return element
    })

    pasteInto(surface, {
      'text/html': `<p>Teks</p><img src="${PNG_1X1}" alt="Foto">`
    })

    await waitFor(() => {
      expect(uploadImageAction).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      const image = body.content?.find((node) => node.type === 'image')
      expect(image?.attrs?.src).toBe('/api/images/articles/tempelan.png')
    })

    // Yang sampai ke formulir tidak boleh menyisakan base64 sama sekali —
    // `data:` ditolak daftar-izin perender publik.
    expect(JSON.stringify(body)).not.toContain('data:image/')
  })

  test('gambar beralamat server lain disalin ke penyimpanan sendiri', async () => {
    let body: { content?: JSONNode[] } = {}
    const { container } = render(
      <ArticleBodyEditor
        onChange={(value) => {
          body = value as { content?: JSONNode[] }
        }}
      />
    )
    const surface = await waitFor(() => {
      const element = container.querySelector('.ProseMirror')
      if (!element) throw new Error('editor belum siap')
      return element
    })

    pasteInto(surface, {
      'text/html':
        '<p>Teks</p><img src="https://lh7.googleusercontent.test/luar.png">'
    })

    await waitFor(() => {
      expect(importImageFromUrlAction).toHaveBeenCalledWith(
        'https://lh7.googleusercontent.test/luar.png',
        'articles'
      )
    })
    await waitFor(() => {
      const image = body.content?.find((node) => node.type === 'image')
      expect(image?.attrs?.src).toBe('/api/images/articles/salinan.png')
    })
    expect(JSON.stringify(body)).not.toContain('googleusercontent')
  })

  test('tempelan teks biasa tidak memicu unggahan apa pun', async () => {
    const { container } = render(<ArticleBodyEditor onChange={() => {}} />)
    const surface = await waitFor(() => {
      const element = container.querySelector('.ProseMirror')
      if (!element) throw new Error('editor belum siap')
      return element
    })

    pasteInto(surface, { 'text/html': '<p>Cuma teks</p>' })

    expect(uploadImageAction).not.toHaveBeenCalled()
    expect(importImageFromUrlAction).not.toHaveBeenCalled()
  })
})
