import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serializeArticleBodyToMarkdown } from './article-markdown-body'

const org = { type: 'pw', slug: 'pw-jabar' }

describe('serializeArticleBodyToMarkdown — cerminan renderNode', () => {
  it('menghasilkan konten yang bisa dikenali untuk setiap node dalam satu dokumen komprehensif', async () => {
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
            { type: 'text', text: 'Teks tebal ', marks: [] },
            {
              type: 'text',
              text: 'penting',
              marks: [{ type: 'bold' }]
            },
            { type: 'text', text: ' dan ', marks: [] },
            {
              type: 'text',
              text: 'miring',
              marks: [{ type: 'italic' }]
            },
            { type: 'text', text: '.', marks: [] },
            { type: 'hardBreak' },
            {
              type: 'text',
              text: 'tautan',
              marks: [{ type: 'link', attrs: { href: '/berita/2026/09/lain' } }]
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
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Langkah satu' }]
                }
              ]
            }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Kutipan penting' }]
            }
          ]
        },
        {
          type: 'image',
          attrs: { src: '/api/images/foto.jpg', alt: 'Foto kegiatan' }
        }
      ]
    }

    const markdown = await serializeArticleBodyToMarkdown(doc, org)

    // heading
    expect(markdown).toContain('## Judul Bagian')
    // bold + italic marks
    expect(markdown).toContain('**penting**')
    expect(markdown).toContain('*miring*')
    // hardBreak — line break lalu teks lanjutan
    expect(markdown).toContain('  \n[tautan]')
    // link mark — href relatif jadi absolut
    expect(markdown).toContain(
      '[tautan](https://pw-jabar.kammi.id/berita/2026/09/lain)'
    )
    // bulletList/listItem
    expect(markdown).toContain('- Poin satu')
    // orderedList/listItem
    expect(markdown).toContain('1. Langkah satu')
    // blockquote
    expect(markdown).toContain('> Kutipan penting')
    // image — src relatif jadi absolut
    expect(markdown).toContain(
      '![Foto kegiatan](https://pw-jabar.kammi.id/api/images/foto.jpg)'
    )
  })

  it('membalas string kosong untuk dokumen yang tidak sah', async () => {
    expect(await serializeArticleBodyToMarkdown(null, org)).toBe('')
    expect(await serializeArticleBodyToMarkdown(undefined, org)).toBe('')
  })

  it('meng-absolut-kan URL gambar root-relatif', async () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: '/api/images/uploads/foto.jpg', alt: '' }
        }
      ]
    }
    const markdown = await serializeArticleBodyToMarkdown(doc, org)
    expect(markdown).toContain(
      'https://pw-jabar.kammi.id/api/images/uploads/foto.jpg'
    )
  })

  it('membiarkan tautan mailto: dan http(s) apa adanya, tidak diprefix host', async () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'surel',
              marks: [
                { type: 'link', attrs: { href: 'mailto:humas@kammi.id' } }
              ]
            },
            { type: 'text', text: ' ', marks: [] },
            {
              type: 'text',
              text: 'eksternal',
              marks: [{ type: 'link', attrs: { href: 'https://contoh.org' } }]
            }
          ]
        }
      ]
    }
    const markdown = await serializeArticleBodyToMarkdown(doc, org)
    expect(markdown).toContain('[surel](mailto:humas@kammi.id)')
    expect(markdown).toContain('[eksternal](https://contoh.org)')
  })

  it('meng-escape karakter Markdown liar di dalam teks polos', async () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Harga *diskon* [50%]', marks: [] }]
        }
      ]
    }
    const markdown = await serializeArticleBodyToMarkdown(doc, org)
    expect(markdown).toContain('Harga \\*diskon\\* \\[50%\\]')
  })
})

describe('daftar-izin renderer dan serializer Markdown tetap sinkron', () => {
  it('switch keduanya menangani persis himpunan node type yang sama', () => {
    const extractCaseTypes = (source: string): string[] =>
      [...source.matchAll(/case '([a-zA-Z]+)':/g)].map((m) => m[1]).sort()

    const rendererSource = readFileSync(
      join(
        import.meta.dir,
        '../../components/article-body-renderer/article-body-renderer.tsx'
      ),
      'utf-8'
    )
    const serializerSource = readFileSync(
      join(import.meta.dir, './article-markdown-body.ts'),
      'utf-8'
    )

    const rendererTypes = extractCaseTypes(rendererSource)
    const serializerTypes = extractCaseTypes(serializerSource)

    // Uji ini SENGAJA tidak menghitung node type secara hardcode — kalau
    // suatu hari `renderNode` mendapat case baru tanpa case Markdown yang
    // sepadan (atau sebaliknya), perbandingan dua daftar ini yang gagal,
    // bukan daftar tetap di sini yang harus diperbarui manual juga.
    expect(serializerTypes).toEqual(rendererTypes)
    expect(rendererTypes.length).toBeGreaterThan(0)
  })
})
