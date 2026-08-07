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
