# 08 — Berita Jaringan di Situs PP

**What to build:** Beranda PP mendapat satu bagian tambahan berisi 12 Berita terbaru dari seluruh Struktur, dan `/berita/jaringan` menampung arsip nasionalnya dengan paginasi yang sama seperti arsip per Struktur. Setiap kartu mengantar pembaca ke Permalink di Situs Struktur penerbitnya, bukan ke salinan di PP. `kammi.id/berita` tetap berisi Berita PP saja.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Beranda PP menampilkan 12 Berita terbaru lintas Struktur dan menautkan ke `/berita/jaringan`.
- [ ] `/berita/jaringan` menampilkan seluruh Berita lintas Struktur, kronologis, 48 per halaman.
- [ ] Bagian dan halaman ini hanya ada pada Situs PP, dikondisikan pada Jenjang Struktur, bukan pada jalur routing yang berbeda (ADR 0012).
- [ ] Setiap kartu menautkan ke Permalink di Situs Struktur penerbitnya, dan nama Struktur itu terbaca pada kartu.
- [ ] Query menyaring Struktur Terhapus dan Situs yang belum aktif; penyaringan Keadaan Non-Aktif menyusul di tiket 11 (ADR 0013).
- [ ] Penelusuran rekursif tidak dipakai — PP adalah akar pohon, penyaringan Keadaan sudah cukup.
- [ ] Indeks parsial untuk urutan kronologis lintas Struktur ditambahkan.
- [ ] Berita Jaringan punya tag cache sendiri, terpisah dari tag per Struktur.
