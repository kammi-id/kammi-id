import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType
export const alt = 'KAMMI.id'

// Rute ini hidup di luar `[strukturSlug]` — tidak ada Struktur untuk
// diresolve di sini sama sekali (bukan lupa, lihat tiket 04), jadi chip
// "KAMMI.id" generik memang jawaban yang benar di sini, bukan bug
// "KAMMI.id" dikeraskan untuk Struktur lain.
//
// Tiket 10: `title` (bukan `subtitle`) membawa nama panjang organisasi —
// ia yang masuk ke plakat judul sekarang, bukan baris kedua. Tanpa ini
// kartunya menulis "KAMMI.id" dua kali: sekali di chip, sekali di plakat.
const Image = async () =>
  ogImage({
    title: 'Kesatuan Aksi Mahasiswa Muslim Indonesia',
    strukturName: 'KAMMI.id'
  })

export default Image
