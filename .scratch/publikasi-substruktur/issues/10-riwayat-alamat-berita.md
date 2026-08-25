# 10 — Riwayat alamat Berita

**What to build:** Humas membetulkan permalink atau menggeser tanggal Berita yang sudah terbit, dan tautan yang telanjur tersebar tetap mengantar pembaca ke alamat barunya. Slug Struktur tidak mendapat riwayat — perubahannya dicegah dengan peringatan keras, bukan dipulihkan (ADR 0014).

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Mengubah permalink Berita yang sudah Terbit menyimpan alamat lamanya; alamat itu tetap mengantar ke bentuk kanonik yang baru lewat pengalihan permanen.
- [ ] Menggeser tanggal terbit Berita yang sudah Terbit diperlakukan sama.
- [ ] Riwayat hanya dibaca pada jalur tidak ditemukan; pembacaan Berita yang normal tidak menyentuhnya.
- [ ] Alamat lama yang kemudian dipakai ulang oleh Berita lain di Struktur yang sama tetap melayani Berita yang benar, bukan yang lama.
- [ ] Form Struktur memperingatkan keras saat slug Struktur yang Situsnya sudah aktif hendak diubah, dan menyebut akibatnya.
