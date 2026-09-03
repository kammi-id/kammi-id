import {
  sanitizeArticleBody,
  type SafeArticleBodyNode
} from '~/components/article-body-renderer'

// Ticket 03: satu sumber untuk `description`, `openGraph.description`,
// `twitter.description`, dan `Article.description` — tidak ada kolom
// `excerpt` (spec §"Solution"), jadi ringkasan SELALU diturunkan dari
// `article.body` pada saat render, lewat penyaring daftar-izin yang sama
// yang dipakai `ArticleBodyRenderer` (tidak ada jalur kedua yang harus
// dipercaya bentuknya).

const SUMMARY_MAX_LENGTH = 155

const flattenText = (node: SafeArticleBodyNode): string => {
  if (node.type === 'text') return node.text
  if (node.type === 'hardBreak') return ' '
  if (node.type === 'image') return ''
  return node.content.map(flattenText).join('')
}

/**
 * Depth-first, document order: menembus `blockquote`/`listItem` bersarang,
 * bukan cuma anak langsung `doc` — itu yang membuat badan yang dibuka
 * gambar, heading, atau kutipan tetap menemukan paragraf pertama yang
 * benar-benar punya teks (tiket 03).
 */
const findFirstParagraphWithText = (
  node: SafeArticleBodyNode
): string | null => {
  if (node.type === 'paragraph') {
    const text = flattenText(node).replace(/\s+/g, ' ').trim()
    return text.length > 0 ? text : null
  }
  if (node.type === 'image' || node.type === 'hardBreak' || node.type === 'text')
    return null

  for (const child of node.content) {
    const found = findFirstParagraphWithText(child)
    if (found) return found
  }
  return null
}

/**
 * Memotong pada batas kata di sekitar `maxLength`, menutup dengan elipsis
 * hanya kalau benar-benar terpotong. Kalau tidak ada spasi di sekitar
 * batasnya (satu kata raksasa), potong paksa di `maxLength` — tetap tidak
 * pernah melempar, hanya menghasilkan potongan tanpa batas kata yang rapi.
 */
const truncateAtWordBoundary = (
  text: string,
  maxLength = SUMMARY_MAX_LENGTH
): string => {
  if (text.length <= maxLength) return text

  const slice = text.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice
  return `${cut.trimEnd()}…`
}

export type DeriveSummaryFallback = {
  /** Nama kategori Berita, kalau ada. */
  categoryName?: string | null
  /** Selalu ada — jatuhan terakhir, tidak pernah string kosong. */
  strukturName: string
  /** `MetadataSettings.metaDescription` milik Struktur, kalau diisi. */
  strukturDescription?: string | null
}

/**
 * Ringkasan turunan (tiket 03) — fungsi murni, tanpa DB/`resolveSiteImage`.
 * Jatuhan berlapis kalau paragraf pertama yang punya teks tidak ada: nama
 * kategori + nama Struktur, lalu deskripsi Struktur, lalu nama Struktur
 * saja. `strukturName` wajib diisi pemanggil justru supaya lapis terakhir
 * ini tidak pernah kosong.
 */
export const deriveSummary = (
  rawBody: unknown,
  fallback: DeriveSummaryFallback
): string => {
  const safeDoc = sanitizeArticleBody(rawBody)
  const firstParagraphText = safeDoc
    ? findFirstParagraphWithText(safeDoc)
    : null

  if (firstParagraphText) return truncateAtWordBoundary(firstParagraphText)

  if (fallback.categoryName)
    return `${fallback.categoryName} — ${fallback.strukturName}`

  if (fallback.strukturDescription) return fallback.strukturDescription

  return fallback.strukturName
}
