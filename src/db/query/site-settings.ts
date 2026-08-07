import { db } from '../db'
import { siteSettings } from '../schema/site-settings.sql'
import { organizationNotDeleted } from './organization'
import { eq, sql } from 'drizzle-orm'

export type HeroSettings = {
  badgeText: string
  title: string
  titleAccent: string
  subtitle: string
  heroImageUrl: string
  heroImageAlt: string
  quoteText: string
  quoteAttribution: string
  cta1Label: string
  cta1Href: string
  cta2Label: string
  cta2Href: string
}

export type AboutSettings = {
  paragraph1: string
  paragraph2: string
  readMoreLabel: string
  readMoreHref: string
  sejarahCardTitle: string
  sejarahCardDescription: string
  sejarahCardLinkLabel: string
  sejarahCardLinkHref: string
}

export type LeaderMember = {
  id: string
  name: string
  role: string
  photoUrl: string
}

export type LeaderBlock = {
  id: string
  title: string
  members: LeaderMember[]
}

export type LeadershipSettings = {
  periodLabel: string
  heading: string
  triumvirate: {
    ketua: { name: string; photoUrl: string }
    sekretaris: { name: string; photoUrl: string }
    bendahara: { name: string; photoUrl: string }
  }
  /** @deprecated Use leaderBlocks instead */
  leaders: Array<{ name: string; role: string; photoUrl: string }>
  leaderBlocks: LeaderBlock[]
}

export type ActionsSettings = {
  heading: string
  subheading: string
  programs: Array<{
    id: string
    label: string
    sublabel: string
    description: string
    imageUrl: string
    featured: boolean
  }>
}

export type NavSettings = {
  navLinks: Array<{ label: string; href: string }>
  ctaBergabungLabel: string
  ctaBergabungHref: string
}

export type FooterSettings = {
  socialIG: string
  socialTwitter: string
  socialYoutube: string
  socialTelegram: string
  footerKAMMI: Array<{ label: string; href: string }>
  footerBeritaData: Array<{ label: string; href: string }>
  footerIkutiKami: Array<{ label: string; href: string }>
}

export type MetadataSettings = {
  pageTitle: string
  metaDescription: string
  ogImageUrl: string
}

export type TentangSettings = {
  heroImageUrl: string
  readonly prinsipImages: [string, string, string, string, string, string]
  readonly paradigmaImages: [string, string, string, string]
}

export type HomeItem = {
  id: string
  imageUrl: string
  title: string
  description: string
  badgeText: string
}

export type HomeHeroItemsSettings = {
  items: HomeItem[]
}

export type HomeExtraItemsSettings = {
  items: HomeItem[]
}

export const SETTINGS_DEFAULTS = {
  hero: {
    badgeText: 'Kesatuan Aksi Mahasiswa Muslim Indonesia',
    title: 'Pelopor Kebaikan',
    titleAccent: 'untuk',
    subtitle:
      'Membangun peradaban dengan intelektualitas, integritas, dan amal nyata. Membawa mahasiswa muslim untuk berani, membentuk Indonesia dengan semangat keislaman, kebangsaan, dan intelektualitas.',
    heroImageUrl: 'https://picsum.photos/seed/kammi-hero/480/580',
    heroImageAlt: 'Pengurus KAMMI berbicara dalam forum nasional',
    quoteText:
      'Seperti akar yang menancap dalam, perubahan besar dimulai dari sini.',
    quoteAttribution: 'Semangat KAMMI',
    cta1Label: 'Mulai Bergabung',
    cta1Href: '#bergabung',
    cta2Label: 'Pelajari Visi',
    cta2Href: '#tentang'
  } satisfies HeroSettings,

  about: {
    paragraph1:
      'KAMMI adalah wadah perjuangan permanen bagi mahasiswa muslim yang berkomitmen membangun Indonesia dengan semangat keislaman, kebangsaan, dan intelektualitas. Kami bergerak melampaui retorika, menghadirkan aksi nyata sebagai anak bangsa.',
    paragraph2:
      'Didirikan pada 1998, KAMMI telah melahirkan ribuan kader yang kini berkontribusi di berbagai sektor kehidupan bangsa: pemerintahan, akademisi, wirausaha, dan masyarakat sipil.',
    readMoreLabel: 'Lebih jauh tentang kami',
    readMoreHref: '/tentang',
    sejarahCardTitle: 'Lahir dari Rahim Reformasi',
    sejarahCardDescription:
      'Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang konsisten menjaga arah perubahan tetap berada di jalur keadilan dan kebenaran.',
    sejarahCardLinkLabel: 'Baca sejarah lengkap',
    sejarahCardLinkHref: '/tentang#sejarah'
  } satisfies AboutSettings,

  leadership: {
    periodLabel: 'Masa Jabatan KAMMI',
    heading: 'Mengenal Pengurus Pusat KAMMI',
    triumvirate: {
      ketua: { name: '', photoUrl: '' },
      sekretaris: { name: '', photoUrl: '' },
      bendahara: { name: '', photoUrl: '' }
    },
    leaders: [],
    leaderBlocks: []
  } satisfies LeadershipSettings,

  actions: {
    heading: 'Aksi Nyata KAMMI Untuk Indonesia',
    subheading:
      'Manifestasi intelektualitas dan kepedulian sosial melalui aksi nyata di seluruh Indonesia.',
    programs: [
      {
        id: 'csa-2024',
        label: 'Community Service Action',
        sublabel: 'Ekspedisi Bakti Nusantara 2024',
        description:
          'Aksi bersama di seluruh wilayah untuk memperkuat Indonesia Timur.',
        imageUrl: 'https://picsum.photos/seed/aksi-1/600/700',
        featured: true
      },
      {
        id: 'mengajar',
        label: 'KAMMI Mengajar',
        sublabel: 'Program Pendidikan Bangsa',
        description: 'Volunteer pengajaran di daerah 3T.',
        imageUrl: 'https://picsum.photos/seed/aksi-2/400/280',
        featured: false
      },
      {
        id: 'leadership',
        label: 'Youth Leadership',
        sublabel: 'Pekan Kepemimpinan Nasional',
        description: 'Forum pembangunan kapasitas pemuda.',
        imageUrl: 'https://picsum.photos/seed/aksi-3/400/280',
        featured: false
      },
      {
        id: 'literasi',
        label: 'Laskar Literasi',
        sublabel: 'Gerakan Literasi Mahasiswa',
        description: 'Distribusi buku dan akses pendidikan.',
        imageUrl: 'https://picsum.photos/seed/aksi-4/400/280',
        featured: false
      }
    ]
  } satisfies ActionsSettings,

  nav: {
    navLinks: [
      { label: 'Tentang', href: '/tentang' },
      { label: 'Berita', href: '/berita' },
      { label: 'Event', href: '/event' },
      { label: 'Dashboard', href: '/dashboard' }
    ],
    ctaBergabungLabel: 'Bergabung di KAMMI',
    ctaBergabungHref: '#bergabung'
  } satisfies NavSettings,

  footer: {
    socialIG: '#',
    socialTwitter: '#',
    socialYoutube: '#',
    socialTelegram: '#',
    footerKAMMI: [
      { label: 'Tentang Kami', href: '#tentang' },
      { label: 'Sejarah', href: '#' },
      { label: 'Visi & Misi', href: '#' },
      { label: 'Struktur Organisasi', href: '#' }
    ],
    footerBeritaData: [
      { label: 'Publikasi', href: '#event' },
      { label: 'Laporan Tahunan', href: '#' },
      { label: 'Statistik Kader', href: '#' },
      { label: 'Siaran Pers', href: '#' }
    ],
    footerIkutiKami: [
      { label: 'Instagram', href: '#' },
      { label: 'Twitter / X', href: '#' },
      { label: 'YouTube', href: '#' },
      { label: 'Telegram', href: '#' }
    ]
  } satisfies FooterSettings,

  metadata: {
    pageTitle: 'KAMMI.id — Pelopor Kebaikan untuk Indonesia',
    metaDescription:
      'Kesatuan Aksi Mahasiswa Muslim Indonesia. Membangun peradaban dengan intelektualitas, integritas, dan amal nyata.',
    ogImageUrl: '/assets/logo.png'
  } satisfies MetadataSettings,

  tentang: {
    heroImageUrl: '',
    prinsipImages: ['', '', '', '', '', ''],
    paradigmaImages: ['', '', '', '']
  } satisfies TentangSettings,

  homeHeroItems: { items: [] } satisfies HomeHeroItemsSettings,
  homeExtraItems: { items: [] } satisfies HomeExtraItemsSettings
} as const

/**
 * Spec §7, `site_settings.organization_id`. Pengaturan Situs milik Struktur
 * Terhapus jatuh ke `fallback` — persis jawaban yang didapat Struktur yang
 * memang tidak pernah punya pengaturan, jadi tidak ada beda jawaban antara
 * "tidak pernah ada" dan "pernah ada lalu dihapus" (spec §1.4).
 */
export const readSiteSettings = async <T>(
  key: string,
  fallback: T,
  organizationId: string
): Promise<T> => {
  try {
    const rows = await db
      .select({ data: siteSettings.data })
      .from(siteSettings)
      .where(
        sql`${siteSettings.key} = ${key}
          AND ${siteSettings.organizationId} = ${organizationId}
          AND ${organizationNotDeleted(siteSettings.organizationId)}`
      )
      .limit(1)

    if (!rows.length) return fallback
    return rows[0].data as T
  } catch {
    return fallback
  }
}

export const upsertSiteSettings = async (
  key: string,
  data: unknown,
  organizationId: string
): Promise<void> => {
  await db
    .insert(siteSettings)
    .values({
      key,
      organizationId,
      data: data as Record<string, unknown>
    })
    .onConflictDoUpdate({
      target: [siteSettings.key, siteSettings.organizationId],
      set: { data: data as Record<string, unknown>, updatedAt: sql`now()` }
    })
}
