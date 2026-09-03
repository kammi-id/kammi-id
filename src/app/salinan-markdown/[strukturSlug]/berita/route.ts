import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { buildPermalinkBerita } from '~/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/_components/_permalink-berita'
import { listBeritaFeedForOrg } from '~/db/query/article'
import {
  deriveTahunBulanTerbit,
  formatTanggalTerbit
} from '~/lib/publikasi/tanggal-terbit'
import { deriveSummary } from '~/lib/seo'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

// Indeks Salinan Markdown `/berita.md` (tiket 06, ADR 0024) — "pintu masuk
// yang dipakai agen untuk menemukan sisanya". Daftar Berita Terbit satu
// Struktur: judul, tanggal, ringkasan (via `deriveSummary`, tiket 03), dan
// tautan `.md` tiap butir. Dipakai `listBeritaFeedForOrg` yang sama dengan
// `berita/feed.xml/route.ts` — sudah menyaring Terbit lewat
// `terbitCutoffForQuery`, tidak dihitung ulang di sini.

export const GET = async (
  _request: Request,
  { params }: { params: StrukturRouteParams }
) => {
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) return new Response(null, { status: 404 })

  const [items, identity] = await Promise.all([
    listBeritaFeedForOrg(organizationId),
    getStrukturIdentity(organizationId)
  ])
  if (!identity) return new Response(null, { status: 404 })

  const host = resolveStrukturHost(identity)
  const canonicalUrl = `https://${host}/berita`

  const lines = items.map((item) => {
    const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
    const permalinkPath = buildPermalinkBerita(tahun, bulan, item.slug)
    const summary = deriveSummary(item.body, { strukturName: identity.name })
    const tanggal = formatTanggalTerbit(item.publishedAt)
    return `- [${item.title}](https://${host}${permalinkPath}.md) — ${tanggal}${summary ? ` — ${summary}` : ''}`
  })

  const markdown = `# Berita — ${identity.name}\n\n${lines.join('\n')}\n`

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${canonicalUrl}>; rel="canonical"`
    }
  })
}
