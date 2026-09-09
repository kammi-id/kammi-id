# 06 — Editor yang layak untuk menulis berita

**What to build:** Humas menulis Berita dengan tajuk, penekanan, daftar, kutipan, tautan, dan gambar di dalam badan tulisan — hari ini editornya tidak memiliki satu tombol pun dan badan tulisan tidak dapat memuat gambar sama sekali. Gambar utama menjadi wajib bagi Berita, sehingga daftar Berita tidak pernah tampil setengah bergambar.

**Blocked by:** 05

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Editor menyediakan tajuk, tebal, miring, daftar, tautan, kutipan, dan gambar, dengan tombol yang terlihat dan dapat dijangkau papan ketik.
- [x] Gambar disisipkan lewat jalur unggah yang sudah dipakai permukaan lain; tidak ada jalur unggah baru.
- [x] Gambar yang disisipkan terbaca oleh perender Berita dan tampil di Permalink-nya.
- [x] Gambar utama wajib untuk Berita dan tetap opsional untuk Halaman, ditegakkan di skema validasi sejajar dengan kewajiban tanggal yang sudah ada.
- [x] Berita lama tanpa gambar utama tetap terbaca; kewajiban berlaku pada penyimpanan, bukan pada pembacaan.

## Comments

Dikerjakan paralel dengan tiket 07, 09, dan 10 di worktree terpisah, digabung lewat merge manual. Toolbar editor pakai Tiptap (`@tiptap/extension-image` baru ditambah, dipin sejajar versi Tiptap lain di proyek) — tajuk/tebal/miring/daftar/kutipan/tautan/gambar semua lewat extension resmi, bukan custom node. Gambar disisipkan lewat `uploadImageAction`/`getSignedUrlAction` (`~/lib/actions/storage`), jalur yang sama dipakai `src/components/image-upload/` — tidak ada endpoint unggah baru.

Kewajiban `featuredImage` untuk `type: 'blog'` ditambahkan sebagai `.refine` terpisah di `ArticleInputSchema`, murni di level Zod saat submit — kolom DB tetap nullable, jadi Berita lama tanpa gambar utama tetap terbaca. Saat penggabungan dengan tiket 09 (yang juga menambah `.refine`/`.superRefine` baru di `schema.ts` yang sama untuk alasan berbeda — validasi reserved-path Halaman), keduanya digabung manual jadi dua refine berurutan tanpa konflik logis; dua test fixture di tiket 09 dan 10 yang ditulis sebelum kewajiban ini ada sempat gagal pasca-merge karena tidak menyertakan `featuredImage` — diperbaiki saat integrasi (commit `287d9f3`).
