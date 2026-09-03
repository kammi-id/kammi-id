# 05 — Berita terbaca di Permalink-nya

**What to build:** Sebuah Berita yang Terbit dapat dibuka di `/berita/<tahun>/<bulan>/<slug>` pada Situs Struktur penerbitnya dan terbaca utuh: judul, tanggal, Penulis, gambar utama, dan badan tulisan yang dirender. Berita bertanggal masa depan belum terbaca. Berita Diarsipkan tetap terbuka namun tidak diindeks. Alamat dengan tahun atau bulan yang keliru tetap menemukan Beritanya lalu dialihkan permanen ke bentuk kanoniknya. Tautan yang dibagikan ke aplikasi pesan memunculkan gambar dan judul Berita itu.

**Blocked by:** 02

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Berita Terbit terbaca di Permalink-nya; badan tulisan dirender dari dokumen tersimpan pada saat request, bukan dibekukan saat terbit.
- [x] Perender memakai daftar-izin node dan mark; keluarannya tidak pernah disuapkan mentah ke DOM.
- [x] Terbit menuntut dua hal: dinyatakan terbit **dan** tanggal terbitnya sudah lewat. Berita terjadwal menjawab tidak ditemukan.
- [x] Berita Diarsipkan tetap melayani Permalink-nya dan ditandai agar tidak diindeks.
- [x] Nama Penulis tampil sebagai teks, di samping atribusi Struktur penerbitnya.
- [x] Tahun dan bulan diturunkan dalam Asia/Jakarta lewat satu pembantu terpusat, dipakai jalur tulis maupun baca; ada uji yang mengunci Berita pukul 06.00 WIB tanggal 1 Januari (ADR 0014).
- [x] Alamat dengan tahun atau bulan yang tidak kanonik dijawab pengalihan permanen, bukan 200 dan bukan tidak ditemukan.
- [x] Metadata Open Graph memakai gambar utama Berita dengan URL absolut pada host Struktur yang benar; jalur gambar dapat diakses tanpa autentikasi, dan itu diuji.
- [x] Berita milik Struktur Terhapus tidak terbaca di permukaan publik mana pun.

## Comments

Dikerjakan paralel dengan tiket 03 dan 04 di worktree terpisah, digabung lewat merge manual. Perender badan tulisan (`article-body-renderer/`) memetakan setiap simpul Tiptap ke elemen React satu-per-satu lewat daftar-izin eksplisit — sama sekali tidak lewat `dangerouslySetInnerHTML`, dan skema URL `javascript:`/`data:` ditolak eksplisit pada `href`/`src`. Pembantu zona waktu terpusat ada di `src/lib/publikasi/tanggal-terbit.ts` (`isTerbit`, `deriveTahunBulanTerbit`, `wibWallClockToPublishedAt`/`publishedAtToWibWallClock` untuk jalur tulis) — dipakai juga oleh tiket 03 dan 04 setelah code-review menemukan keduanya sempat membuat predikat Terbit sendiri yang tidak terkoreksi WIB (lihat Comments tiket 03/04, commit `ae7db9e`).

**Kriteria "Nama Penulis" sempat terlewat** saat implementasi awal (kolom `article.penulis` tidak ada sama sekali) — ditemukan lewat code-review Spec-axis setelah penggabungan, diimplementasikan menyusul di commit `6c42429`: kolom nullable baru, form Artikel, dan render di halaman Permalink. **Migrasinya (`20260826063246_article_penulis`, `ADD COLUMN` nullable) baru diterapkan ke basis data tes lokal — belum ke staging/production.** Jalankan `bun run db:migrate` (atau terapkan `migration.sql`-nya langsung bila CLI drizzle-kit macet diam — lihat catatan di commit `ae7db9e` soal bug spinner-nya) sebelum fitur Penulis dianggap hidup di lingkungan itu.
