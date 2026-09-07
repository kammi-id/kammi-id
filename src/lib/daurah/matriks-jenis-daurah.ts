import type { TrainingType } from '~/db/query/training'

/**
 * ADR 0025: jenis Daurah yang boleh digelar bergantung pada Jenjang
 * penyelenggaranya. Tanda ✓ di ADR berarti *boleh*, bukan *lazim* — yang
 * benar-benar dikunci hanya dua larangan: PD/PDLN tidak menggelar DM3, dan
 * PK hanya menggelar DM1 di luar kategori Lainnya.
 *
 * Modul ini murni: tidak membaca sesi, tidak menyentuh basis data. Pemanggil
 * yang menyediakan Jenjang Struktur penyelenggara dan jenis Daurah yang
 * hendak dicatat atau diubah.
 */
const MATRIKS_JENJANG: Record<string, readonly TrainingType[]> = {
  pp: ['dm1', 'dm2', 'dm3', 'dpmk', 'tfi', 'other'],
  pw: ['dm1', 'dm2', 'dm3', 'dpmk', 'tfi', 'other'],
  pd: ['dm1', 'dm2', 'dpmk', 'tfi', 'other'],
  pdln: ['dm1', 'dm2', 'dpmk', 'tfi', 'other'],
  pk: ['dm1', 'other']
}

/** Jenis Daurah yang boleh digelar sebuah Jenjang, per matriks ADR 0025. */
export const jenisDaurahUntukJenjang = (
  jenjang: string
): readonly TrainingType[] => MATRIKS_JENJANG[jenjang] ?? []

/** Apakah `type` termasuk jenis yang boleh digelar sebuah `jenjang`. */
export const isJenisDaurahDiizinkan = (
  jenjang: string,
  type: TrainingType
): boolean => jenisDaurahUntukJenjang(jenjang).includes(type)
