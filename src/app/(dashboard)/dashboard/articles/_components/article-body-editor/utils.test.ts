import { describe, expect, test } from 'bun:test'
import { Editor } from '@tiptap/core'
// Bundel internal runtime klien Next — tidak punya deklarasi tipe sendiri.
// @ts-expect-error -- lihat komentar di test encoder di bawah.
import * as flightClient from 'next/dist/compiled/react-server-dom-turbopack/client.browser'

import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'
import {
  dataUrlToFile,
  hasImportableImage,
  rewriteEmbeddedImages,
  toEditorContent,
  toPlainBodyJSON
} from './utils'

// Regresi tiket QA "gambar tidak muncul & format teks berubah setelah
// disimpan". Penyebabnya bukan di perender publik, tapi di jalan pulang
// editor → Server Action: `attrs` milik ProseMirror berprototipe-nol, dan
// encoder Flight menukarnya dengan token rujukan sementara `"$T"` yang tak
// pernah sampai server. `src`, `level`, dan `href` hilang di sana.

const buildDoc = () =>
  new Editor({
    extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
    content: [
      '<h2>Judul Bagian</h2>',
      '<img src="/api/images/articles/foto.jpg" alt="Foto kegiatan">',
      '<p><a href="https://kammi.id">tautan</a></p>'
    ].join('')
  })

const collectNullPrototypes = (value: unknown, path = '$'): string[] => {
  if (Array.isArray(value))
    return value.flatMap((item, i) =>
      collectNullPrototypes(item, `${path}[${i}]`)
    )
  if (!value || typeof value !== 'object') return []
  const own = Object.getPrototypeOf(value) === null ? [path] : []
  return [
    ...own,
    ...Object.entries(value).flatMap(([key, child]) =>
      collectNullPrototypes(child, `${path}.${key}`)
    )
  ]
}

describe('toPlainBodyJSON', () => {
  test('getJSON() mentah memang membawa attrs berprototipe-nol', () => {
    const editor = buildDoc()
    const raw = editor.getJSON()
    editor.destroy()

    // Kalau baris ini gagal, Tiptap/ProseMirror sudah berhenti memakai
    // `Object.create(null)` — helper-nya boleh dipensiunkan, bukan diperluas.
    expect(collectNullPrototypes(raw).length).toBeGreaterThan(0)
  })

  test('hasilnya bebas prototipe-nol dan attrs tetap utuh', () => {
    const editor = buildDoc()
    const body = toPlainBodyJSON(editor.getJSON())
    editor.destroy()

    expect(collectNullPrototypes(body)).toEqual([])

    type JSONNode = {
      attrs?: Record<string, unknown>
      content?: JSONNode[]
      marks?: { attrs?: Record<string, unknown> }[]
    }
    const nodes = (body as { content: JSONNode[] }).content
    expect(nodes[0]?.attrs?.level).toBe(2)
    expect(nodes[1]?.attrs?.src).toBe('/api/images/articles/foto.jpg')
    expect(nodes[2]?.content?.[0]?.marks?.[0]?.attrs?.href).toBe(
      'https://kammi.id'
    )
  })

  test('selamat melewati encoder Server Action tanpa kehilangan attrs', async () => {
    // Encoder yang sama yang dipakai runtime klien Next untuk argumen Server
    // Action — satu-satunya cara menguji gejala sebenarnya, karena `"$T"`
    // muncul HANYA ketika `temporaryReferences` aktif (dan Next selalu
    // menyalakannya), bukan sebagai lemparan error yang kelihatan.
    const client = flightClient as {
      encodeReply: (
        value: unknown,
        options: { temporaryReferences: unknown }
      ) => Promise<string | FormData>
      createTemporaryReferenceSet: () => unknown
    }

    const editor = buildDoc()
    const raw = editor.getJSON()
    editor.destroy()

    const encode = async (value: unknown) => {
      const encoded = await client.encodeReply([value], {
        temporaryReferences: client.createTemporaryReferenceSet()
      })
      return typeof encoded === 'string'
        ? encoded
        : [...encoded.entries()].map(([, v]) => String(v)).join('')
    }

    expect(await encode(raw)).toContain('"$T"')

    const encoded = await encode(toPlainBodyJSON(raw))
    expect(encoded).not.toContain('"$T"')
    expect(encoded).toContain('/api/images/articles/foto.jpg')
    expect(encoded).toContain('"level":2')
    expect(encoded).toContain('https://kammi.id')
  })
})

// PNG 1x1 sungguhan — cukup untuk membuktikan byte-nya sampai utuh ke
// pengunggah, bukan sekadar string yang kebetulan cocok pola.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const importers = (
  overrides: Partial<Parameters<typeof rewriteEmbeddedImages>[1]> = {}
) => ({
  uploadFile: async () => '/api/images/articles/unggahan.png',
  importUrl: async () => '/api/images/articles/salinan.png',
  ...overrides
})

describe('gambar tempelan', () => {
  test('hasImportableImage mengenali base64 dan alamat milik server lain', () => {
    expect(hasImportableImage(`<p>a</p><img src="${PNG_1X1}">`)).toBe(true)
    expect(hasImportableImage('<img src="https://x.test/a.png">')).toBe(true)
    expect(hasImportableImage('<p>tanpa gambar</p>')).toBe(false)
    // Gambar yang sudah milik kita tidak perlu disalin lagi.
    expect(hasImportableImage('<img src="/api/images/articles/a.png">')).toBe(
      false
    )
    expect(
      hasImportableImage(
        `<img src="${window.location.origin}/api/images/articles/a.png">`
      )
    ).toBe(false)
  })

  test('dataUrlToFile menghasilkan File dengan tipe dan byte yang utuh', async () => {
    const file = dataUrlToFile(PNG_1X1, 'tangkapan-layar')

    expect(file).not.toBeNull()
    expect(file?.type).toBe('image/png')
    expect(file?.name).toBe('tangkapan-layar')
    // Tanda tangan berkas PNG: \x89PNG
    const head = new Uint8Array(await file!.arrayBuffer()).slice(0, 4)
    expect([...head]).toEqual([0x89, 0x50, 0x4e, 0x47])
  })

  test('dataUrlToFile menolak yang bukan data-URL gambar', () => {
    expect(dataUrlToFile('https://x.test/a.png', 'a')).toBeNull()
    expect(dataUrlToFile('data:text/html;base64,PHA+', 'a')).toBeNull()
  })

  test('base64 diunggah dan alamat jauh disalin, alamat sendiri dibiarkan', async () => {
    const uploaded: string[] = []
    const imported: string[] = []

    const { html, dropped, kept } = await rewriteEmbeddedImages(
      [
        '<p>Teks</p>',
        `<img src="${PNG_1X1}" alt="Foto">`,
        '<img src="https://lh7.googleusercontent.test/luar.png">',
        '<img src="/api/images/articles/sudah-milik-kita.png">'
      ].join(''),
      {
        uploadFile: async (file) => {
          uploaded.push(file.type)
          return '/api/images/articles/unggahan.png'
        },
        importUrl: async (url) => {
          imported.push(url)
          return '/api/images/articles/salinan.png'
        }
      }
    )

    expect({ dropped, kept }).toEqual({ dropped: 0, kept: 0 })
    expect(uploaded).toEqual(['image/png'])
    expect(imported).toEqual(['https://lh7.googleusercontent.test/luar.png'])
    expect(html).toContain('/api/images/articles/unggahan.png')
    expect(html).toContain('/api/images/articles/salinan.png')
    expect(html).toContain('/api/images/articles/sudah-milik-kita.png')
    expect(html).not.toContain('data:image/')
    expect(html).not.toContain('googleusercontent')
  })

  test('base64 yang gagal diunggah dikeluarkan, bukan ditinggal sebagai data:', async () => {
    const { html, dropped, kept } = await rewriteEmbeddedImages(
      `<p>Teks</p><img src="${PNG_1X1}" alt="Foto">`,
      importers({
        uploadFile: async () => {
          throw new Error('storage penuh')
        }
      })
    )

    expect({ dropped, kept }).toEqual({ dropped: 1, kept: 0 })
    expect(html).not.toContain('data:image/')
    expect(html).not.toContain('<img')
    expect(html).toContain('Teks')
  })

  test('alamat jauh yang gagal disalin dibiarkan menumpang, bukan dibuang', async () => {
    // Beda perlakuan dengan base64 dan disengaja: gambar ini masih tampil,
    // jadi mengeluarkannya justru membuang isi yang tadinya baik-baik saja.
    const { html, dropped, kept } = await rewriteEmbeddedImages(
      '<img src="https://x.test/luar.png">',
      importers({
        importUrl: async () => {
          throw new Error('alamat tidak boleh diakses dari server')
        }
      })
    )

    expect({ dropped, kept }).toEqual({ dropped: 0, kept: 1 })
    expect(html).toContain('https://x.test/luar.png')
  })

  test('HTML tanpa gambar yang perlu dipindahkan dikembalikan apa adanya', async () => {
    const html = '<p>Cuma teks</p>'
    const result = await rewriteEmbeddedImages(html, {
      uploadFile: async () => {
        throw new Error('tidak boleh terpanggil')
      },
      importUrl: async () => {
        throw new Error('tidak boleh terpanggil')
      }
    })

    expect(result).toEqual({ html, dropped: 0, kept: 0 })
  })
})

describe('toEditorContent — memuat baris lama tanpa merusaknya', () => {
  // Bentuk yang sungguh ada di basis data: disimpan ketika underline dan
  // garis pemisah masih hidup di editor.
  const legacy = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Judul' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'garis bawah', marks: [{ type: 'underline' }] },
          { type: 'text', text: ' lalu tebal', marks: [{ type: 'bold' }] }
        ]
      },
      { type: 'horizontalRule' },
      { type: 'paragraph', content: [{ type: 'text', text: 'paragraf akhir' }] }
    ]
  }

  test('editor MENGOSONGKAN dokumen lama bila dimuat mentah-mentah', () => {
    // Inilah bahayanya, dan alasan `toEditorContent` ada: Tiptap menelan
    // lemparan ProseMirror dan menggantinya dengan dokumen kosong. Humas
    // membuka Berita lama, melihat kosong, menekan Simpan — isinya hilang.
    const editor = new Editor({
      extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
      content: legacy
    })
    const loaded = editor.getJSON() as { content?: { type?: string }[] }
    editor.destroy()

    expect(loaded.content).toEqual([{ type: 'paragraph' }])
  })

  test('lewat toEditorContent, seluruh teksnya selamat', () => {
    const editor = new Editor({
      extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
      content: toEditorContent(legacy)
    })
    const html = editor.getHTML()
    const loaded = toPlainBodyJSON(editor.getJSON())
    editor.destroy()

    expect(html).toContain('Judul')
    expect(html).toContain('garis bawah')
    expect(html).toContain('paragraf akhir')
    // Tebal tetap tebal; cuma format yang memang tak pernah naik terbit
    // yang ditanggalkan.
    expect(html).toContain('<strong>')
    expect(html).not.toContain('<u>')
    expect(html).not.toContain('<hr>')
    expect(JSON.stringify(loaded)).toContain('Judul')
  })

  test('node yang tidak dikenal dibuang, tetangganya tidak ikut', () => {
    const content = toEditorContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'sebelum' }] },
        { type: 'nodeRekaan', content: [{ type: 'text', text: 'asing' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'sesudah' }] }
      ]
    }) as { content: { type: string }[] }

    expect(content.content.map((node) => node.type)).toEqual([
      'paragraph',
      'paragraph'
    ])
  })

  test('badan tulisan yang didukung penuh lewat tanpa berubah', () => {
    const body = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Judul' }]
        },
        {
          type: 'image',
          attrs: { src: '/api/images/articles/foto.jpg', alt: 'Foto' }
        }
      ]
    }

    expect(toEditorContent(body)).toEqual(body)
  })

  test('badan tulisan kosong atau rusak jadi dokumen kosong yang sah', () => {
    const empty = { type: 'doc', content: [{ type: 'paragraph' }] }
    expect(toEditorContent(undefined)).toEqual(empty)
    expect(toEditorContent('bukan dokumen')).toEqual(empty)
    expect(toEditorContent({ type: 'nodeRekaan' })).toEqual(empty)
  })
})
