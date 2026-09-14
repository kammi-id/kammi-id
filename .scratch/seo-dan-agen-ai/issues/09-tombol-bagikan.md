# 09 — Tombol bagikan: kanal sosial di Berita

**What to build:** Baris tombol bagikan yang bisa diklik pembaca di halaman
Permalink Berita, terpisah dari kartu OG (tiket 04) yang cuma dilihat lewat
pratinjau tautan orang lain.

**Blocked by:** None — bisa jalan paralel dengan tiket lain, senasib dengan
tiket 04.

**Status:** done — 2026-09-03

Tiket 04 membuat Berita bergambar tampil sebagai kartu utuh saat Permalink-nya
dibagikan lewat WhatsApp/X — tapi itu cuma memperbaiki pratinjau *setelah*
tautan dibagikan. Belum ada satu pun cara di halaman itu sendiri bagi pembaca
untuk *memulai* membagikannya: tidak ada tombol, hanya menyalin URL dari
address bar secara manual.

- [x] Komponen baru
      `src/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/_components/article-share-buttons/`,
      dirender di `page.tsx` tepat di bawah baris metadata (tanggal · penulis
      · nama Struktur), sebelum Gambar Utama.
- [x] `'use client'` di leaf ini saja — `page.tsx` tetap Server Component;
      komponen menerima `title: string` (dari `articleRow.title`) sebagai
      prop, dan mengambil URL saat ini lewat `window.location.href` di client
      (halaman ini hanya pernah dirender pada path kanonik —
      `outcome.kind === 'ok'` menjaminnya, lihat komentar di `resolveOutcome`
      di `page.tsx`).
- [x] Deteksi `typeof navigator !== 'undefined' && typeof navigator.share ===
      'function'` (bukan lebar layar — beberapa browser desktop juga
      mendukungnya):
      - **Tersedia:** satu tombol "Bagikan" yang memanggil
        `navigator.share({ title, url })`. Dibatalkan pengguna (`AbortError`)
        ditelan diam-diam, bukan dilempar sebagai error.
      - **Tidak tersedia:** baris ikon untuk WhatsApp, X, Facebook, Telegram,
        Threads, dan Salin Tautan.
- [x] Tiap ikon kanal membuka intent-URL resminya di tab baru (`window.open(url,
      '_blank', 'noopener,noreferrer')`):
      - WhatsApp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
      - X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
      - Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      - Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      - Threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(title + ' ' + url)}`
        — verifikasi ulang skema intent ini terhadap dokumentasi Meta terkini
        saat implementasi; ini permukaan yang paling mungkin berubah tanpa
        pengumuman resmi.
- [x] Salin Tautan: `navigator.clipboard.writeText(url)`, konfirmasi lewat
      `sonner` (`toast.success(...)`) — sudah dipakai di `image-upload` dan
      `struktur-confirm-dialog`, jangan pasang mekanisme toast baru.
- [x] Ikon dari `@hugeicons/core-free-icons` yang sudah terpasang
      (`WhatsappIcon`, `NewTwitterIcon`/`TwitterIcon`, `Facebook01Icon`/
      `Facebook02Icon`, `TelegramIcon`, `ThreadsIcon`) — pilih varian yang
      paling konsisten dengan gaya ikon lain di proyek ini (lihat pemakaian
      di `breadcrumb.tsx`, `pagination.tsx`).
- [x] Tampil di semua Berita termasuk milik Situs Non-Aktif (arsip, ADR
      0013). `InactiveStrukturPermalinkFrame` sengaja tidak mengekspos
      navigasi internal apa pun, tapi membagikan Permalink Berita yang
      sengaja tetap hidup bukan navigasi ke rute lain Struktur ini — tombol
      tetap tampil di sana juga.
- [x] Tidak ada pelacakan klik atau jumlah share — proyek ini belum punya
      infrastruktur analytics apa pun; menambahkannya di sini adalah
      pekerjaan berbentuk sama sekali berbeda.
- [x] `check:types`, `check:lint`, `check:structure` hijau.

## Out of Scope

- **Tombol bagikan di Halaman** (`tentang`, dst). `Permalink` di
  `CONTEXT.md` cuma didefinisikan untuk Berita; Halaman belum punya alamat
  kanonik yang didefinisikan setara di luar konteks ini.
- **Pelacakan klik atau jumlah share.** Tidak ada infrastruktur analytics
  di proyek ini; menambahkannya adalah spec lain.
