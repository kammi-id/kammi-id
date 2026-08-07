# 17 — CI PostgreSQL 18 dan gladi bersih migrasi

**Type:** implementation
**Status:** open
**Blocked by:** 13, 15, 16

Spec: [`../spec.md`](../spec.md) §9.1, §9.2

## Pekerjaan

Dua ganjalan yang lulus dari kabut peta. Keduanya soal **kemampuan menguji migrasi**,
bukan soal migrasinya sendiri.

### 1. CI memakai PostgreSQL 16, migrasi dasarnya butuh PG 18+

`.github/workflows/ci.yml` memakai `postgres:16`, sementara migrasi dasar repo ini
memanggil `uuidv7()` yang butuh **PG 18+**. Dua-duanya tidak bisa benar, dan selama
belum diluruskan **migrasi peta ini tidak bisa diuji di CI sama sekali**.

Sudah terbukti ini **soal CI-nya, bukan soal migrasinya**: seluruh migrasi yang ada
hari ini sudah dijalankan dari nol sampai bersih di basis data staging, dan
**servernya PG 18+** — `uuidv7()` jalan. Seluruh 199 tes repo juga hijau
terhadapnya.

Naikkan image CI-nya, lalu buktikan migrasinya jalan di sana.

### 2. Gladi bersih untuk migrasi yang lahir dari peta ini

Ada basis data remote kosong yang meniru bentuk produksi. Ia **target yang tepat**
untuk melatih migrasi peta ini sampai bersih sebelum menyentuh produksi.

Yang wajib digladi, dari nol:

- `deleted_at`, `deleted_by`, `non_active_at`, `non_active_by` (tiket 13)
- Kolom Keadaan `generatedAlwaysAs` **beserta `SET NOT NULL` tangannya** (tiket 13) —
  ini yang paling mungkin diam-diam salah, sebab `drizzle-kit` membuang `NOT NULL`
  dan skema TS-nya tidak akan mengeluh
- Pencabutan keempat cascade (tiket 13)
- Partial unique index `slug` (tiket 15)
- Unique `code` (tiket 16)

Verifikasi **di basis data**, bukan di TypeScript: kolom Keadaan benar-benar
`NOT NULL`, indeksnya benar-benar partial, `DELETE FROM organization` atas baris yang
punya Akun benar-benar `23503`.

## Tanya dulu

`DATABASE_URL` yang bukan localhost menunjuk basis data nyata. Konfirmasi ke pengguna
sebelum menjalankan migrasi atau skrip db apa pun. **Akses produksi tidak diberikan
dan tidak diminta** — gladi ini terhadap staging.

## Selesai bila

- CI hijau dengan migrasi peta ini terpasang
- Gladi dari nol sampai bersih di staging, ketiga migrasi
- Ketiga verifikasi di-basis-data di atas terbukti, bukan diasumsikan

## Comments

**8 Agustus 2026 — migrasi A sudah digladi di staging. Tiket tetap `open`.**

Pengguna mengonfirmasi bahwa `103.93.160.47:5432/postgres` adalah **staging**,
bukan produksi — menyelesaikan perselisihan antara `map.md` (staging) dan handoff
sesi lalu (perlakukan sebagai produksi). Diperiksa sebelum menulis apa pun:
4 Struktur, 14 Akun, **0 Kader** — kerangka, bukan data hidup.

`20260807060403_swift_anita_blake` diterapkan lewat
`DB_GUARD_ACK=1 bun run db:migrate`. Pagar `requireDatabaseConsent` menuntut TTY
atau `DB_GUARD_ACK`; jalur kedua itu memang yang repo sediakan untuk runner
non-interaktif, bukan jalan memutar.

**Tiga verifikasi di-basis-data, bukan di TypeScript:**

- `organization.state` mendarat `is_nullable = 'NO'` dan
  `is_generated = 'ALWAYS'`. **`SET NOT NULL` tulis-tangan itu selamat** — ini
  butir yang tiket ini sebut "paling mungkin diam-diam salah".
- Ketujuh FK ke `organization` sekarang `confdeltype = 'a'` (NO ACTION).
  Keempat cascade (`article`, `article_category`, `site_settings`,
  `user.connected_organization_id`) tercabut; tiga yang tak pernah bercascade
  tidak bergerak.
- `state` ter-backfill benar tanpa backfill eksplisit: 4 baris, seluruhnya
  `aktif`.

Sesudahnya, atas permintaan pengguna, **seluruh baris di skema `public`
dikosongkan** (`TRUNCATE ... RESTART IDENTITY CASCADE`) — skema dan kedelapan
baris `drizzle.__drizzle_migrations` sengaja dibiarkan berdiri. **`db:reset`
tidak dipakai**: ia men-`DROP TABLE`, yang akan membatalkan migrasi yang barusan
mendarat. Isi sebelumnya di-dump ke JSON lebih dulu.

**Konsekuensi yang perlu dipikul tiket ini:** staging sekarang benar-benar nol
baris, jadi pra-terbang `check:duplicates` di sana akan menjawab "nol duplikat"
secara teknis benar dan hampa secara makna — persis jebakan yang tiket 04 namai.
Gladi migrasi B dan C perlu menyemai bentuk yang mengandung duplikat lebih dulu,
kalau yang mau dibuktikan adalah pra-terbangnya menangkap sesuatu.

**Yang masih terbuka:** CI masih `postgres:16` (`.github/workflows/ci.yml:13`),
dan migrasi B (tiket 15) serta C (tiket 16) belum ada.
