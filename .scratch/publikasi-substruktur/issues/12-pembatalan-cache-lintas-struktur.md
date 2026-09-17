# 12 — Pembatalan cache saat Struktur berubah

**What to build:** Menonaktifkan sebuah Struktur, mengubah slug-nya, atau mematikan Situsnya langsung tercermin di permukaan publik — termasuk Berita Jaringan di Situs PP — tanpa menunggu cache kedaluwarsa sendiri. Pemicunya adalah perubahan pada Struktur, bukan pada Artikel, dan itu jenis pemicu yang paling mudah terlewat (ADR 0013).

**Blocked by:** 11

**Status:** resolved

- [ ] Menonaktifkan atau mengaktifkan kembali sebuah Struktur segera mengubah apa yang dilayani publik, Berita Jaringan termasuk.
- [ ] Menghapus dan memulihkan Struktur diperlakukan sama.
- [ ] Menyalakan atau mematikan Situs Struktur segera mengubah apa yang dilayani publik.
- [ ] Mengubah slug Struktur segera mengubah alamat yang dilayani, tanpa menyisakan alamat lama yang masih hidup dari cache.
- [ ] Tag global `articles` yang berlaku sekarang tidak lagi menjadi satu-satunya penanda; tidak ada lagi jalur yang mengedaluwarsakan seluruh situs nasional karena satu Struktur menerbitkan Berita.
