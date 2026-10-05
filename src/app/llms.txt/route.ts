import { headers } from 'next/headers'
import {
  resolveStrukturForRequestHost,
  type RequestStruktur
} from '~/lib/struktur/request-host'
import { requestOriginFromHost } from '~/lib/struktur/request-origin'
import { getStrukturIdentity } from '~/app/(main)/_data/struktur'
import { jenjangLabel, type StrukturJenjang } from '~/lib/struktur/jenjang'

// `llms.txt` per Situs Struktur (tiket 07, ADR 0024). Baca catatan tiket
// sebelum menaikkan prioritas atau cakupannya: tidak ada bukti vendor LLM
// mana pun membacanya, dan Google Search terang-terangan tidak memakainya.
// Ia diterbitkan karena murah dan karena Chrome Lighthouse mulai
// mengauditnya, bukan karena terbukti bekerja.
//
// Bentuknya mengikuti `robots.ts`/`sitemap.ts`: resolusi Struktur dari header
// `Host`, bukan dari segmen `[strukturSlug]` — alamatnya berekstensi (`.txt`),
// jadi `proxy.ts` tidak pernah merewrite-nya ke pohon rute tenant (lihat
// komentar `config.matcher` di sana).
//
// Alamat `tentang`/`pengurus` langsung menunjuk `.md` (tiket 08 sudah
// jalan berbarengan) — bukan HTML seperti disebut sebagai fallback tiket ini
// sendiri untuk kasus 08 belum ada.

const jenjangLabelForOrg = (type: string): string => {
  const known: readonly string[] = ['pp', 'pw', 'pd', 'pdln', 'pk']
  return known.includes(type) ? jenjangLabel(type as StrukturJenjang) : type
}

export const GET = async (): Promise<Response> => {
  const requestHost = (await headers()).get('host') ?? 'kammi.id'
  const origin = requestOriginFromHost(requestHost)
  if (!origin) return new Response(null, { status: 404 })

  let struktur: RequestStruktur | null
  try {
    struktur = await resolveStrukturForRequestHost(requestHost)
  } catch {
    return new Response(null, { status: 404 })
  }

  if (!struktur || !struktur.isSiteActive || struktur.isNonActive) {
    return new Response(null, { status: 404 })
  }

  const identity = await getStrukturIdentity(struktur.id)
  if (!identity) return new Response(null, { status: 404 })

  const isPP = struktur.type === 'pp'

  const lines = [
    `# ${identity.name}`,
    '',
    `> ${identity.name}, KAMMI tingkat ${jenjangLabelForOrg(struktur.type)}.`,
    '',
    '## Tentang',
    `- [Tentang](${origin}/tentang.md): Visi, misi, kredo, prinsip, dan paradigma gerakan KAMMI.`,
    '',
    '## Berita',
    `- [Berita](${origin}/berita.md): Indeks Berita terbit dari ${identity.name}.`,
    '',
    '## Pengurus',
    `- [Pengurus](${origin}/tentang/pengurus.md): Susunan Pengurus ${identity.name}.`,
    ...(isPP
      ? [
          '',
          '## Berita KAMMI se-Indonesia',
          `- [Berita KAMMI se-Indonesia](${origin}/berita/seindonesia): Arsip Berita gabungan seluruh Struktur KAMMI.`
        ]
      : [])
  ]

  return new Response(`${lines.join('\n')}\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  })
}
