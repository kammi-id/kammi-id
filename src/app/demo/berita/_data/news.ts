export type DemoNewsArticle = {
  id: number
  category: 'Pelantikan' | 'Berita' | 'Audiensi' | 'Kegiatan'
  date: string
  title: string
  image: string
}

export const demoNewsArticles: DemoNewsArticle[] = [
  {
    id: 1,
    category: 'Pelantikan',
    date: '20 September 2026',
    title: 'Ketua Umum PP KAMMI Ahmad Jundi: Pelantikan KAMMI Binjai',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 2,
    category: 'Berita',
    date: '20 September 2026',
    title: 'PP KAMMI Utus Delegasi ke Simposium Internasional PPI',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 3,
    category: 'Pelantikan',
    date: '20 September 2026',
    title: 'Bendum PP KAMMI Lantik PD Lancang Kuning Periode 2026–2028',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 4,
    category: 'Audiensi',
    date: '15 September 2026',
    title: 'PP KAMMI Audiensi dengan Menteri Lingkungan Hidup',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 5,
    category: 'Berita',
    date: '12 September 2026',
    title: 'KAMMI Dorong Kolaborasi Pemuda untuk Indonesia Berkelanjutan',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 6,
    category: 'Audiensi',
    date: '10 September 2026',
    title: 'KAMMI Sampaikan Gagasan Kepemudaan di Gedung DPR',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 7,
    category: 'Kegiatan',
    date: '7 September 2026',
    title: 'Pelatihan Kepemimpinan KAMMI Hadirkan Kader Muda Daerah',
    image: '/demo-news-placeholder.svg'
  },
  {
    id: 8,
    category: 'Kegiatan',
    date: '3 September 2026',
    title: 'KAMMI Buka Ruang Kolaborasi untuk Masyarakat dan Mahasiswa',
    image: '/demo-news-placeholder.svg'
  }
]

export const demoNewsCategories = [
  'Semua kategori',
  ...new Set(demoNewsArticles.map((article) => article.category))
]
