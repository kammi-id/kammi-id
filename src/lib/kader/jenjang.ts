/** Jenjang Kader — the AB rung a member currently holds. */
export type KaderJenjang = 'ab1' | 'ab2' | 'ab3'

/**
 * Canonical spelling is `AB1`, no space — matching `CONTEXT.md` and Nomor
 * Induk Anggota usage. `AB 1` circulated too, copy-pasted with a space into
 * several component files; this table is the one place that spelling gets
 * decided.
 */
const JENJANG_LABELS: Record<KaderJenjang, string> = {
  ab1: 'AB1',
  ab2: 'AB2',
  ab3: 'AB3'
}

const isKaderJenjang = (value: string): value is KaderJenjang =>
  value in JENJANG_LABELS

/**
 * Human-facing Jenjang label. Unmapped values fall back to the raw code,
 * uppercased — a safety net, not a translation.
 */
export const kaderJenjangLabel = (jenjang: string): string =>
  isKaderJenjang(jenjang) ? JENJANG_LABELS[jenjang] : jenjang.toUpperCase()

/** Jenis Kelamin — the two legal values a Kader record holds. */
export type JenisKelamin = 'ikhwan' | 'akhwat'

const JENIS_KELAMIN_LABELS: Record<JenisKelamin, string> = {
  ikhwan: 'Ikhwan',
  akhwat: 'Akhwat'
}

const isJenisKelamin = (value: string): value is JenisKelamin =>
  value in JENIS_KELAMIN_LABELS

/**
 * Human-facing Jenis Kelamin label. Unmapped values fall back to the raw
 * code, uppercased — a safety net, not a translation.
 */
export const jenisKelaminLabel = (gender: string): string =>
  isJenisKelamin(gender) ? JENIS_KELAMIN_LABELS[gender] : gender.toUpperCase()
