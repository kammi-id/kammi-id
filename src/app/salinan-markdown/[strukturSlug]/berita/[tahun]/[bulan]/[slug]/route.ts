import { NextResponse } from 'next/server'
import {
  resolveOutcome,
  type BeritaDetailParams
} from '~/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/page'
import { buildPermalinkBerita } from '~/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/_components/_permalink-berita'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import { toWibIsoString } from '~/lib/publikasi/tanggal-terbit'
import { serializeArticleBodyToMarkdown } from '~/lib/publikasi/article-markdown-body'
import { buildArticleFrontMatter } from '~/lib/publikasi/article-front-matter'

// Salinan Markdown Permalink Berita (tiket 06, ADR 0024). Bukan penangan
// kedua — `proxy.ts` merewrite DUA pemicu ke sini (suffix `.md` dan
// `Accept: text/markdown` pada alamat biasa), dan `resolveOutcome` yang
// dipakai di sini adalah PERSIS fungsi yang sama yang dipakai
// `page.tsx` — gerbang Terbit, Diarsipkan, dan riwayat Permalink (ADR 0014)
// tidak pernah diimplementasikan ulang di sini.

export const GET = async (
  request: Request,
  { params }: { params: BeritaDetailParams }
) => {
  const { tahun, bulan, slug } = await params
  const hasMdSuffix = request.headers.get('x-kammi-md-suffix') === '1'

  const { organizationId, articleRow, org, outcome } =
    await resolveOutcome(params)

  if (!organizationId || !outcome || outcome.kind === 'not-found') {
    return new Response(null, { status: 404 })
  }

  if (outcome.kind === 'redirect') {
    // Tiket 06: "alamat lama ber-`.md` ikut `permanentRedirect` ke alamat
    // baru ber-`.md`" — target pengalihan membawa suffix persis kalau
    // request MASUK-nya membawa suffix (proxy.ts mengangkut informasi itu
    // lewat header, karena pathname yang sudah direwrite tidak lagi
    // menyimpannya).
    const target = `${outcome.to}${hasMdSuffix ? '.md' : ''}`
    return NextResponse.redirect(new URL(target, request.url), 308)
  }

  // outcome.kind === 'ok' dari sini — dan resolvePermalinkBerita hanya
  // menjawab 'ok' ketika `articleRow` ada dan `publishedAt`-nya terisi,
  // persis prasyarat yang sama yang dipegang `page.tsx`.
  if (!articleRow || !articleRow.publishedAt || !org) {
    return new Response(null, { status: 404 })
  }

  const permalinkPath = buildPermalinkBerita(Number(tahun), Number(bulan), slug)
  const permalinkUrl = `https://${resolveStrukturHost(org)}${permalinkPath}`

  const frontMatter = buildArticleFrontMatter({
    title: articleRow.title,
    date: toWibIsoString(articleRow.publishedAt),
    author: articleRow.penulis,
    organization: org.name,
    canonical: permalinkUrl,
    tags: articleRow.tags
  })
  const body = await serializeArticleBodyToMarkdown(articleRow.body, org)
  const markdown = `${frontMatter}\n# ${articleRow.title}\n\n${body}`

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // ADR 0024: kanonik lewat header HTTP, bukan `noindex`/`Disallow` —
      // keduanya secara eksplisit ditolak karena membatalkan gunanya
      // sendiri. Selalu menunjuk Permalink HTML, tidak pernah alamat `.md`
      // ini sendiri.
      Link: `<${permalinkUrl}>; rel="canonical"`
    }
  })
}
