# 02 — Subdomain dikenali, Situs Aktif jadi syarat

**What to build:** Pembaca yang membuka `<slug>.kammi.id` mendapat Situs Struktur milik Struktur itu, dengan Pengaturan Situs dan isinya sendiri. Situs Struktur yang belum dinyalakan, slug yang tidak dikenal, dan Struktur Terhapus sama-sama menjawab tidak ditemukan. PP menempati apex sebagai tenant biasa, dan penandanya dinyalakan lewat migrasi sehingga `kammi.id` tidak pernah mati.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `<slug>.kammi.id` melayani Situs Struktur milik slug tersebut; membuka dua subdomain berbeda memberi isi yang berbeda.
- [ ] Penanda Situs Aktif adalah kolom pada Struktur, bukan nilai di dalam Pengaturan Situs, sehingga ia dapat menjadi klausa penyaring pada query.
- [ ] Migrasi menyalakan penanda itu untuk PP; apex melayani seperti sebelumnya segera setelah deploy.
- [ ] Slug tidak dikenal, Struktur Terhapus, dan Situs yang belum aktif menjawab tidak ditemukan, tanpa membocorkan mana yang mana.
- [ ] Alamat internal hasil rewrite ditolak bila diketik langsung dari luar (ADR 0012).
- [ ] Aset tidak ikut ter-rewrite: `_next`, berkas berekstensi, dan jalur gambar tetap dilayani di setiap subdomain.
- [ ] `www` pada apex mengantar ke apex.
