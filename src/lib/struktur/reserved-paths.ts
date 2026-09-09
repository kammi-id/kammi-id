/**
 * Segmen jalur tepat satu langkah di bawah `[strukturSlug]/` yang TIDAK
 * PERNAH boleh dipakai sebagai Permalink Halaman (`article.type === 'page'`,
 * disajikan di `[strukturSlug]/[slug]/page.tsx`, tiket 09) — menabraknya
 * membuat Halaman tersimpan sukses tapi tidak pernah terbaca, diam-diam.
 *
 * Dua alasan berbeda melahirkan daftar ini, dan keduanya penting untuk
 * pembaca berikutnya yang menambah entri:
 *
 * 1. **Rute statis yang sudah ada** (`berita`, `event`, `tentang`) — Next.js
 *    App Router memenangkan segmen statis atas segmen dinamis `[slug]` pada
 *    level yang sama secara otomatis. Entri ini di sini murni dokumentasi +
 *    sumber tunggal untuk pesan galat; Next.js sendiri yang menegakkannya.
 *    `reserved-paths.test.ts` membuktikan sisi lainnya — daftar ini tidak
 *    diam-diam ketinggalan zaman begitu rute statis baru ditambah langsung
 *    di bawah `[strukturSlug]/`.
 *
 * 2. **Jalur yang dipotong `src/proxy.ts` SEBELUM sempat di-rewrite ke bawah
 *    `[strukturSlug]/`** (`dashboard`, `login`, `api`, `opengraph-image`) —
 *    untuk keempat ini TIDAK ADA penegakan otomatis dari Next.js: proxy
 *    mengembalikan lebih awal, atau matcher-nya sudah mengecualikan path itu,
 *    apa pun subdomainnya — jadi `<slug>.kammi.id/dashboard` tidak pernah
 *    sampai ke resolver `[strukturSlug]/[slug]`. Kalau baris ini tidak
 *    ditolak saat simpan, Halaman itu tersimpan sukses tapi permanen tidak
 *    terjangkau publik — persis bug yang tiket 09 cegah.
 *
 * Tambahkan segmen baru ke sini setiap kali rute statis baru ditambah
 * langsung di bawah `[strukturSlug]/` (mis. tiket 13: sitemap/robots/rss per
 * Situs), atau jalur baru dikecualikan/ditangani lebih awal di `src/proxy.ts`.
 */
export const RESERVED_STRUKTUR_PATHS = [
  'berita',
  'event',
  'tentang',
  'dashboard',
  'login',
  'api',
  'opengraph-image'
] as const

export type ReservedStrukturPath = (typeof RESERVED_STRUKTUR_PATHS)[number]

/**
 * Apakah sebuah Permalink (segmen tunggal tanpa garis miring, mis. nilai
 * `article.slug`) bertabrakan dengan salah satu alamat milik sistem di atas.
 */
export const isReservedStrukturPath = (path: string): boolean =>
  (RESERVED_STRUKTUR_PATHS as readonly string[]).includes(path)
