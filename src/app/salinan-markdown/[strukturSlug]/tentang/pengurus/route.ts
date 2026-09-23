import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { PENGURUS_SETTINGS_KEYS } from '~/app/sitemap'
import { readLatestSettingsUpdate } from '~/db/query/site-settings'
import { toWibIsoString } from '~/lib/publikasi/tanggal-terbit'
import { buildArticleFrontMatter } from '~/lib/publikasi/article-front-matter'
import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

// Salinan Markdown `/tentang/pengurus.md` (tiket 08, ADR 0024). Periode,
// triumvirat, dan `leaderBlocks` — bukan foto (ticket 08: "yang dicari agen
// di halaman ini adalah nama, jabatan, dan periode"). Bagian yang belum
// terisi tidak dituliskan sebagai heading kosong, sama seperti
// `PengurusHero`/`LeadersDirectory` yang balik `null` pada kondisi yang sama.

export const GET = async (
  _request: Request,
  { params }: { params: StrukturRouteParams }
) => {
  const organizationId = await resolveStrukturIdFromParams(params)
  if (!organizationId) return new Response(null, { status: 404 })

  const identity = await getStrukturIdentity(organizationId)
  if (!identity) return new Response(null, { status: 404 })

  const [settings, lastUpdate] = await Promise.all([
    getLeadershipSettings(organizationId),
    readLatestSettingsUpdate(PENGURUS_SETTINGS_KEYS, organizationId)
  ])

  const canonicalUrl = `https://${resolveStrukturHost(identity)}/tentang/pengurus`

  const frontMatter = buildArticleFrontMatter({
    title: 'Pengurus',
    date: toWibIsoString(lastUpdate ?? new Date()),
    author: null,
    organization: identity.name,
    canonical: canonicalUrl,
    tags: []
  })

  const sections: string[] = []

  if (settings.periodLabel) sections.push(settings.periodLabel)

  const { ketua, sekretaris, bendahara } = settings.triumvirate
  const hasTriumvirate = [ketua, sekretaris, bendahara].some((p) => p.name)
  if (hasTriumvirate) {
    sections.push(
      [
        '## Ketua, Sekretaris, dan Bendahara',
        `- Ketua: ${ketua.name || '—'}`,
        `- Sekretaris: ${sekretaris.name || '—'}`,
        `- Bendahara: ${bendahara.name || '—'}`
      ].join('\n')
    )
  }

  // `leaderBlocks` menang atas `leaders` legacy, sama seperti
  // `LeadersDirectory` — lihat komentar "Legacy flat leaders fallback" di sana.
  if (settings.leaderBlocks.length > 0) {
    for (const block of settings.leaderBlocks) {
      if (block.members.length === 0) continue
      const heading = block.title || 'Pengurus'
      const members = block.members
        .map((member) => `- ${member.name} — ${member.role}`)
        .join('\n')
      sections.push(`## ${heading}\n\n${members}`)
    }
  } else if (settings.leaders.length > 0) {
    const members = settings.leaders
      .map((leader) => `- ${leader.name} — ${leader.role}`)
      .join('\n')
    sections.push(`## Pengurus\n\n${members}`)
  }

  const body = sections.length > 0 ? `\n\n${sections.join('\n\n')}` : ''
  const markdown = `${frontMatter}# Pengurus — ${identity.name}${body}\n`

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${canonicalUrl}>; rel="canonical"`
    }
  })
}
