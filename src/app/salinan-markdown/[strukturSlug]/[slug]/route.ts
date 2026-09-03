import {
  resolveOutcome,
  type HalamanDetailParams
} from '~/app/(main)/[strukturSlug]/[slug]/page'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import { toWibIsoString } from '~/lib/publikasi/tanggal-terbit'
import { serializeArticleBodyToMarkdown } from '~/lib/publikasi/article-markdown-body'
import { buildArticleFrontMatter } from '~/lib/publikasi/article-front-matter'

// Salinan Markdown Permalink Halaman (tiket 06, ADR 0024). Sama seperti
// `berita/[tahun]/[bulan]/[slug]/route.ts` — `resolveOutcome` diimpor dari
// `page.tsx`, bukan diimplementasikan ulang. Halaman "tidak bertanggal"
// (CONTEXT.md, `_permalink-halaman.ts`): tidak ada gerbang Terbit, dan tidak
// ada konsep riwayat Permalink — jadi tidak ada cabang `redirect` di sini,
// beda dari Berita.

export const GET = async (
  _request: Request,
  { params }: { params: HalamanDetailParams }
) => {
  const { organizationId, articleRow, identity, outcome } =
    await resolveOutcome(params)

  if (
    !organizationId ||
    !outcome ||
    outcome.kind === 'not-found' ||
    !articleRow ||
    !identity
  ) {
    return new Response(null, { status: 404 })
  }

  const permalinkUrl = `https://${resolveStrukturHost(identity)}/${articleRow.slug}`

  const frontMatter = buildArticleFrontMatter({
    title: articleRow.title,
    // Halaman tidak bertanggal — `updatedAt` adalah analog terdekat untuk
    // "tanggal" pada konten yang memang tidak punya tanggal terbit.
    date: toWibIsoString(articleRow.updatedAt),
    author: articleRow.penulis,
    organization: identity.name,
    canonical: permalinkUrl,
    tags: articleRow.tags
  })
  const body = await serializeArticleBodyToMarkdown(articleRow.body, identity)
  const markdown = `${frontMatter}\n# ${articleRow.title}\n\n${body}`

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${permalinkUrl}>; rel="canonical"`
    }
  })
}
