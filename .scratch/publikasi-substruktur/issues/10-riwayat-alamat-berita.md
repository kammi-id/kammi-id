# 10 — Riwayat alamat Berita

**What to build:** Humas membetulkan permalink atau menggeser tanggal Berita yang sudah terbit, dan tautan yang telanjur tersebar tetap mengantar pembaca ke alamat barunya. Slug Struktur tidak mendapat riwayat — perubahannya dicegah dengan peringatan keras, bukan dipulihkan (ADR 0014).

**Blocked by:** 05

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Mengubah permalink Berita yang sudah Terbit menyimpan alamat lamanya; alamat itu tetap mengantar ke bentuk kanonik yang baru lewat pengalihan permanen.
- [x] Menggeser tanggal terbit Berita yang sudah Terbit diperlakukan sama.
- [x] Riwayat hanya dibaca pada jalur tidak ditemukan; pembacaan Berita yang normal tidak menyentuhnya.
- [x] Alamat lama yang kemudian dipakai ulang oleh Berita lain di Struktur yang sama tetap melayani Berita yang benar, bukan yang lama.
- [x] Form Struktur memperingatkan keras saat slug Struktur yang Situsnya sudah aktif hendak diubah, dan menyebut akibatnya.

## Comments

Dikerjakan paralel dengan tiket 06, 07, dan 09 di worktree terpisah, digabung lewat merge manual (satu konflik kecil di `page.tsx` permalink Berita — beda baris import yang sama-sama diubah tiket 09 dan 10, digabung tanpa kehilangan perubahan siapa pun). Tabel baru `article_permalink_history` (`organization_id`, `article_id`, `old_slug`, `old_tahun`, `old_bulan`, `created_at`, index `(organization_id, old_slug)`) menyimpan alamat lama; dibaca HANYA di jalur `outcome.kind === 'not-found'` pada halaman Permalink Berita, lookup selalu mengambil pemetaan riwayat terbaru lalu join ke baris `article` segar — jadi penggunaan ulang slug oleh Berita lain otomatis melayani yang benar.

Peringatan keras di form Struktur (`isSlugChangeHazardous`) memakai field baru `isSiteActive` pada `struktur-row.ts`, memuat komponen `alert.tsx` shadcn baru.

**Migrasi:** tabel dan index (gabungan dengan index parsial tiket 07) digenerate jadi satu migrasi (`20260826121443_groovy_wilson_fisk`) SETELAH keempat tiket digabung — sesuai batasan proyek yang melarang agent menjalankan `drizzle-kit generate`/`migrate` secara otonom. Diterapkan ke database tes lokal (ledger `drizzle.__drizzle_migrations`-nya sempat kosong meski skema lama sudah ada — bootstrap lama lewat `db:push`, direkonsiliasi tanpa re-run SQL lama, mengikuti prosedur yang sama dengan ADR 0009) dan ke database staging lokal (`localhost:5432`) sejauh koneksinya aktif saat sesi ini berjalan. **Belum diterapkan ke production** — jalankan `bun run db:migrate` di lingkungan itu sebelum fitur riwayat alamat dianggap hidup di sana.
