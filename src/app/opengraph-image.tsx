import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType
export const alt = 'KAMMI.id'

// Rute ini hidup di luar `[strukturSlug]` — tidak ada Struktur untuk
// diresolve di sini sama sekali (bukan lupa, lihat AGENTS.md ticket 04),
// jadi mode tanpa gambar dengan wordmark "KAMMI.id" generik memang jawaban
// yang benar, bukan bug "KAMMI.id" dikeraskan untuk Struktur lain.
const Image = async () =>
  ogImage({
    title: 'KAMMI.id',
    strukturName: 'KAMMI.id',
    subtitle: 'Kesatuan Aksi Mahasiswa Muslim Indonesia'
  })

export default Image
