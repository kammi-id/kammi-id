# 07 — Arsip Berita per Situs Struktur

**What to build:** `/berita` pada Situs Struktur mana pun menampilkan seluruh Berita Struktur itu secara kronologis, 48 per halaman, dengan nomor halaman. Beranda mendapat bagian 12 Berita terbaru, ditempatkan di bawah bagian Jaringan pada template lengkap, menuju `/berita`. Struktur yang belum punya Berita Terbit tidak menampilkan bagian kosong.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] `/berita` menampilkan Berita Struktur itu saja, terbaru lebih dulu, 48 per halaman, dengan navigasi nomor halaman.
- [ ] Beranda menampilkan 12 Berita terbaru milik Struktur itu dan menautkan ke `/berita`; bagian ini hilang bila tidak ada Berita Terbit.
- [ ] Total halaman dihitung dalam query yang sama, bukan lewat query hitung terpisah.
- [ ] Urutan memakai tanggal terbit menurun dengan pemecah seri yang stabil; tidak ada Berita yang hilang atau muncul dua kali saat berpindah halaman.
- [ ] Identitas Struktur pada tiap kartu diambil lewat sambungan di query yang sama, bukan per baris.
- [ ] Kategori tampil sebagai label pada kartu, tanpa tautan dan tanpa halaman arsip.
- [ ] Indeks parsial untuk urutan kronologis dalam satu Struktur ditambahkan.
- [ ] Penandaan cache daftar menyebut Struktur; menerbitkan Berita di satu Struktur tidak mengedaluwarsakan daftar Struktur lain.
