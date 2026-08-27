import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'
import { resolveStrukturIdFromParams } from '~/app/(main)/_data/struktur'
import { listBeritaArsipForOrg } from '~/db/query/article'

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

  const { items } = await listBeritaArsipForOrg(organizationId)
  const origin = new URL(request.url).origin
  const siteName = items[0]?.organization.name ?? 'KAMMI'
  const itemsXml = items
    .map((item) => {
      const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
      const permalink = `${origin}/berita/${tahun}/${bulan}/${item.slug}`

      return `    <item>\n      <title>${escapeXml(item.title)}</title>\n      <link>${permalink}</link>\n      <guid isPermaLink="true">${permalink}</guid>\n      <pubDate>${item.publishedAt.toUTCString()}</pubDate>\n    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(siteName)}</title>\n    <link>${origin}/berita</link>\n    <description>Berita terbaru dari ${escapeXml(siteName)}</description>\n${itemsXml}\n  </channel>\n</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}
