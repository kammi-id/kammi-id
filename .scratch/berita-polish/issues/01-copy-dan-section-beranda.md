# 01 — Copy section beranda dan rename Berita KAMMI se-Indonesia

**What to build:** Dua section Berita di beranda memakai judul yang benar dan
bentuk yang seragam, dan istilah **Berita Jaringan** pensiun menjadi **Berita
KAMMI se-Indonesia** — termasuk alamat publiknya, tanpa memutus alamat lama.

**Blocked by:** None — can start immediately.

**Status:** done — seluruh checklist terpenuhi; `check:types`, `check:lint`,
`check:structure`, dan `bun run test` (846 pass) hijau

- [x] Judul section Berita milik Struktur dinamis mengikuti nama Struktur:
      "Berita PP KAMMI" di Situs PP, "Berita KAMMI Wilayah Aceh" di Situs
      Wilayah Aceh. Tidak boleh ada Struktur yang menampilkan nama Struktur
      lain.
- [x] Section Berita lintas Struktur berjudul "Berita KAMMI se-Indonesia"
      dengan subjudul "Kegiatan KAMMI se-Indonesia".
- [x] Eyebrow ("Kabar Terkini" / "Kabar Jaringan") hilang dari **kedua**
      section, masing-masing diganti subjudul di bawah judul. Dua section
      bertetangga di beranda PP berbentuk sama.
- [x] Alamat arsip lintas Struktur menjadi `/berita/seindonesia`.
      `/berita/jaringan` menjawab `permanentRedirect` ke alamat baru, dan
      punya tes yang membuktikannya.
- [x] `sitemap.ts` memuat alamat baru saja, bukan keduanya.
- [x] Judul halaman arsip, metadata, breadcrumb JSON-LD, dan teks tautan
      "Lihat Semua" ikut memakai sebutan baru.
- [x] Cache tag `'berita-jaringan'`, index basis data
      `article_terbit_jaringan_idx`, nama berkas komponen, nama fungsi query,
      dan prosa ADR 0012/0013 **tidak** disentuh. Rename berhenti di istilah
      domain dan di apa yang dibaca pembaca.
- [x] ADR 0016 mencatat rename istilah + pindah alamat, dan menjadi jembatan
      bagi pembaca ADR 0012/0013 yang menemukan nama lama.
- [x] Perilaku "sembunyikan section saat belum ada Berita" tetap utuh — sudah
      ada sebelum tiket ini, jangan sampai hilang saat menyunting.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.
