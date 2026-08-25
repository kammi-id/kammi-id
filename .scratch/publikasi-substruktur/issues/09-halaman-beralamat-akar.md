# 09 — Halaman beralamat akar

**What to build:** Halaman terbit di `/<slug>` pada Situs Struktur mana pun, PP termasuk, dan terbaca memakai perender yang sama dengan Berita. Permalink yang bertabrakan dengan alamat milik sistem ditolak saat simpan dengan pesan yang jelas — bukan tersimpan dengan sukses lalu diam-diam tidak pernah tampil.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Halaman yang Terbit terbaca di `/<slug>` pada Situs Struktur penerbitnya.
- [ ] Halaman tidak muncul di arsip Berita, tidak bertanggal, dan tidak muncul di Berita Jaringan.
- [ ] Daftar alamat milik sistem hidup sebagai satu konstanta, dipakai skema validasi, dan diuji.
- [ ] Permalink Halaman yang bertabrakan dengan alamat milik sistem ditolak saat simpan, dengan pesan yang menyebut alamat mana yang dipakai sistem.
- [ ] Rute publik yang sudah ada tetap menang atas Halaman; tidak ada rute existing yang tertutup oleh Halaman mana pun.
