import { describe, it, expect } from 'bun:test'
import { sanitizeArticleBody } from './utils'

describe('sanitizeArticleBody — daftar-izin node', () => {
  it('meloloskan dokumen dengan node yang diizinkan apa adanya', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Judul Bagian' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Halo ', marks: [] },
            {
              type: 'text',
              text: 'dunia',
              marks: [{ type: 'bold' }, { type: 'italic' }]
            }
          ]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Poin satu' }]
                }
              ]
            }
          ]
        },
        { type: 'blockquote', content: [] },
        { type: 'hardBreak' }
      ]
    }

    const safe = sanitizeArticleBody(doc)
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Judul Bagian', marks: [] }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Halo ', marks: [] },
            {
              type: 'text',
              text: 'dunia',
              marks: [{ type: 'bold' }, { type: 'italic' }]
            }
          ]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Poin satu', marks: [] }]
                }
              ]
            }
          ]
        },
        { type: 'blockquote', content: [] },
        { type: 'hardBreak' }
      ]
    })
  })

  it('membuang node bertipe tak dikenal, beserta anak-anaknya (bukan direkursi)', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'aman' }] },
        {
          type: 'script',
          content: [{ type: 'text', text: 'alert(1)' }]
        }
      ]
    }

    const safe = sanitizeArticleBody(doc)
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'aman', marks: [] }]
        }
        // node "script" hilang total — bukan direndahkan jadi teks, bukan diserang balik
      ]
    })
  })

  it('membuang node HTML mentah yang dicoba disuntikkan lewat Server Action, bukan cuma lewat editor', () => {
    // Body tidak wajib datang dari editor Tiptap — kolomnya `jsonb` biasa.
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'html', // tipe rekaan yang tidak pernah ada di allow-list mana pun
          content: '<img src=x onerror=alert(1)>'
        }
      ]
    }

    const safe = sanitizeArticleBody(doc)
    expect(safe).toEqual({ type: 'doc', content: [] })
  })

  it('menganggap dokumen yang bukan objek sebagai tidak sah', () => {
    expect(sanitizeArticleBody(null)).toBeNull()
    expect(sanitizeArticleBody('<script>alert(1)</script>')).toBeNull()
    expect(sanitizeArticleBody(undefined)).toBeNull()
  })

  it('membatasi level tajuk ke rentang 1-6', () => {
    const safe = sanitizeArticleBody({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 99 }, content: [] }]
    })
    expect(safe).toEqual({
      type: 'doc',
      content: [{ type: 'heading', level: 6, content: [] }]
    })
  })
})

describe('sanitizeArticleBody — daftar-izin mark', () => {
  it('membuang mark bertipe tak dikenal pada teks, menyisakan teksnya', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'kode berbahaya',
              marks: [{ type: 'code' }, { type: 'strike' }]
            }
          ]
        }
      ]
    }
    const safe = sanitizeArticleBody(doc)
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'kode berbahaya', marks: [] }]
        }
      ]
    })
  })
})

describe('sanitizeArticleBody — skema URL tautan dan gambar', () => {
  it('meloloskan mark tautan dengan href https/http/mailto/relatif', () => {
    for (const href of [
      'https://kammi.id/tentang',
      'http://kammi.id',
      'mailto:humas@kammi.id',
      '/berita/2026/01/contoh'
    ]) {
      const safe = sanitizeArticleBody({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'tautan',
                marks: [{ type: 'link', attrs: { href } }]
              }
            ]
          }
        ]
      })
      expect(safe).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'tautan', marks: [{ type: 'link', href }] }
            ]
          }
        ]
      })
    }
  })

  it('membuang mark tautan berskema javascript: — XSS klasik lewat href', () => {
    const safe = sanitizeArticleBody({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'klik saya',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'javascript:alert(document.cookie)' }
                }
              ]
            }
          ]
        }
      ]
    })
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'klik saya', marks: [] }]
        }
      ]
    })
  })

  it('membuang mark tautan berskema data: juga', () => {
    const safe = sanitizeArticleBody({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'klik',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'data:text/html,<script>alert(1)</script>' }
                }
              ]
            }
          ]
        }
      ]
    })
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'klik', marks: [] }]
        }
      ]
    })
  })

  it('meloloskan node gambar dengan src aman', () => {
    const safe = sanitizeArticleBody({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: '/api/images/uploads/foto.jpg', alt: 'Foto kegiatan' }
        }
      ]
    })
    expect(safe).toEqual({
      type: 'doc',
      content: [
        {
          type: 'image',
          src: '/api/images/uploads/foto.jpg',
          alt: 'Foto kegiatan'
        }
      ]
    })
  })

  it('membuang node gambar berskema javascript: seluruhnya', () => {
    const safe = sanitizeArticleBody({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'javascript:alert(1)', alt: 'jahat' }
        }
      ]
    })
    expect(safe).toEqual({ type: 'doc', content: [] })
  })
})
