import { describe, it, expect } from 'bun:test'
import { deriveSummary } from '~/lib/seo/derive-summary'

const paragraph = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
})

const fallback = {
  categoryName: null as string | null,
  strukturName: 'KAMMI Wilayah Aceh',
  strukturDescription: null as string | null
}

describe('deriveSummary', () => {
  it('takes the first paragraph, flattened to plain text', () => {
    const body = paragraph('Kegiatan kaderisasi berjalan lancar hari ini.')
    expect(deriveSummary(body, fallback)).toBe(
      'Kegiatan kaderisasi berjalan lancar hari ini.'
    )
  })

  it('flattens marks and multiple text runs within one paragraph', () => {
    const body = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Halo ', marks: [] },
            { type: 'text', text: 'dunia', marks: [{ type: 'bold' }] }
          ]
        }
      ]
    }
    expect(deriveSummary(body, fallback)).toBe('Halo dunia')
  })

  it('truncates at a word boundary around 155 chars, with an ellipsis', () => {
    const long = 'kata '.repeat(40).trim() // 40 words, well past 155 chars
    const body = paragraph(long)
    const result = deriveSummary(body, fallback)
    expect(result.length).toBeLessThanOrEqual(156) // 155 + ellipsis char
    expect(result.endsWith('…')).toBe(true)
    expect(long.startsWith(result.slice(0, -1).trimEnd())).toBe(true)
  })

  it('does not append an ellipsis when the text is not actually truncated', () => {
    const body = paragraph('Pendek saja.')
    expect(deriveSummary(body, fallback)).toBe('Pendek saja.')
  })

  it('hard-truncates with an ellipsis when there is no whitespace near the boundary', () => {
    const long = 'a'.repeat(200)
    const body = paragraph(long)
    const result = deriveSummary(body, fallback)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(156)
  })

  it('handles a single-word first paragraph with no truncation', () => {
    const body = paragraph('Alhamdulillah')
    expect(deriveSummary(body, fallback)).toBe('Alhamdulillah')
  })

  describe('layered fallback', () => {
    it('falls back to category + struktur name when the body is empty', () => {
      const result = deriveSummary(null, {
        ...fallback,
        categoryName: 'Kaderisasi'
      })
      expect(result).toBe('Kaderisasi — KAMMI Wilayah Aceh')
    })

    it('falls back to struktur description when there is no category and no text', () => {
      const result = deriveSummary(null, {
        ...fallback,
        strukturDescription: 'Struktur wilayah KAMMI di Aceh.'
      })
      expect(result).toBe('Struktur wilayah KAMMI di Aceh.')
    })

    it('falls back to the struktur name alone as a last resort — never an empty string', () => {
      const result = deriveSummary(null, fallback)
      expect(result).toBe('KAMMI Wilayah Aceh')
    })

    it('skips a body opened by an image and uses the first paragraph that has text', () => {
      const body = {
        type: 'doc',
        content: [
          { type: 'image', attrs: { src: 'https://x/y.png', alt: '' } },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Teks setelah gambar.' }]
          }
        ]
      }
      expect(deriveSummary(body, fallback)).toBe('Teks setelah gambar.')
    })

    it('skips a body opened by a heading and uses the first paragraph that has text', () => {
      const body = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Judul Bagian' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Teks setelah heading.' }]
          }
        ]
      }
      expect(deriveSummary(body, fallback)).toBe('Teks setelah heading.')
    })

    it('skips empty paragraphs and finds the first one with actual text, even nested in a blockquote', () => {
      const body = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [] },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Kutipan bermakna.' }]
              }
            ]
          }
        ]
      }
      expect(deriveSummary(body, fallback)).toBe('Kutipan bermakna.')
    })

    it('falls back past a body that is only an image and a bullet list with no text', () => {
      const body = {
        type: 'doc',
        content: [
          { type: 'image', attrs: { src: 'https://x/y.png', alt: '' } },
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [] }]
          }
        ]
      }
      expect(deriveSummary(body, { ...fallback, categoryName: 'Rilis' })).toBe(
        'Rilis — KAMMI Wilayah Aceh'
      )
    })
  })
})
