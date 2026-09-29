import type { StrukturJenjang } from './jenjang'

/**
 * The two Situs Struktur templates (spec "Template Situs", ticket 04). PP
 * keeps the full template that already exists; every other Jenjang gets the
 * lean one — identity, pengurus, Berita.
 */
export type SitusTemplateVariant = 'lengkap' | 'ramping'

export const resolveSitusTemplateVariant = (
  jenjang: StrukturJenjang
): SitusTemplateVariant => (jenjang === 'pp' ? 'lengkap' : 'ramping')

/**
 * Every Pengaturan Situs section that has a settings-page form. This is
 * deliberately **not** every section a template renders — Peta Jaringan,
 * the Berita preview, and (for PP) the future Berita Jaringan section have
 * no form of their own (their content is derived, not authored), so they
 * have no membership question to answer here.
 *
 * `hero-items` / `extra-items` are the `home-hero-items` / `home-extra-items`
 * settings keys (`HomeItemsList` on the settings page); `about`, `nav`,
 * `footer`, `metadata` are the single-object settings of the same name.
 * Leadership/pengurus is intentionally absent too — it lives on its own
 * `/dashboard/pages/managers` page, is consumed by every template, and so is
 * never conditionally hidden by Jenjang.
 */
export type SitusSectionKey =
  | 'hero-items'
  | 'about'
  | 'extra-items'
  | 'nav'
  | 'footer'
  | 'metadata'

/**
 * The single source of truth ticket 04 asks for: one table the public
 * template chooser (which component to render) and the settings-page section
 * filter (which forms to show) both read, so a Jenjang's section list is
 * never re-declared a second time and drifts.
 *
 * `nav`/`footer`/`metadata` apply to every Jenjang because they are chrome
 * (`layout.tsx`'s Navbar/Footer) or per-page SEO metadata, not body content
 * of the home template specifically — the lean template still has its own
 * navigation, footer, and page title/description.
 */
const SITUS_SECTIONS: Record<SitusTemplateVariant, readonly SitusSectionKey[]> =
  {
    lengkap: [
      'hero-items',
      'about',
      'extra-items',
      'nav',
      'footer',
      'metadata'
    ],
    ramping: ['nav', 'footer', 'metadata']
  }

export const situsSectionsFor = (
  jenjang: StrukturJenjang
): readonly SitusSectionKey[] =>
  SITUS_SECTIONS[resolveSitusTemplateVariant(jenjang)]

export const isSitusSectionVisible = (
  jenjang: StrukturJenjang,
  section: SitusSectionKey
): boolean => situsSectionsFor(jenjang).includes(section)
