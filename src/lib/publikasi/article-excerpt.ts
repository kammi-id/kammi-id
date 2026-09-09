import {
  sanitizeArticleBody,
  type SafeArticleBodyNode
} from '~/components/article-body-renderer'

const EXCERPT_MAX_LENGTH = 200

const extractText = (node: SafeArticleBodyNode): string => {
  if (node.type === 'text') return node.text
  if (node.type === 'hardBreak' || node.type === 'image') return ''
  return node.content.map(extractText).join('')
}

/**
 * Ringkasan Berita — spec "Solution": diturunkan otomatis dari paragraf
 * pertama, dipotong pada batas kata. Tidak ada kolom `excerpt`, jadi ini
 * satu-satunya sumber ringkasan di seluruh permukaan publik (RSS hari ini;
 * `description` JSON-LD dan meta ticket 03 nantinya memakai fungsi yang
 * sama, bukan menghitung ulang).
 *
 * Lewat `sanitizeArticleBody` yang sama dengan perender badan tulisan —
 * paragraf yang diambil sudah daftar-izin, jadi tidak ada markup mentah
 * yang bisa bocor ke sebuah `<description>` teks polos.
 */
export const deriveArticleExcerpt = (
  rawBody: unknown,
  maxLength: number = EXCERPT_MAX_LENGTH
): string => {
  const doc = sanitizeArticleBody(rawBody)
  if (!doc || doc.type !== 'doc') return ''

  const firstParagraph = doc.content.find((node) => node.type === 'paragraph')
  if (!firstParagraph) return ''

  const text = extractText(firstParagraph).trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}…`
}
