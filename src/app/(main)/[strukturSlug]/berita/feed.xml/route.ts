import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'
import { deriveArticleExcerpt } from '~/lib/publikasi/article-excerpt'
import {
  resolveStrukturIdFromParams,
  getStrukturIdentity
} from '~/app/(main)/_data/struktur'
import { listBeritaFeedForOrg } from '~/db/query/article'
import { requestOriginFromHost } from '~/lib/struktur/request-origin'
import { resolveAbsoluteSiteImage } from '~/lib/utils/site-image'

const escapeXml = (value: string): string =>
  value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    }

    return entities[character]
  })

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ strukturSlug: string }> }
) => {
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) return new Response(null, { status: 404 })

  const origin = requestOriginFromHost(
    request.headers.get('host') ?? new URL(request.url).host
  )
  if (!origin) return new Response(null, { status: 404 })

  const [items, identity] = await Promise.all([
    listBeritaFeedForOrg(organizationId),
    getStrukturIdentity(organizationId)
  ])

  const siteName = identity?.name ?? 'KAMMI'
  const logoUrl = identity
    ? await resolveAbsoluteSiteImage(identity.logo, identity)
    : undefined

  const itemsXml = items
    .map((item) => {
      const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
      const permalink = `${origin}/berita/${tahun}/${bulan}/${item.slug}`
      const description = deriveArticleExcerpt(item.body)

      return [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${permalink}</link>`,
        `      <guid isPermaLink="true">${permalink}</guid>`,
        `      <pubDate>${item.publishedAt.toUTCString()}</pubDate>`,
        description
          ? `      <description>${escapeXml(description)}</description>`
          : null,
        // `<dc:creator>` (Dublin Core), bukan RSS 2.0 `<author>`: elemen
        // `<author>` menuntut ALAMAT EMAIL yang valid, sementara `penulis`
        // (CONTEXT.md) sengaja teks bebas — nama, bukan alamat surel.
        // Memaksakannya ke `<author>` akan menghasilkan XML yang menyalahi
        // spesifikasi RSS 2.0 itu sendiri.
        item.penulis
          ? `      <dc:creator>${escapeXml(item.penulis)}</dc:creator>`
          : null,
        '    </item>'
      ]
        .filter((line): line is string => line !== null)
        .join('\n')
    })
    .join('\n')

  const image = logoUrl
    ? `    <image>\n      <url>${escapeXml(logoUrl)}</url>\n      <title>${escapeXml(siteName)}</title>\n      <link>${origin}/berita</link>\n    </image>\n`
    : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n  <channel>\n    <title>${escapeXml(siteName)}</title>\n    <link>${origin}/berita</link>\n    <description>Berita terbaru dari ${escapeXml(siteName)}</description>\n    <language>id-ID</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    <atom:link rel="self" type="application/rss+xml" href="${origin}/berita/feed.xml" />\n${image}${itemsXml}\n  </channel>\n</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}
