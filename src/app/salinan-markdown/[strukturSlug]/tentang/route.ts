import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { TENTANG_SETTINGS_KEYS } from '~/app/sitemap'
import { readLatestSettingsUpdate } from '~/db/query/site-settings'
import { toWibIsoString } from '~/lib/publikasi/tanggal-terbit'
import { buildArticleFrontMatter } from '~/lib/publikasi/article-front-matter'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import {
  VISI_TEXT,
  MISI_ITEMS,
  PRINSIP_ITEMS,
  PARADIGMA_ITEMS,
  KREDO_ITEMS
} from '~/lib/publikasi/tentang-content'

// Salinan Markdown `/tentang.md` (tiket 08, ADR 0024). `tentang` tidak
// dirender dari ProseMirror melainkan dari teks tetap (`tentang-content.ts`)
// — hanya gambarnya yang dari Pengaturan Situs — jadi penangan ini menulis
// prosa langsung, bukan memanggil `article-markdown-body.ts`. Urutan bagian
// SENGAJA mengikuti `tentang-scene.tsx` yang benar-benar dirender (Visi,
// Misi, Prinsip, Paradigma, Kredo) — bukan `karakteristik-section`,
// `unsur-section`, `sejarah-section`, yang tidak pernah dipasang ke halaman
// manapun (kode mati, bukan bagian dari cerita HTML yang harus disamai).

export const GET = async (
  _request: Request,
  { params }: { params: StrukturRouteParams }
) => {
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) return new Response(null, { status: 404 })

  const identity = await getStrukturIdentity(organizationId)
  if (!identity) return new Response(null, { status: 404 })

  // `undefined` kalau Struktur ini belum pernah menyimpan Pengaturan Situs
  // `tentang` sama sekali (beda dari `sitemap.ts`, front-matter `date` di
  // sini wajib diisi, bukan opsional) — jatuh ke waktu request sebagai
  // tanggal paling jujur yang tersedia untuk isi yang memang belum pernah
  // disunting oleh Struktur ini.
  const lastUpdate = await readLatestSettingsUpdate(
    TENTANG_SETTINGS_KEYS,
    organizationId
  )

  const canonicalUrl = `https://${resolveStrukturHost(identity)}/tentang`

  const frontMatter = buildArticleFrontMatter({
    title: 'Tentang',
    date: toWibIsoString(lastUpdate ?? new Date()),
    author: null,
    organization: identity.name,
    canonical: canonicalUrl,
    tags: []
  })

  const sections = [
    `## Visi\n\n${VISI_TEXT}`,
    `## Misi\n\n${MISI_ITEMS.map((item) => `- ${item}`).join('\n')}`,
    `## Prinsip Gerakan\n\n${PRINSIP_ITEMS.map(
      (item) => `- **${item.x}** adalah ${item.y} KAMMI.`
    ).join('\n')}`,
    `## Paradigma Gerakan\n\n${PARADIGMA_ITEMS.map(
      (item) => `- KAMMI adalah gerakan ${item.n}.`
    ).join('\n')}`,
    `## Kredo Gerakan\n\n${KREDO_ITEMS.join('\n\n')}`
  ]

  const markdown = `${frontMatter}# Tentang — ${identity.name}\n\n${sections.join('\n\n')}\n`

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${canonicalUrl}>; rel="canonical"`
    }
  })
}
