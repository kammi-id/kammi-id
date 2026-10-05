import { childTypesOf, type StrukturJenjang } from '~/lib/struktur/jenjang'

/**
 * How the branches surface writes the Jenjang that may sit beneath a Struktur.
 *
 * Two registers, one source. The Tambah button has room for an acronym; the
 * `Select` inside the form has room for the whole name and needs it, because
 * "PDLN" is not a word anyone reads cold. Both are derived from `childTypesOf`
 * so the shape of the tree is stated once and worded twice — the arrangement
 * that replaces three drifting copies of the same table.
 *
 * The old button label for a PW read "PD/PK", which no gate ever agreed with:
 * `childTypesOf('pw')` is `['pd']`, and the form only ever offered PD. A label
 * that names a Jenjang the surface cannot create is worse than a terse one.
 *
 * This file is `_`-prefixed and sits at the `_components/` root because it is a
 * companion free of side effects — no `'use server'`, no session, no database.
 * It is imported by client components, which is the whole reason `childTypesOf`
 * lives outside `~/lib/auth/kestrukturan`.
 */
const NAMA_JENJANG: Record<StrukturJenjang, string> = {
  pp: 'Pengurus Pusat (PP)',
  pw: 'Pengurus Wilayah (PW)',
  pdln: 'Pengurus Daerah Luar Negeri (PDLN)',
  pd: 'Pengurus Daerah (PD)',
  pk: 'Pengurus Komisariat (PK)'
}

/**
 * The acronym form, for the Tambah button — "PW/PDLN", "PD", "PK". Empty when
 * the Jenjang is a leaf, which is the caller's cue that there is no button to
 * render at all.
 */
export const labelJenjangAnak = (parentType: string): string =>
  childTypesOf(parentType)
    .map((jenjang) => jenjang.toUpperCase())
    .join('/')

/** The whole-name form, for the `Select` in the Tambah form. */
export const opsiJenjangAnak = (
  parentType: string
): { value: StrukturJenjang; label: string }[] =>
  childTypesOf(parentType).map((jenjang) => ({
    value: jenjang,
    label: NAMA_JENJANG[jenjang]
  }))
