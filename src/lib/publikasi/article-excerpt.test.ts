import { describe, expect, test } from 'bun:test'
import { deriveArticleExcerpt } from './article-excerpt'

const doc = (paragraphs: string[]) => ({
  type: 'doc',
  content: paragraphs.map((text) => ({
    type: 'paragraph',
    content: [{ type: 'text', text }]
  }))
})

describe('deriveArticleExcerpt', () => {
  test('mengambil teks paragraf pertama saja', () => {
    expect(deriveArticleExcerpt(doc(['Paragraf satu.', 'Paragraf dua.']))).toBe(
      'Paragraf satu.'
    )
  })

  test('menyatukan beberapa text node dalam satu paragraf', () => {
    const body = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Halo, ' },
            { type: 'text', text: 'dunia.', marks: [{ type: 'bold' }] }
          ]
        }
      ]
    }
    expect(deriveArticleExcerpt(body)).toBe('Halo, dunia.')
  })

  test('memotong pada batas kata ketika melewati panjang maksimum', () => {
    const long = Array.from({ length: 40 }, (_, i) => `kata${i}`).join(' ')
    const result = deriveArticleExcerpt(doc([long]), 50)
    expect(result.length).toBeLessThanOrEqual(51)
    expect(result.endsWith('…')).toBe(true)
    expect(result.at(-2)).not.toBe(' ')
  })

  test('teks pas di dalam batas tidak dipotong', () => {
    expect(deriveArticleExcerpt(doc(['Singkat.']), 50)).toBe('Singkat.')
  })

  test('dokumen tanpa paragraf menghasilkan string kosong', () => {
    expect(deriveArticleExcerpt({ type: 'doc', content: [] })).toBe('')
  })

  test('body bukan dokumen valid menghasilkan string kosong', () => {
    expect(deriveArticleExcerpt(null)).toBe('')
    expect(deriveArticleExcerpt('bukan objek')).toBe('')
  })

  test('tajuk sebelum paragraf pertama tidak dipilih sebagai ringkasan', () => {
    const body = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Judul Bagian' }]
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Isinya.' }] }
      ]
    }
    expect(deriveArticleExcerpt(body)).toBe('Isinya.')
  })
})
