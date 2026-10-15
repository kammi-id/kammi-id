import { Fragment, type ReactNode } from 'react'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { sanitizeArticleBody } from './utils'
import type { SafeArticleBodyNode, SafeArticleMark } from './types'

// Perender daftar-izin untuk `article.body` (dokumen Tiptap/ProseMirror
// tersimpan). Badan tulisan DISELESAIKAN dari dokumen JSON pada setiap
// request — tidak pernah dibekukan menjadi HTML saat terbit — dan tidak
// pernah lewat `dangerouslySetInnerHTML`: setiap node dipetakan tangan ke
// elemen React lewat `sanitizeArticleBody` (utils.ts), yang membuang apa
// pun di luar daftar-izin sebelum sampai ke sini.

const applyMarks = (text: string, marks: SafeArticleMark[]): ReactNode => {
  return marks.reduce<ReactNode>((node, mark) => {
    if (mark.type === 'bold') return <strong>{node}</strong>
    if (mark.type === 'italic') return <em>{node}</em>
    if (mark.type === 'link' && mark.href)
      return (
        <a href={mark.href} rel='noopener noreferrer'>
          {node}
        </a>
      )
    return node
  }, text)
}

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

const renderNode = async (
  node: SafeArticleBodyNode,
  key: number
): Promise<ReactNode> => {
  switch (node.type) {
    case 'doc':
      return <Fragment key={key}>{await renderChildren(node.content)}</Fragment>

    case 'paragraph':
      return <p key={key}>{await renderChildren(node.content)}</p>

    case 'heading': {
      const Tag = HEADING_TAGS[node.level - 1]
      return <Tag key={key}>{await renderChildren(node.content)}</Tag>
    }

    case 'bulletList':
      return <ul key={key}>{await renderChildren(node.content)}</ul>

    case 'orderedList':
      return <ol key={key}>{await renderChildren(node.content)}</ol>

    case 'listItem':
      return <li key={key}>{await renderChildren(node.content)}</li>

    case 'blockquote':
      return (
        <blockquote key={key}>{await renderChildren(node.content)}</blockquote>
      )

    case 'hardBreak':
      return <br key={key} />

    case 'image': {
      const resolvedSrc = await resolveSiteImage(node.src)
      if (!resolvedSrc) return null
      // eslint-disable-next-line @next/next/no-img-element -- gambar di badan tulisan tidak berdimensi tetap; next/image butuh width/height atau fill.
      return <img key={key} src={resolvedSrc} alt={node.alt} loading='lazy' />
    }

    case 'text':
      return <Fragment key={key}>{applyMarks(node.text, node.marks)}</Fragment>

    default:
      return null
  }
}

const renderChildren = async (
  nodes: SafeArticleBodyNode[]
): Promise<ReactNode[]> =>
  Promise.all(nodes.map((child, i) => renderNode(child, i)))

type ArticleBodyRendererProps = {
  body: unknown
}

export const ArticleBodyRenderer = async ({
  body
}: ArticleBodyRendererProps) => {
  const safeDoc = sanitizeArticleBody(body)
  if (!safeDoc) return null

  return <div className='prose max-w-none'>{await renderNode(safeDoc, 0)}</div>
}
