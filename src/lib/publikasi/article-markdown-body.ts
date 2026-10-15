import {
  sanitizeArticleBody,
  type SafeArticleBodyNode,
  type SafeArticleMark
} from '~/components/article-body-renderer'
import { resolveAbsoluteSiteImage } from '~/lib/utils/site-image'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

// Cerminan langsung `renderNode`/`renderChildren` di
// `src/components/article-body-renderer/article-body-renderer.tsx` — ADR
// 0024 dan tiket 06: node yang sama, urutan case yang sama, daftar-izin yang
// sama. Ada satu uji terpisah (`article-markdown-body.test.ts`) yang
// membandingkan label `case` kedua berkas ini secara tekstual, supaya node
// baru yang ditambahkan ke satu sisi tapi lupa di sisi lain gagal di CI,
// bukan hilang diam-diam dari Salinan Markdown (Consequences ADR 0024).
//
// Berbeda dari `renderNode`, keluarannya bukan pohon React tapi string
// Markdown — jadi tidak ada elemen `key`, dan setiap node kontainer merakit
// string anak-anaknya sendiri alih-alih menaruh JSX.

type OrgHost = { type: string; slug: string }

const escapeMarkdownText = (text: string): string =>
  text.replace(/[\\`*_[\]]/g, (character) => `\\${character}`)

/**
 * `mark.href`/`node.src` yang relatif (mis. `/berita/2026/09/lain`) menjadi
 * absolut di sini — spec tiket 06: "Berkas Markdown sering dibaca jauh dari
 * asalnya". `mailto:`/`http(s)`-prefixed dibiarkan apa adanya.
 */
const absolutizeHref = (href: string, org: OrgHost): string => {
  if (href.startsWith('http') || href.startsWith('mailto:')) return href
  return `https://${resolveStrukturHost(org)}${href}`
}

const applyMarksMarkdown = (
  text: string,
  marks: SafeArticleMark[],
  org: OrgHost
): string =>
  marks.reduce<string>((node, mark) => {
    if (mark.type === 'bold') return `**${node}**`
    if (mark.type === 'italic') return `*${node}*`
    if (mark.type === 'link' && mark.href)
      return `[${node}](${absolutizeHref(mark.href, org)})`
    return node
  }, text)

/** Menempelkan `prefix` pada baris pertama, dan indentasi dua-spasi pada baris lanjutan — dipakai list item bertingkat (paragraf ganda, daftar bersarang). */
const withListMarker = (block: string, prefix: string): string =>
  block
    .split('\n')
    .map((line, i) => (i === 0 ? `${prefix}${line}` : `  ${line}`))
    .join('\n')

const renderListItems = async (
  items: SafeArticleBodyNode[],
  org: OrgHost,
  markerFor: (index: number) => string
): Promise<string> => {
  const rendered = await Promise.all(items.map((item) => renderNode(item, org)))
  return rendered
    .map((text, i) => withListMarker(text.trim(), markerFor(i)))
    .join('\n')
}

const renderNode = async (
  node: SafeArticleBodyNode,
  org: OrgHost
): Promise<string> => {
  switch (node.type) {
    case 'doc':
      return (await renderChildren(node.content, org)).join('')

    case 'paragraph':
      return `${(await renderChildren(node.content, org)).join('')}\n\n`

    case 'heading': {
      const prefix = '#'.repeat(node.level)
      return `${prefix} ${(await renderChildren(node.content, org)).join('')}\n\n`
    }

    case 'bulletList':
      return `${await renderListItems(node.content, org, () => '- ')}\n\n`

    case 'orderedList':
      return `${await renderListItems(
        node.content,
        org,
        (i) => `${i + 1}. `
      )}\n\n`

    case 'listItem':
      return (await renderChildren(node.content, org)).join('').trim()

    case 'blockquote': {
      const inner = (await renderChildren(node.content, org)).join('').trim()
      return `${inner
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')}\n\n`
    }

    case 'hardBreak':
      return '  \n'

    case 'image': {
      const src = await resolveAbsoluteSiteImage(node.src, org)
      if (!src) return ''
      return `![${escapeMarkdownText(node.alt)}](${src})\n\n`
    }

    case 'text':
      return applyMarksMarkdown(escapeMarkdownText(node.text), node.marks, org)

    default: {
      // Kalau baris ini gagal kompilasi, sebuah node ditambahkan ke
      // `SafeArticleBodyNode` tanpa case Markdown yang sepadan — persis
      // pembusukan senyap yang diperingatkan ADR 0024 Consequences.
      const _exhaustive: never = node
      return _exhaustive
    }
  }
}

const renderChildren = async (
  nodes: SafeArticleBodyNode[],
  org: OrgHost
): Promise<string[]> =>
  Promise.all(nodes.map((child) => renderNode(child, org)))

/**
 * Titik masuk publik — satu-satunya cara `article.body` menjadi Markdown.
 * Lewat `sanitizeArticleBody` yang sama dengan `ArticleBodyRenderer`, jadi
 * badan yang belum pernah dipercaya bentuknya (kolom `jsonb`) tersaring
 * sebelum sampai ke `renderNode` di atas.
 */
export const serializeArticleBodyToMarkdown = async (
  rawBody: unknown,
  org: OrgHost
): Promise<string> => {
  const safeDoc = sanitizeArticleBody(rawBody)
  if (!safeDoc) return ''

  const markdown = await renderNode(safeDoc, org)
  return `${markdown.trim()}\n`
}
