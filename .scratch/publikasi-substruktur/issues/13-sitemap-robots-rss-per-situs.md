# 13 — Sitemap, robots, dan RSS per Situs Struktur

**What to build:** Mesin pencari yang mengunjungi tiap subdomain membaca peta situs milik Struktur yang benar, bukan peta situs PP. Situs yang belum aktif atau Non-Aktif ditolak seluruhnya. Setiap Situs Struktur menyediakan umpan RSS di `/berita/feed.xml` bagi media yang mengambil ulang beritanya.

**Blocked by:** 07, 09, 11

**Status:** resolved

- [x] Peta situs pada tiap host berisi beranda, arsip Berita, Halaman yang Terbit, dan Permalink Berita yang Terbit milik Struktur itu saja.
- [x] Peta situs Situs PP menyertakan Berita Jaringan.
- [x] Situs yang belum aktif dan Struktur Non-Aktif: robots menolak seluruhnya dan peta situsnya kosong.
- [x] Peta situs dan robots berhenti memakai host yang dipatok mati; keduanya mengikuti host permintaan.
- [x] `/berita/feed.xml` pada tiap Situs Struktur menyajikan Berita Terbit terbaru Struktur itu, memakai query daftar yang sama.
