import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { Editor } from '@tiptap/core'
// Bundel internal runtime klien Next — tidak punya deklarasi tipe sendiri.
// @ts-expect-error -- lihat komentar `publish` di bawah.
import * as flightClient from 'next/dist/compiled/react-server-dom-turbopack/client.browser'
import { ArticleBodyRenderer } from '~/components/article-body-renderer'

import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'
import { toPlainBodyJSON } from './utils'

// Kontrak: apa pun yang berhasil dibangun editor lewat toolbar (tajuk,
// tebal, miring, daftar, kutipan, tautan, gambar) harus sampai ke pembaca
// persis seperti yang disunting. Bagian pertama berkas ini menjaga bentuk
// JSON-nya; bagian kedua (`jalur terbit`) menjalankan rantai lengkapnya
// sampai HTML, jadi kesepakatan antara editor dan perender tidak lagi
// bersandar pada dua test terpisah yang kebetulan sepakat.
const roundTrip = (doc: string | Record<string, unknown>) => {
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

  test('membuang format yang tidak ada di daftar-izin perender publik', () => {
    // Garis bawah, coret, kode, blok kode, dan garis pemisah dibawa
    // StarterKit secara bawaan dan terjangkau lewat pintasan papan ketik
    // maupun tempelan — padahal perender publik membuangnya. Dimatikan di
    // constants.ts supaya editor tidak pernah memperlihatkan format yang
    // tidak akan naik terbit.
    // Lewat HTML, bukan JSON — itulah bentuk yang sungguh datang dari
    // tempelan Word/Google Docs.
    const json = roundTrip(
      [
        '<p><u>ub</u><s>st</s><code>kd</code></p>',
        '<hr>',
        '<pre><code>kode</code></pre>'
      ].join('')
    ) as JSONNode

    const markTypes = json.content
      ?.flatMap((node) => node.content ?? [])
      .flatMap((node) => node.marks ?? [])
      .map((mark) => mark.type)
    expect(markTypes ?? []).toEqual([])

    const nodeTypes = json.content?.map((node) => node.type)
    expect(nodeTypes).not.toContain('horizontalRule')
    expect(nodeTypes).not.toContain('codeBlock')
  })
})

/**
 * Menjalankan satu tempelan HTML melalui SELURUH rantai terbit yang
 * sesungguhnya: editor Tiptap asli → `toPlainBodyJSON` → encoder argumen
 * Server Action (yang dulu menelan `attrs`) → daftar-izin perender publik →
 * perender React. Yang dikembalikan adalah HTML yang sungguh naik terbit.
 *
 * Yang membuatnya bukan sekadar tes perender: dokumen tidak diserahkan
 * sebagai objek di memori, melainkan lewat `encodeReply` lalu diurai lagi —
 * jadi apa pun yang tidak selamat dari perjalanan klien → server tidak akan
 * pernah sampai ke bagian bawah rantai ini.
 */
const publish = async (html: string): Promise<string> => {
  const editor = new Editor({
    extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
    content: html
  })
  const saved = toPlainBodyJSON(editor.getJSON())
  editor.destroy()

  const client = flightClient as {
    encodeReply: (
      value: unknown,
      options: { temporaryReferences: unknown }
    ) => Promise<string | FormData>
    createTemporaryReferenceSet: () => unknown
  }
  const encoded = await client.encodeReply([saved], {
    temporaryReferences: client.createTemporaryReferenceSet()
  })
  const received = JSON.parse(encoded as string)[0]

  const stream = await renderToReadableStream(
    createElement(ArticleBodyRenderer, { body: received })
  )
  return await new Response(stream).text()
}

describe('jalur terbit — editor sampai HTML publik', () => {
  test('tajuk terbit di tingkat yang dipilih, bukan jatuh ke h1', async () => {
    // Gejala yang dilaporkan QA: Tajuk 2/3 terbit sebagai <h1> raksasa
    // karena `attrs.level` hilang di encoder Server Action.
    expect(await publish('<h2>Judul Bagian</h2>')).toContain(
      '<h2>Judul Bagian</h2>'
    )
    expect(await publish('<h3>Anak Judul</h3>')).toContain(
      '<h3>Anak Judul</h3>'
    )
    expect(await publish('<h2>Judul Bagian</h2>')).not.toContain('<h1>')
  })

  test('tebal dan miring terbit apa adanya', async () => {
    const html = await publish(
      '<p><strong>tebal</strong> dan <em>miring</em></p>'
    )
    expect(html).toContain('<strong>tebal</strong>')
    expect(html).toContain('<em>miring</em>')
  })

  test('daftar poin dan bernomor terbit sebagai ul/ol', async () => {
    expect(await publish('<ul><li><p>Satu</p></li></ul>')).toContain(
      '<ul><li><p>Satu</p></li></ul>'
    )
    expect(await publish('<ol><li><p>Satu</p></li></ol>')).toContain(
      '<ol><li><p>Satu</p></li></ol>'
    )
  })

  test('kutipan terbit sebagai blockquote', async () => {
    expect(await publish('<blockquote><p>Kutipan</p></blockquote>')).toContain(
      '<blockquote><p>Kutipan</p></blockquote>'
    )
  })

  test('tautan terbit dengan href-nya, bukan jadi teks biasa', async () => {
    const html = await publish('<p><a href="https://kammi.id">klik</a></p>')
    expect(html).toContain('href="https://kammi.id"')
    expect(html).toContain('klik')
  })

  test('gambar terbit dengan src dan alt-nya', async () => {
    const html = await publish(
      '<img src="/api/images/articles/foto.jpg" alt="Foto kegiatan">'
    )
    expect(html).toContain('src="/api/images/articles/foto.jpg"')
    expect(html).toContain('alt="Foto kegiatan"')
  })

  test('satu tulisan bercampur terbit utuh, tanpa satu pun format hilang', async () => {
    const html = await publish(
      [
        '<h2>Audiensi PP KAMMI</h2>',
        '<p><strong>PP KAMMI</strong> melakukan <em>audiensi</em>.</p>',
        '<img src="/api/images/articles/audiensi.jpg" alt="Audiensi">',
        '<ul><li><p>Program kerja</p></li><li><p>Kolaborasi</p></li></ul>',
        '<blockquote><p>Semoga bermanfaat.</p></blockquote>',
        '<p><a href="https://kammi.id/berita">selengkapnya</a></p>'
      ].join('')
    )

    for (const fragment of [
      '<h2>Audiensi PP KAMMI</h2>',
      '<strong>PP KAMMI</strong>',
      '<em>audiensi</em>',
      'src="/api/images/articles/audiensi.jpg"',
      '<ul>',
      '<blockquote>',
      'href="https://kammi.id/berita"'
    ])
      expect(html).toContain(fragment)
  })

  test('membuka lagi tulisan tersimpan tidak mengubah isinya', async () => {
    // Menyunting ulang Berita lama tidak boleh diam-diam merusaknya: apa yang
    // dimuat editor dari basis data harus tersimpan kembali sama persis.
    const source = [
      '<h2>Judul</h2>',
      '<p><strong>tebal</strong> <em>miring</em></p>',
      '<img src="/api/images/articles/foto.jpg" alt="Foto">',
      '<ul><li><p>Poin</p></li></ul>',
      '<blockquote><p>Kutipan</p></blockquote>',
      '<p><a href="https://kammi.id">tautan</a></p>'
    ].join('')

    const first = new Editor({
      extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
      content: source
    })
    const saved = toPlainBodyJSON(first.getJSON())
    first.destroy()

    const reopened = new Editor({
      extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
      content: saved
    })
    const resaved = toPlainBodyJSON(reopened.getJSON())
    reopened.destroy()

    expect(resaved).toEqual(saved)
  })
})
