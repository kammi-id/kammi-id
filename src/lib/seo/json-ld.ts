import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

export type BreadcrumbItem = { name: string; url: string }

/**
 * The minimal Struktur shape every `@id` needs — enough for
 * `resolveStrukturHost` to tell PP's apex host from a subdomain (ADR 0018).
 * Deliberately narrower than `Organization`: this file stays DB-free and
 * unit-testable off plain object literals (see `tests/lib/seo/json-ld.test.ts`),
 * never importing a DB type.
 */
export type StrukturJsonLdRef = { type: string; slug: string }

/**
 * The stable `@id` every Situs Struktur announces itself under — ticket 02.
 * Exported on its own because ticket 03 reuses this exact string as
 * `Article.publisher`'s `@id`: the connective tissue that lets a Berita page
 * read as coming from a first-party source rather than an anonymous one.
 */
export const strukturOrganizationId = (struktur: StrukturJsonLdRef): string =>
  `https://${resolveStrukturHost(struktur)}/#organization`

/**
 * Everything `buildOrganization`/`buildWebSite` need to describe one
 * Struktur, resolved by the caller (`_data/struktur.ts`) before it ever
 * reaches this pure module — no DB read, no `resolveSiteImage` call, and no
 * async happens in this file (ADR 0012: identity is passed, not fetched).
 */
export type StrukturJsonLdOrganization = StrukturJsonLdRef & {
  name: string
  /** Already resolved to an absolute URL by the caller. Omitted entirely
   *  (not an empty string) when the Struktur has no logo. */
  logo?: string
  /** Direct induk only, or `null` for PP (which has none). */
  parent: StrukturJsonLdRef | null
  /** Direct anak only — never the full descendant tree, and already
   *  filtered to exclude Terhapus, Non-Aktif, and Situs-not-yet-active
   *  children (ADR 0013) by the caller. */
  children: StrukturJsonLdRef[]
}

/**
 * PP's real, verifiable third-party identities. `sameAs` claims "this is the
 * same entity as", so only PP — the entity these accounts actually
 * belong to — gets them; a regional Struktur is a different entity and
 * inheriting these would corrupt its own entity resolution (ticket 02).
 */
const PP_SAME_AS = [
  'https://www.wikidata.org/wiki/Q85992000',
  'https://id.wikipedia.org/wiki/Kesatuan_Aksi_Mahasiswa_Muslim_Indonesia',
  'https://twitter.com/KAMMIPusat',
  'https://www.instagram.com/kammi.pusat',
  'https://www.instagram.com/kammi.connect',
  'https://www.facebook.com/kammipusat.official',
  'https://www.youtube.com/@kammitv8247',
  'https://www.tiktok.com/@kammi.pusat'
]

export const buildOrganization = (struktur: StrukturJsonLdOrganization) => {
  const isPP = struktur.type === 'pp'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': strukturOrganizationId(struktur),
    name: struktur.name,
    ...(isPP ? { alternateName: 'KAMMI' } : {}),
    url: `https://${resolveStrukturHost(struktur)}`,
    ...(struktur.logo ? { logo: struktur.logo } : {}),
    ...(struktur.parent
      ? {
          parentOrganization: {
            '@id': strukturOrganizationId(struktur.parent)
          }
        }
      : {}),
    ...(struktur.children.length > 0
      ? {
          subOrganization: struktur.children.map((child) => ({
            '@id': strukturOrganizationId(child)
          }))
        }
      : {}),
    ...(isPP ? { sameAs: PP_SAME_AS } : {})
  }
}

export const buildWebSite = (
  struktur: StrukturJsonLdRef & { name: string }
) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: struktur.name,
  url: `https://${resolveStrukturHost(struktur)}`,
  publisher: { '@id': strukturOrganizationId(struktur) }
})

/**
 * `struktur` menentukan host absolut tiap `item` (tiket 03 — bug yang sama
 * dengan tiket 02: sebelumnya SELALU `https://www.kammi.id`, membuat
 * breadcrumb Situs Struktur mana pun mengaku sebagai PP).
 */
export const buildBreadcrumb = (
  items: BreadcrumbItem[],
  struktur: StrukturJsonLdRef
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://${resolveStrukturHost(struktur)}${item.url}`
  }))
})

/**
 * Berita: `Article`, bukan `NewsArticle` — KAMMI.id situs organisasi, bukan
 * ruang redaksi (spec §"Solution"). `publisher` dan jatuhan `author` sama-
 * sama merujuk `@id` Struktur lewat `strukturOrganizationId`, bukan
 * menyalin objek `Organization` — itulah yang menyatukan Berita dengan
 * simpul entitas Struktur penerbitnya di graf.
 */
export type ArticleJsonLdInput = {
  headline: string
  description: string
  /** Absolut, Gambar Utama — dilewati sama sekali kalau tidak ada. */
  image?: string
  datePublished: string
  dateModified: string
  articleSection?: string
  keywords: string[]
  /** Permalink absolut — dipakai untuk `mainEntityOfPage`. */
  url: string
  publisher: StrukturJsonLdRef
  /** `Person.name` dari `article.penulis`, kalau terisi. */
  authorName?: string | null
}

export const buildArticle = (input: ArticleJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: input.headline,
  description: input.description,
  ...(input.image ? { image: input.image } : {}),
  datePublished: input.datePublished,
  dateModified: input.dateModified,
  inLanguage: 'id-ID',
  ...(input.articleSection ? { articleSection: input.articleSection } : {}),
  ...(input.keywords.length > 0 ? { keywords: input.keywords } : {}),
  mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
  publisher: { '@id': strukturOrganizationId(input.publisher) },
  author: input.authorName
    ? { '@type': 'Person', name: input.authorName }
    : { '@id': strukturOrganizationId(input.publisher) }
})

/**
 * Halaman (`article.type === 'page'`): tak bertanggal (`CONTEXT.md`), jadi
 * `WebPage`, bukan `Article` — tiket 03.
 */
export type WebPageJsonLdInput = {
  name: string
  description: string
  url: string
}

export const buildWebPage = (input: WebPageJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: input.name,
  description: input.description,
  url: input.url,
  inLanguage: 'id-ID'
})
