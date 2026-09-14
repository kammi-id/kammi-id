# 11 — Struktur Non-Aktif di permukaan publik

**What to build:** Situs Struktur yang kepengurusannya berhenti tidak lagi dapat ditelusuri — beranda, arsip, dan Halamannya menjawab tidak ditemukan — sementara Permalink setiap Berita yang telanjur Terbit tetap terbuka sebagai arsip, dirender dengan kerangka minimal berisi identitas Struktur tanpa tautan navigasi, keterangan bahwa kepengurusan ini sedang tidak berjalan, dan tautan ke `kammi.id`. Berita itu tetap terbaca lewat Berita Jaringan (ADR 0013).

**Blocked by:** 08

**Status:** resolved

- [x] Beranda, `/berita`, dan Halaman milik Struktur Non-Aktif menjawab tidak ditemukan.
- [x] Permalink Berita yang Terbit milik Struktur Non-Aktif tetap melayani, dengan kerangka minimal tanpa satu pun tautan navigasi ke situs itu.
- [x] Halaman tersebut menyebut bahwa kepengurusan sedang tidak berjalan dan menautkan ke `kammi.id`.
- [x] Berita milik Struktur Non-Aktif tetap muncul di Berita Jaringan; arsip per Struktur menyaringnya. Perbedaan penyaringan antar permukaan ini diuji, bukan hanya ditulis.
- [x] Struktur Terhapus tetap hilang seluruhnya, Berita-nya termasuk.
