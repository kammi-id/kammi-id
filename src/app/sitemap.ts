import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { listSitemapArticlesForOrg } from '~/db/query/sitemap'
import { readLatestSettingsUpdate } from '~/db/query/site-settings'
import {
  resolveStrukturForRequestHost,
  type RequestStruktur
} from '~/lib/struktur/request-host'
import { requestOriginFromHost } from '~/lib/struktur/request-origin'
import {
  deriveTahunBulanTerbit,
  resolveDateModified
} from '~/lib/publikasi/tanggal-terbit'

type SitemapEntry = MetadataRoute.Sitemap[number]

// Kunci Pengaturan Situs yang benar-benar dibaca setiap rute statis di
// bawah — dipakai sebagai `lastModified` (Google menuntutnya akurat dan
// bisa diverifikasi; `lastModified: new Date()` yang lama membuat setiap
// rute tampak baru diubah tiap kali sitemap diambil). Sengaja TIDAK
// termasuk 'nav'/'footer': keduanya chrome global tiap halaman, dan
// menyertakannya akan membuat setiap rute bergerak bersamaan — meniadakan
// gunanya membedakan rute mana yang sungguh berubah.
const BERANDA_SETTINGS_KEYS = [
  'metadata',
  'home-hero-items',
  'about',
  'leadership',
  'home-extra-items'
]
// Diekspor untuk `salinan-markdown/[strukturSlug]/tentang/route.ts` dan
// `.../tentang/pengurus/route.ts` (tiket 08) — `date` front-matter Salinan
// Markdown memakai kunci Pengaturan Situs yang sama dengan `lastModified` di
// sini, supaya keduanya tidak pernah menjawab beda soal "kapan terakhir
// diperbarui".
export const TENTANG_SETTINGS_KEYS = [
  'tentang-hero',
  'tentang-prinsip',
  'tentang-paradigma'
]
export const PENGURUS_SETTINGS_KEYS = ['leadership']

type StaticRouteLastModified = {
  beranda?: Date
  tentang?: Date
  pengurus?: Date
}

const publicRoutes = (
  origin: string,
  isPP: boolean,
  lastModified: StaticRouteLastModified
): SitemapEntry[] => [
  {
    url: origin,
    ...(lastModified.beranda ? { lastModified: lastModified.beranda } : {})
  },
  // `/berita` (arsip) dan `/event` tidak dirender dari Pengaturan Situs:
  // yang pertama daftar Berita dinamis tanpa satu tanggal ubah tunggal yang
  // representatif, yang kedua benar-benar statis. Keduanya tanpa
  // `lastModified` daripada mengarang — bukan bug, ADR-nya ada di ticket 05.
  { url: `${origin}/berita` },
  ...(isPP
    ? [
        {
          // Alamat lama `/berita/jaringan` sengaja TIDAK ikut didaftarkan:
          // ia hidup hanya sebagai redirect permanen (ADR 0016), dan sitemap
          // yang memuat dua alamat untuk satu isi adalah sinyal duplikat.
          url: `${origin}/berita/seindonesia`
        }
      ]
    : []),
  { url: `${origin}/event` },
  {
    url: `${origin}/tentang`,
    ...(lastModified.tentang ? { lastModified: lastModified.tentang } : {})
  },
  {
    url: `${origin}/tentang/pengurus`,
    ...(lastModified.pengurus ? { lastModified: lastModified.pengurus } : {})
  }
]

const resolveStaticRouteLastModified = async (
  struktur: RequestStruktur
): Promise<StaticRouteLastModified> => {
  const [beranda, tentang, pengurus] = await Promise.all([
    readLatestSettingsUpdate(BERANDA_SETTINGS_KEYS, struktur.id),
    readLatestSettingsUpdate(TENTANG_SETTINGS_KEYS, struktur.id),
    readLatestSettingsUpdate(PENGURUS_SETTINGS_KEYS, struktur.id)
  ])
  return { beranda, tentang, pengurus }
}

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const requestHost = (await headers()).get('host') ?? 'kammi.id'
  const origin = requestOriginFromHost(requestHost)
  if (!origin) return []

  let struktur: RequestStruktur | null
  try {
    struktur = await resolveStrukturForRequestHost(requestHost)
  } catch {
    // Basis data tidak terjangkau — sitemap kosong (200, tidak 500)
    // daripada meledak; halaman tetap terlayani, hanya sitemap-nya yang
    // kosong pada satu pengambilan itu.
    return []
  }

  if (!struktur || !struktur.isSiteActive || struktur.isNonActive) return []

  const [articles, staticLastModified] = await Promise.all([
    listSitemapArticlesForOrg(struktur.id),
    resolveStaticRouteLastModified(struktur)
  ])

  return [
    ...publicRoutes(origin, struktur.type === 'pp', staticLastModified),
    ...articles.halaman.map((halaman) => ({
      url: `${origin}/${halaman.slug}`,
      lastModified: halaman.updatedAt
    })),
    ...articles.berita.map((berita) => {
      const { tahun, bulan } = deriveTahunBulanTerbit(berita.publishedAt)

      return {
        url: `${origin}/berita/${tahun}/${bulan}/${berita.slug}`,
        lastModified: resolveDateModified(berita.updatedAt, berita.publishedAt)
      }
    })
  ]
}

export default sitemap
