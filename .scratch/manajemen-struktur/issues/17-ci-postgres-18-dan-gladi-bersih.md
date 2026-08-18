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

**18 Agustus 2026 — bagian 1 dikode, belum dibuktikan hijau; bagian 2 masih terbuka.**

`.github/workflows/ci.yml` dinaikkan ke `postgres:18`, dan step "Set up
database functions" (setup tangan `uuidv7()`) dicabut — PG18 menyediakannya
native, jadi step itu sekarang mati kode. Belum dibuktikan hijau lewat CI
sungguhan (belum ada push/PR yang memicunya), tapi diagnosisnya kuat: repo
sudah jalan bersih di staging PG18+ dan seluruh 199 tes hijau terhadapnya
(lihat komentar 8 Agustus di atas).

Gladi bersih migrasi B (`20260807194827_organization_slug_live_unique`) dan C
(`20260813034832_organization_code_unique`) **belum bisa dieksekusi** dari
sesi ini: sandbox-nya tidak bisa menjangkau Docker (daemon tidak terhubung,
dua percobaan `docker run`/`docker ps` menggantung tanpa keluaran sampai
timeout) maupun jaringan ke staging (`103.93.160.47:5432` tidak terjangkau
dari sini). Pengguna memilih commit bagian CI dulu dan menyisakan gladi B/C
sebagai pekerjaan lanjutan — bukan diselesaikan lewat sandbox bypass atau
dijalankan manual di sesi ini.

Tiket tetap `open`. Sisa pekerjaan sebelum tutup: jalankan gladi B/C dari
mesin yang punya akses staging (lihat rencana di komentar 8 Agustus — semai
duplikat dulu supaya pra-terbang punya sesuatu untuk ditangkap), lalu
verifikasi tiga hal di-basis-data (index partial `slug` benar-benar partial,
constraint `code` benar-benar unik lintas semua baris termasuk Terhapus), dan
buktikan CI hijau lewat PR sungguhan.

**18 Agustus 2026 (kedua) — gladi B dan C dieksekusi penuh, di Docker lokal PG 18.3.**

Docker sudah hidup (`docker compose up -d db-test`, `pg_isready` balas 2 detik),
jadi ganjalan sesi sebelumnya hilang. Gladinya **tidak** dijalankan terhadap
staging, dan itu keputusan yang perlu disebut, bukan diselipkan: staging sudah
nol baris sejak 8 Agustus, jadi ia tidak lagi menawarkan apa pun yang tidak bisa
ditawarkan basis data kosong di mesin ini — sementara ia masih remote dan masih
bersama. Yang dipakai: `postgres:18.3-bookworm` di container `db-test`, tiga
basis data sekali pakai (`kammi_gladi`, `kammi_pra`, `kammi_ci`), semuanya
sudah di-`DROP` sesudahnya.

### Bagian 1 — CI

Langkah CI yang menyentuh basis data dijalankan apa adanya terhadap PG 18 kosong:
`bun run db:migrate` mendarat bersih dari nol (10 migrasi, `uuidv7()` native
tanpa setup tangan), lalu `bun test` **561 lewat, 0 gagal**. `TEST_DATABASE_URL`
sengaja dikosongkan supaya `tests/setup.ts` tidak menimpa sasaran — persis
keadaan CI. Yang tersisa cuma bukti dari runner GitHub sungguhan.

### Bagian 2 — gladi migrasi, dari nol

Enam verifikasi **di basis data**, bukan di TypeScript:

- `state` → `is_nullable = 'NO'`, `is_generated = 'ALWAYS'`. `SET NOT NULL`
  tulis-tangan selamat juga pada jalur dari-nol, bukan cuma pada jalur
  `ALTER` di staging.
- `organization_slug_live_unique` → `indisunique`, `indpred` = `(deleted_at IS NULL)`.
  **Benar-benar partial.**
- `organization_code_unique` → `UNIQUE (code)`, `contype = 'u'`, nol predikat.
  **Constraint, bukan index**, persis yang migrasi C klaim.
- Ketujuh FK ke `organization` → `confdeltype = 'a'`. Cascade tercabut.
- Perilaku, sembilan kasus, semuanya sesuai harapan: slug kembar sesama hidup
  ditolak `23505`; slug bebas dipungut ulang setelah pemiliknya Terhapus; dua
  baris Terhapus boleh berbagi slug; **Non-Aktif tetap memegang slugnya**;
  `code` kembar ditolak sesama hidup, terhadap baris Terhapus, dan sesama
  Terhapus; `DELETE` atas Struktur yang punya Kader `23503`; begitu juga yang
  punya Akun.
- `state` menolak ditulis tangan (`428C9`), dan Terhapus mendominasi Non-Aktif
  tanpa memadamkannya (`is_non_active` tetap `true`, `state` = `terhapus`).

### Bagian 3 — pra-terbang, dengan duplikat yang disemai lebih dulu

Persis rencana komentar 8 Agustus. Basis data dimundurkan ke keadaan sebelum B
dan C (drop index, drop constraint, hapus dua baris `__drizzle_migrations`),
lalu disemai tiga bentuk: `slug` kembar sesama hidup, `code` kembar dengan Kader
hidup di satu sisi dan Kader terhapus di sisi lain, dan sepasang `slug` yang
salah satunya Terhapus. `check:duplicates` menangkap dan memutus **BERHENTI**,
menyebut `code` kembar berikut hitungan Member hidup dan terhapusnya.

## Dua temuan, keduanya lahir dari gladi ini

**1. Pra-terbang salah cakupan untuk `slug` — sudah diperbaiki.**
`check-duplicates.ts` menghitung `slug` lintas **semua** baris, sementara
migrasi B partial. Sepasang `slug` yang salah satunya Terhapus dilaporkan
sebagai duplikat padahal B menerimanya apa adanya — dan tabel barisnya tidak
punya satu pun kolom yang menunjukkan mana yang Terhapus (`is_non_active`
berbunyi `false` untuk baris Terhapus). Operator yang menurut akan mengganti
nama URL yang hidup tanpa sebab, dan tidak punya cara tahu yang mana yang harus
diganti. Diperbaiki: `slug` kini dihitung hanya di antara baris yang belum
Terhapus, kolom `terhapus` ditambahkan ke laporan, dan ada jalur cadangan untuk
basis data yang belum kena migrasi A (kolom `deleted_at` belum ada → hitung
lintas semua baris, yang di sana justru benar). Diuji tiga arah: duplikat semu
tidak lagi dilaporkan, duplikat nyata tetap tertangkap, jalur cadangan jalan.

**2. "Kirim migrasi `slug` saja" tidak bisa dijalankan lewat `bun run db:migrate`.**
Terbukti, bukan diduga: dengan `slug` sudah dibereskan tapi `code` masih kembar,
`db:migrate` **gagal seluruhnya** — B ikut mundur bersama C, nol indeks, nol
constraint, `__drizzle_migrations` tetap 8 baris. Runner Drizzle membungkus
seluruh migrasi tertunda dalam **satu** transaksi, jadi selama C masih tertunda,
B tidak bisa mendarat sendirian. B sendirian memang jalan — dibuktikan dengan
menjalankan SQL-nya langsung di dalam transaksi lalu `ROLLBACK`.

Konsekuensinya untuk deploy, dan ini perlu diputuskan orang: kalau pra-terbang
di produksi menemukan `code` kembar, cabang "kirim `slug` saja" di pohon
keputusan §4.6 menuntut **satu deploy yang hanya memuat migrasi B** — C ditahan
di luar folder migrasi sampai insiden datanya diputuskan. Bukan `db:migrate`
yang sama dengan C ikut di dalamnya.

## Efek samping: empat tes gugur, dua bug nyata

`bun test` terhadap basis data yang sudah kena B dan C menemukan empat kegagalan
yang selama ini tidak pernah terlihat karena constraint-nya belum ada:

- `organization-profile-form/action.ts` — `formData.get('logo')` mengembalikan
  `null`, sementara skemanya `.optional()` yang menerima `undefined`. Setiap
  pemanggilan tanpa field `logo` mati di validasi. Form selalu mengirimnya lewat
  input tersembunyi, jadi yang kena cuma Server Action yang dicapai tanpa form —
  permukaan yang tiket 25 justru bilang harus tetap benar. Dinormalkan ke
  `undefined` di batasnya.
- `struktur-terhapus-list/action.test.ts` — `beforeEach` membangkitkan baris
  Terhapus **sebelum** membereskan slugnya, jadi baris yang masih memegang slug
  rebutan dari tes sebelumnya menabrak partial unique index. Urutannya dibalik:
  slug dulu, Keadaan belakangan.

Sesudah keduanya: **561 lewat, 0 gagal**, tiga kali berturut-turut. `check:format`,
`check:types`, `check:structure` bersih.

## Sisa pekerjaan sebelum tiket ini ditutup

1. CI hijau lewat PR sungguhan — satu-satunya yang tidak bisa dibuktikan dari
   mesin ini.
2. Putusan atas temuan no.2 di atas: apakah cabang "kirim `slug` saja" cukup
   dicatat sebagai prosedur deploy, atau perlu bentuk lain.
3. Pra-terbang terhadap **produksi** sesaat sebelum deploy — hasil dari basis
   data mana pun selain sasarannya tidak menjamin apa pun (kalimat pertama
   `check-duplicates.ts` sendiri).
