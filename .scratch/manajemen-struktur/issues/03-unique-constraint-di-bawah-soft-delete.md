# 03 — Unique constraint di bawah soft delete

**Type:** research
**Status:** resolved
**Blocked by:** —

## Question

`organization.slug` dan `organization.code` **tidak punya unique constraint
sama sekali** (`db/schema/organization.sql.ts`; tidak ada di satu pun migrasi
— bandingkan `article`, `article_category`, dan `site_settings` yang punya).
`getCachedOrganization(slug)` (`dashboard/_data/organizations.ts:16`) ambil
baris pertama apa adanya, jadi slug kembar menimpa satu sama lain secara
diam-diam.

Charting menuntut dua aturan yang **berbeda bentuk**:

- **`code` unik di seluruh baris, termasuk yang Terhapus** — ia terbawa ke
  Nomor Induk Anggota yang permanen. Melepasnya bisa membuat dua Kader dari
  dua Struktur berbeda punya Nomor Induk yang sama.
- **`slug` unik hanya di antara baris yang belum Terhapus** — ia cuma URL, dan
  charting sudah memutuskan slug dibebaskan setelah penghapusan.

Yang perlu diteliti dari sumber primer (dokumentasi PostgreSQL dan Drizzle di
`node_modules/`, bukan ingatan):

1. Bentuk yang benar untuk keunikan parsial di PostgreSQL — partial unique
   index `WHERE deleted_at IS NULL` versus `UNIQUE NULLS NOT DISTINCT` versus
   generated column. Mana yang berperilaku benar ketika baris dipulihkan dan
   bertabrakan dengan slug yang sudah dipakai ulang.
2. Cara Drizzle menyatakan partial unique index di definisi tabel, dan apakah
   `drizzle-kit` benar-benar menghasilkannya di migrasi (bukan hanya
   menerimanya di tipe).
3. Apakah `codeSlug` yang `generatedAlwaysAs` ikut butuh keunikan sendiri,
   atau keunikan `code` sudah cukup menurunkannya.
4. Apa yang terjadi pada `CREATE UNIQUE INDEX` di tabel yang sudah berisi
   data dan sedang dilayani — apakah `CONCURRENTLY` diperlukan di sini, dan
   apa konsekuensinya kalau gagal di tengah jalan.

Ini basis data **produksi** dengan data asli. Temuannya harus cukup konkret
untuk menulis migrasi yang aman, bukan sekadar menyebut nama fiturnya.

## Answer

Temuan lengkap beserta kutipan sumbernya: **`.scratch/manajemen-struktur/research/03-unique-constraint.md`**. Ringkasannya di bawah; yang butuh SQL persisnya baca berkas itu.

### 1. Partial unique index, dan dua saingannya gugur

```sql
CREATE UNIQUE INDEX organization_slug_live_unique
    ON organization (slug) WHERE deleted_at IS NULL;
```

Dokumentasi PostgreSQL menamai kasus ini secara eksplisit (CREATE INDEX; §11.8
Partial Indexes, Contoh 11.3). Dua alternatifnya ditolak berdasarkan bukti:

- **`UNIQUE (slug, deleted_at)` dengan NULLS DISTINCT bawaan itu jebakan yang
  rapi dan diam.** Dua baris hidup sama-sama ber-`deleted_at = NULL`, dan NULL
  tidak pernah sama dengan NULL — jadi constraint-nya **tidak menangkap apa
  pun**. Ia terlihat benar dan tidak bekerja.
- **`UNIQUE NULLS NOT DISTINCT (slug, deleted_at)` benar-benar bekerja**,
  pemulihan termasuk, tapi menolak dua penghapusan slug yang sama pada timestamp
  identik (gagal palsu) dan menaruh kolom audit ke dalam kunci.

**Kasus tabrakan saat pemulihan** — ini intinya: galat muncul di `UPDATE`
pemulihan, **bukan** saat penghapusan dan **bukan** saat Struktur kedua dibuat
(pembuatan itu memang sah). SQLSTATE `23505` / `unique_violation`, seluruh
UPDATE di-rollback. `code` tidak pernah punya kasus ini — constraint lintas
semua barisnya memajukan kegagalan ke waktu pembuatan, dan itu memang yang
ADR 0004 inginkan.

### 2. Drizzle memancarkannya — diverifikasi dengan menjalankannya

`drizzle-kit generate` betul-betul menghasilkan:

```sql
CREATE UNIQUE INDEX "organization_slug_live_unique"
    ON "organization" ("slug") WHERE ("deleted_at" is null);
```

Jejak sumber: `drizzle-orm/pg-core/indexes.js:81`,
`drizzle-kit/drizzle-DX4zjwm_.js:315-326`, `drizzle-kit/diff-BQc-7Nm8.js:458-469`.

**Jebakan untuk implementasi tiket 01:** `drizzle-kit` **membuang `NOT NULL`**
dari kolom generated yang ditambahkan lewat `ALTER TABLE` (cabang `!generated`
di `addColumnConvertor`). Kolom Keadaan yang direncanakan akan mendarat
nullable dan selamanya berselisih dengan skema TS-nya. Migrasinya butuh
`SET NOT NULL` yang ditambahkan tangan.

### 3. `code_slug` tidak butuh keunikannya sendiri

Keunikan `code` **tidak** menurunkan keunikan `code_slug` —
`replace(lower(code), '.', '-')` membuang dua dimensi sekaligus, dan format
`code` nyata di `src/lib/utils/member.ts` sudah memakai `.` maupun `-` sebagai
pemisah (`19.PD-1` dan `19-PD-1` menghasilkan slug yang sama).

Tapi rekomendasinya tetap **jangan dipasangi constraint**: tidak ada satu pun
pembaca di `src/app`, `src/components`, atau `src/lib`, dan
`generateRegisterNumber` mengurai `code` langsung. Jadi argumen ADR 0004 tidak
merambat ke sini.

### 4. `CONCURRENTLY` tidak bisa dinyatakan sebagai migrasi Drizzle — sama sekali

`drizzle-orm/pg-core/async/session.js:128` membungkus **seluruh migrasi yang
tertunda dan tiap statement di dalamnya** ke dalam satu `db.transaction()`.
Tidak ada opsi keluar di kedua paket. **Diverifikasi tangan di repo ini.**

Jebakannya berlapis: `drizzle-kit generate` dengan senang hati memancarkan
`CREATE INDEX CONCURRENTLY`, lalu runner-nya menjalankannya di dalam transaksi,
gagal, dan **seluruh migrasi di-rollback**. Lapisan tipe dan generator sama-sama
menerima apa yang runner-nya tidak bisa jalankan.

Catatan lain: `ADD CONSTRAINT UNIQUE` mengambil ACCESS EXCLUSIVE (memblokir
baca juga), sementara `CREATE UNIQUE INDEX` hanya memblokir tulis. Dan
`USING INDEX` tidak bisa menyelamatkan indeks slug — partial index dikecualikan
secara eksplisit.

### Risiko sebenarnya bukan penguncian

Tabel ini ribuan baris, bukan jutaan, jadi durasi kuncinya tidak jadi soal.
Yang jadi soal adalah **data duplikat yang mungkin sudah ada**. Itu **tiket 04**,
dan ia naik status dari "informasi berguna" jadi **penghalang keras**: migrasi
constraint tidak boleh ditulis sebelum 04 dijalankan.

### Yang tidak bisa diverifikasi / celah yang terbuka

- **Pemulihan bisa gagal, dan tiket 02 tidak punya sel untuknya.** Kegagalan itu
  bukan soal kewenangan dan bukan prasyarat penghapusan — ia jenis ketiga.
  Diserahkan ke **tiket 08** sebagai pertanyaan nomor 7, karena alur pemulihan
  memang permukaan yang ia garap.
- `.github/workflows/ci.yml` memakai `postgres:16` sementara migrasi dasarnya
  memanggil `uuidv7()` yang butuh PG 18+. Dua hal itu tidak bisa dua-duanya
  benar. Di luar cakupan peta ini, tapi dicatat karena ia menyentuh kemampuan
  menguji migrasi.

**Masukan dari tiket 01 (sudah selesai).** Tiket 01 menetapkan Struktur Terhapus
diperlakukan **seolah barisnya tidak pernah ada**. Prinsip itu berlaku untuk
pembacaan, **bukan** untuk keunikan `code` — ADR 0004 mengunci `code` selamanya
justru karena Struktur yang "nol Member" masih bisa menggantung Member terhapus
(`member.deleted_at`) yang Nomor Induknya sudah tercetak dari `code` itu. Jadi
dua aturan di atas berdiri: `code` unik lintas semua baris, `slug` unik hanya di
antara yang belum Terhapus. Yang masih jadi pekerjaan tiket ini adalah
**bentuknya**, bukan kebijakannya.
