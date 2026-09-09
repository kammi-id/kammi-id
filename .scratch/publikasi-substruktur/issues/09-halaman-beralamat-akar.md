# 09 — Halaman beralamat akar

**What to build:** Halaman terbit di `/<slug>` pada Situs Struktur mana pun, PP termasuk, dan terbaca memakai perender yang sama dengan Berita. Permalink yang bertabrakan dengan alamat milik sistem ditolak saat simpan dengan pesan yang jelas — bukan tersimpan dengan sukses lalu diam-diam tidak pernah tampil.

**Blocked by:** 05

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Halaman yang Terbit terbaca di `/<slug>` pada Situs Struktur penerbitnya.
- [x] Halaman tidak muncul di arsip Berita, tidak bertanggal, dan tidak muncul di Berita Jaringan.
- [x] Daftar alamat milik sistem hidup sebagai satu konstanta, dipakai skema validasi, dan diuji.
- [x] Permalink Halaman yang bertabrakan dengan alamat milik sistem ditolak saat simpan, dengan pesan yang menyebut alamat mana yang dipakai sistem.
- [x] Rute publik yang sudah ada tetap menang atas Halaman; tidak ada rute existing yang tertutup oleh Halaman mana pun.

## Comments

Dikerjakan paralel dengan tiket 06, 07, dan 10 di worktree terpisah, digabung lewat merge manual. `RESERVED_STRUKTUR_PATHS` (`src/lib/struktur/reserved-paths.ts`) jadi sumber tunggal alamat milik sistem, dipakai `ArticleInputSchema` (`.superRefine` khusus `type: 'page'`) dengan pesan yang menyebut alamat mana yang bentrok. "Berita Jaringan" (ticket 08) belum ada — checklist "tidak muncul di Berita Jaringan" saat ini vakum-benar, akan relevan begitu tiket 08 dikerjakan (query-nya wajib menyaring `type: 'blog'` seperti semua query Berita lain di repo ini).

`article-body-renderer` dipromosikan dari `_components/` route Berita ke `src/components/` karena kini dikonsumsi dua rute (Berita dan Halaman) — memenuhi bar promosi AGENTS.md (generik + dipakai ≥2 rute), git mendeteksinya sebagai rename bersih.

**Catatan proses:** agent pertama untuk tiket ini dua kali mendapat worktree yang salah basis (ke-branch dari commit `init` paling awal, bukan tip `dev-20260104`) akibat bug pada mekanisme spawn worktree paralel — diselesaikan dengan membuat worktree manual. Percobaan ketiga juga sempat kehilangan sebagian WIP-nya (tertukar dengan WIP tiket 07 lewat `refs/stash` yang ternyata dibagi lintas worktree) dan berakhir kena limit sesi sebelum sempat menambah satu fungsi query (`getPageArticleBySlug`) — dipulihkan dan dilengkapi oleh sesi orkestrator sebelum commit akhir. Detail lengkap tersimpan di memory `git-stash-u-hazard` dan `worktree-isolation-wrong-base`.
