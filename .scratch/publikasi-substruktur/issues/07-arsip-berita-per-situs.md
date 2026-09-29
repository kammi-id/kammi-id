# 07 — Arsip Berita per Situs Struktur

**What to build:** `/berita` pada Situs Struktur mana pun menampilkan seluruh Berita Struktur itu secara kronologis, 48 per halaman, dengan nomor halaman. Beranda mendapat bagian 12 Berita terbaru, ditempatkan di bawah bagian Jaringan pada template lengkap, menuju `/berita`. Struktur yang belum punya Berita Terbit tidak menampilkan bagian kosong.

**Blocked by:** 05

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] `/berita` menampilkan Berita Struktur itu saja, terbaru lebih dulu, 48 per halaman, dengan navigasi nomor halaman.
- [x] Beranda menampilkan 12 Berita terbaru milik Struktur itu dan menautkan ke `/berita`; bagian ini hilang bila tidak ada Berita Terbit.
- [x] Total halaman dihitung dalam query yang sama, bukan lewat query hitung terpisah.
- [x] Urutan memakai tanggal terbit menurun dengan pemecah seri yang stabil; tidak ada Berita yang hilang atau muncul dua kali saat berpindah halaman.
- [x] Identitas Struktur pada tiap kartu diambil lewat sambungan di query yang sama, bukan per baris.
- [x] Kategori tampil sebagai label pada kartu, tanpa tautan dan tanpa halaman arsip.
- [x] Indeks parsial untuk urutan kronologis dalam satu Struktur ditambahkan.
- [x] Penandaan cache daftar menyebut Struktur; menerbitkan Berita di satu Struktur tidak mengedaluwarsakan daftar Struktur lain.

## Comments

Dikerjakan paralel dengan tiket 06, 09, dan 10 di worktree terpisah, digabung lewat merge manual (auto-merge bersih, tanpa konflik). Bagian "Berita Terbaru" 12 item di Beranda dan penempatannya di bawah Jaringan sudah ada sejak tiket 04 — dicek ulang, sudah benar, tidak disentuh lagi.

Query arsip baru `listBeritaArsipForOrg` di `src/db/query/article.ts`: satu query dengan `count(*) over()` untuk total halaman, `INNER JOIN organization` untuk identitas Struktur, `LEFT JOIN article_category` untuk label Kategori, `ORDER BY publishedAt DESC, id DESC` sebagai pemecah seri stabil. Index parsial `article_terbit_kronologis_idx` (`organization_id, published_at DESC, id DESC` WHERE `type='blog' AND status='published'`) ditambahkan di skema saat implementasi tapi migrasinya baru digenerate & diterapkan terpusat setelah keempat tiket digabung (lihat Comments tiket 10) — direview di code-review pasca-merge dan tidak ditemukan masalah selain duplikasi kecil (`beritaArsipPermalinkPath` vs `beritaPermalinkPath` yang sudah ada), dibiarkan sebagai judgement call, bukan hard violation.
