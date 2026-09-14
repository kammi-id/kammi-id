import { describe, expect, test } from 'bun:test'
import { Editor } from '@tiptap/core'

import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'

// Kontrak: apa pun yang berhasil dibangun editor lewat toolbar (tajuk,
// tebal, miring, daftar, kutipan, tautan, gambar) harus tetap berupa node/
// mark yang sama persis yang diloloskan oleh daftar-izin perender publik di
// article-body-renderer/utils.ts — file itu tidak boleh diimpor lintas-rute
// dari sini (lihat AGENTS.md), jadi kontraknya diverifikasi lewat bentuk
// JSON yang sudah didokumentasikan test perender itu sendiri.
const roundTrip = (doc: Record<string, unknown>) => {
  const editor = new Editor({
    extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
    content: doc
  })
  const json = editor.getJSON()
  editor.destroy()
  return json
}

type JSONNode = {
  type?: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

describe('ARTICLE_BODY_EDITOR_EXTENSIONS — kontrak serialisasi', () => {
  test('menerima tajuk (heading) dengan level tertentu', () => {
    const json = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Judul Bagian' }]
        }
      ]
    }) as JSONNode

    expect(json.content?.[0]?.type).toBe('heading')
    expect(json.content?.[0]?.attrs?.level).toBe(2)
  })

  test('menerima mark tebal dan miring pada teks', () => {
    const json = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'halo',
              marks: [{ type: 'bold' }, { type: 'italic' }]
            }
          ]
        }
      ]
    }) as JSONNode

    const marks = json.content?.[0]?.content?.[0]?.marks?.map((m) => m.type)
    expect(marks).toContain('bold')
    expect(marks).toContain('italic')
  })

  test('menerima daftar poin dan daftar bernomor', () => {
    const bulletJson = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Poin' }] }
              ]
            }
          ]
        }
      ]
    }) as JSONNode
    expect(bulletJson.content?.[0]?.type).toBe('bulletList')
    expect(bulletJson.content?.[0]?.content?.[0]?.type).toBe('listItem')

    const orderedJson = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Satu' }] }
              ]
            }
          ]
        }
      ]
    }) as JSONNode
    expect(orderedJson.content?.[0]?.type).toBe('orderedList')
  })

  test('menerima kutipan (blockquote)', () => {
    const json = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Kutipan' }] }
          ]
        }
      ]
    }) as JSONNode
    expect(json.content?.[0]?.type).toBe('blockquote')
  })

  test('menerima tautan dengan href', () => {
    const json = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'klik di sini',
              marks: [{ type: 'link', attrs: { href: 'https://kammi.id' } }]
            }
          ]
        }
      ]
    }) as JSONNode
    const linkMark = json.content?.[0]?.content?.[0]?.marks?.find(
      (m) => m.type === 'link'
    )
    expect(linkMark?.attrs?.href).toBe('https://kammi.id')
  })

  test('menerima gambar dengan src hasil unggahan (/api/images/...) dan alt', () => {
    const json = roundTrip({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: '/api/images/uploads/foto.jpg', alt: 'Foto kegiatan' }
        }
      ]
    }) as JSONNode
    expect(json.content?.[0]?.type).toBe('image')
    expect(json.content?.[0]?.attrs?.src).toBe('/api/images/uploads/foto.jpg')
    expect(json.content?.[0]?.attrs?.alt).toBe('Foto kegiatan')
  })
})
