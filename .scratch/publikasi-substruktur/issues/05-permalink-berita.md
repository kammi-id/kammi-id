# 05 — Berita terbaca di Permalink-nya

**What to build:** Sebuah Berita yang Terbit dapat dibuka di `/berita/<tahun>/<bulan>/<slug>` pada Situs Struktur penerbitnya dan terbaca utuh: judul, tanggal, Penulis, gambar utama, dan badan tulisan yang dirender. Berita bertanggal masa depan belum terbaca. Berita Diarsipkan tetap terbuka namun tidak diindeks. Alamat dengan tahun atau bulan yang keliru tetap menemukan Beritanya lalu dialihkan permanen ke bentuk kanoniknya. Tautan yang dibagikan ke aplikasi pesan memunculkan gambar dan judul Berita itu.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Berita Terbit terbaca di Permalink-nya; badan tulisan dirender dari dokumen tersimpan pada saat request, bukan dibekukan saat terbit.
- [ ] Perender memakai daftar-izin node dan mark; keluarannya tidak pernah disuapkan mentah ke DOM.
- [ ] Terbit menuntut dua hal: dinyatakan terbit **dan** tanggal terbitnya sudah lewat. Berita terjadwal menjawab tidak ditemukan.
- [ ] Berita Diarsipkan tetap melayani Permalink-nya dan ditandai agar tidak diindeks.
- [ ] Nama Penulis tampil sebagai teks, di samping atribusi Struktur penerbitnya.
- [ ] Tahun dan bulan diturunkan dalam Asia/Jakarta lewat satu pembantu terpusat, dipakai jalur tulis maupun baca; ada uji yang mengunci Berita pukul 06.00 WIB tanggal 1 Januari (ADR 0014).
- [ ] Alamat dengan tahun atau bulan yang tidak kanonik dijawab pengalihan permanen, bukan 200 dan bukan tidak ditemukan.
- [ ] Metadata Open Graph memakai gambar utama Berita dengan URL absolut pada host Struktur yang benar; jalur gambar dapat diakses tanpa autentikasi, dan itu diuji.
- [ ] Berita milik Struktur Terhapus tidak terbaca di permukaan publik mana pun.
