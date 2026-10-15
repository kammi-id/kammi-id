import type {
  UnsafeArticleBodyNode,
  SafeArticleBodyNode,
  SafeArticleMark
} from './types'

// Daftar-izin node — spec §"Artikel di permukaan publik": toolbar editor
// minimal adalah tajuk, tebal, miring, daftar, tautan, gambar, kutipan.
// `doc` dan `text` ikut, sebagai simpul akar dan daun Tiptap. Apa pun di
// luar daftar ini — `codeBlock`, node bikinan tangan, atau apa pun yang
// belum pernah dipikirkan — DIBUANG, beserta seluruh anak-anaknya.
const CONTAINER_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote'
])

const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'link'])

/**
 * Skema URL yang boleh dipakai `href`/`src`. `javascript:` dan `data:`
 * ditolak dengan sengaja — keduanya jalur XSS klasik lewat atribut yang
 * kelihatannya cuma sebuah tautan atau gambar.
 */
const isSafeUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false
  if (value.startsWith('/')) return true
  return (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('mailto:')
  )
}

const sanitizeMarks = (rawMarks: unknown): SafeArticleMark[] => {
  if (!Array.isArray(rawMarks)) return []
  const marks: SafeArticleMark[] = []
  for (const rawMark of rawMarks) {
    if (!rawMark || typeof rawMark !== 'object') continue
    const type = (rawMark as { type?: unknown }).type
    if (type !== 'bold' && type !== 'italic' && type !== 'link') continue
    if (!ALLOWED_MARK_TYPES.has(type)) continue // defensive, mirrors the check above

    if (type === 'link') {
      const attrs = (rawMark as { attrs?: unknown }).attrs
      const href =
        attrs && typeof attrs === 'object'
          ? (attrs as { href?: unknown }).href
          : undefined
      if (!isSafeUrl(href)) continue // tautan dengan skema tak aman: dibuang, bukan diloloskan tanpa href
      marks.push({ type: 'link', href })
      continue
    }

    marks.push({ type })
  }
  return marks
}

const sanitizeChildren = (rawContent: unknown): SafeArticleBodyNode[] => {
  if (!Array.isArray(rawContent)) return []
  const children: SafeArticleBodyNode[] = []
  for (const child of rawContent) {
    const safe = sanitizeArticleBodyNode(child)
    if (safe) children.push(safe)
  }
  return children
}

const clampHeadingLevel = (rawLevel: unknown): 1 | 2 | 3 | 4 | 5 | 6 => {
  const level = typeof rawLevel === 'number' ? Math.trunc(rawLevel) : 1
  if (level < 1) return 1
  if (level > 6) return 6
  return level as 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Penyaring daftar-izin — satu-satunya jalan sebuah node Tiptap boleh sampai
 * ke perender React. Node/tipe apa pun di luar `CONTAINER_NODE_TYPES` dan
 * `LEAF_NODE_TYPES` dikembalikan `null` dan HILANG dari pohon, beserta
 * anak-anaknya — tidak direkursi, tidak "diloloskan sebagai teks".
 */
export const sanitizeArticleBodyNode = (
  raw: unknown
): SafeArticleBodyNode | null => {
  if (!raw || typeof raw !== 'object') return null
  const node = raw as UnsafeArticleBodyNode
  const type = node.type

  if (type === 'text') {
    if (typeof node.text !== 'string' || node.text.length === 0) return null
    return { type: 'text', text: node.text, marks: sanitizeMarks(node.marks) }
  }

  if (type === 'hardBreak') {
    return { type: 'hardBreak' }
  }

  if (type === 'image') {
    const attrs = node.attrs
    const src =
      attrs && typeof attrs === 'object'
        ? (attrs as { src?: unknown }).src
        : undefined
    if (!isSafeUrl(src)) return null // gambar dengan skema tak aman: seluruh node dibuang
    const alt =
      attrs && typeof attrs === 'object'
        ? (attrs as { alt?: unknown }).alt
        : undefined
    return { type: 'image', src, alt: typeof alt === 'string' ? alt : '' }
  }

  if (type === 'heading') {
    const attrs = node.attrs
    const level =
      attrs && typeof attrs === 'object'
        ? (attrs as { level?: unknown }).level
        : undefined
    return {
      type: 'heading',
      level: clampHeadingLevel(level),
      content: sanitizeChildren(node.content)
    }
  }

  if (
    type === 'doc' ||
    type === 'paragraph' ||
    type === 'bulletList' ||
    type === 'orderedList' ||
    type === 'listItem' ||
    type === 'blockquote'
  ) {
    if (!CONTAINER_NODE_TYPES.has(type)) return null // defensive, mirrors the check above
    return {
      type,
      content: sanitizeChildren(node.content)
    } as SafeArticleBodyNode
  }

  // Tipe tak dikenal (mis. `script`, atau apa pun yang belum ada allow-list-nya):
  // dibuang tanpa direkursi ke anak-anaknya.
  return null
}

/**
 * Titik masuk publik: menyaring seluruh dokumen `article.body` tersimpan.
 * Menerima `unknown` dengan sengaja — badan tulisan berasal dari kolom
 * `jsonb`, dan tidak pernah dipercaya bentuknya sebelum lolos di sini.
 */
export const sanitizeArticleBody = (
  rawBody: unknown
): SafeArticleBodyNode | null => sanitizeArticleBodyNode(rawBody)
