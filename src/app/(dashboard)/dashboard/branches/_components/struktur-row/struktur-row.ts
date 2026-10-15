import type { StrukturKemampuan } from '~/lib/struktur/kemampuan'

/**
 * The row shape every Struktur surface in this route shares — grid, table,
 * sheet, and the page that feeds them.
 *
 * It has its own folder because it is imported from **outside** any one
 * component's folder, and that is the moment AGENTS.md says a file graduates.
 * It used to live in `branches-table/columns.tsx`, which meant the card and the
 * sheet reached past that folder's barrel to get at it — a violation the eslint
 * pattern happens not to catch in its relative spelling, which makes writing it
 * down here the only thing keeping it honest.
 */
export interface Organization {
  id: string
  name: string
  code: string
  slug: string
  type: string
  level: number
  parentId: string | null
  logo?: string | null
  isNonActive?: boolean
  // Situs Aktif (ADR 0012) — dibaca di sini murni untuk memperingatkan keras
  // saat slug diubah sementara Situsnya sudah aktif (ticket 10, ADR 0014):
  // slug Struktur tidak punya riwayat, jadi mengubahnya mematahkan seluruh
  // Permalink Berita di Situs itu tanpa jalan pulang.
  isSiteActive?: boolean
  state?: 'aktif' | 'non_aktif' | 'terhapus'
  childrenCount?: number
}

/**
 * A Struktur plus the flags the server computed for it (spec §8). Grid and
 * table take the same shape so neither can grow a rule the other does not have.
 */
export type StrukturRow = Organization & { kemampuan: StrukturKemampuan }

/**
 * Non-Aktif is read from the derived `state` column, never reassembled from
 * `deleted_at` and `is_non_active` at a surface — the derivation stays in one
 * place (ADR 0005).
 */
export const isNonAktif = (org: Organization): boolean =>
  org.state === 'non_aktif'
