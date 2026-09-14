# 03 — Keunikan di bawah soft delete: temuan riset

**Untuk tiket:** `.scratch/manajemen-struktur/issues/03-unique-constraint-di-bawah-soft-delete.md`
**Sifat:** riset sumber primer. Tidak ada kode aplikasi, skema, atau basis data yang disentuh saat menulis ini.

## Sumber dan versi yang dipakai

| Sumber                    | Versi / lokasi                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Dokumentasi PostgreSQL    | `https://www.postgresql.org/docs/18/` (PG 18 — sesuai `docker-compose.yml:4`, `postgres:18.3-bookworm`) |
| `drizzle-orm`             | `1.0.0-beta.21` — `node_modules/drizzle-orm/`                                       |
| `drizzle-kit`             | `1.0.0-beta.21` — `node_modules/drizzle-kit/`                                       |
| Skema saat ini            | `src/db/schema/organization.sql.ts`                                                 |
| Migrasi saat ini          | `src/db/__migrations/` (7 folder, format v3: `<stamp>_<nama>/migration.sql`)         |

Semua klaim di bawah punya jejak: kutipan dokumentasi PostgreSQL, atau baris berkas di
`node_modules/`, atau keluaran `drizzle-kit generate` yang benar-benar dijalankan
(offline, tanpa koneksi basis data — lihat catatan metode di akhir).

---

## Ringkasan yang bisa langsung dipakai

| Aturan                                     | Bentuk yang dipilih                                                            | Alasan satu kalimat                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `code` unik lintas **semua** baris          | `UNIQUE` constraint biasa — `unique('organization_code_unique').on(table.code)` | Aturannya memang tanpa syarat; constraint bernama lebih mudah ditangkap di jalur tulis.               |
| `slug` unik hanya di antara **yang hidup**  | **Partial unique index** `WHERE deleted_at IS NULL`                              | Bentuk yang persis disebut dokumentasi PostgreSQL untuk pekerjaan ini; tidak menaruh timestamp di key. |
| `code_slug`                                 | **Tidak diberi keunikan** di migrasi ini                                        | Pemetaannya lossy, keunikan `code` tidak menurunkannya, dan hari ini tidak ada satu pun pembaca.       |
| `CONCURRENTLY`                              | **Tidak dipakai**                                                               | Tidak bisa dieksekusi lewat `drizzle-kit migrate` sama sekali (runner-nya membungkus satu transaksi).  |

**Blocker:** migrasi ini tidak boleh jalan sebelum **tiket 04** ditutup dengan hasil nol
duplikat. `CREATE UNIQUE INDEX` memeriksa data yang sudah ada, dan seluruh migrasi drizzle
berjalan dalam satu transaksi — satu duplikat menggagalkan semuanya. Lihat §4.5.

Dan satu temuan yang **membuka celah spec, bukan sekadar menjawab tiket**: aksi
`pulihkan` bisa gagal karena tabrakan slug, dan hari ini tidak ada tempat di spec
yang menampung kegagalan itu. Lihat §1.4.

---

## 1. Bentuk keunikan parsial di PostgreSQL

### 1.1 Jawaban

**Partial unique index.**

```sql
CREATE UNIQUE INDEX "organization_slug_live_unique"
  ON "organization" ("slug")
  WHERE deleted_at IS NULL;
```

Ini bukan pilihan selera. Dokumentasi PostgreSQL menyebut kegunaan ini secara
harfiah, dua kali:

> "Another possible application is to use `WHERE` with `UNIQUE` to enforce uniqueness over a subset of a table."
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

> "A third possible use for partial indexes does not require the index to be used in queries at all. The idea here is to create a unique index over a subset of a table... This enforces uniqueness among the rows that satisfy the index predicate, without constraining those that do not."
> — [11.8. Partial Indexes, PG 18](https://www.postgresql.org/docs/18/indexes-partial.html)

Halaman yang sama memberi contoh resminya (Example 11.3): satu `success` per
`(subject, target)`, `unsuccessful` berapa pun. Bentuk soal kita identik — satu slug
hidup per slug, baris terhapus berapa pun.

### 1.2 Kenapa dua kandidat lain gugur

**Kandidat A — `UNIQUE (slug)` polos.** Salah dari awal: ia mengunci slug milik
Struktur Terhapus selamanya, padahal charting sudah memutuskan slug dibebaskan.
Disebut hanya untuk dicoret.

**Kandidat B — `UNIQUE (slug, deleted_at)` biasa (default `NULLS DISTINCT`). RUSAK
TOTAL, dan rusaknya senyap.** Ini jebakan yang paling mungkin ditulis orang karena
kelihatan paling "rapi". Dokumentasinya:

> "For the purpose of a unique constraint, null values are not considered equal, unless `NULLS NOT DISTINCT` is specified."
> — [CREATE TABLE, PG 18](https://www.postgresql.org/docs/18/sql-createtable.html)

Dua Struktur hidup dua-duanya punya `deleted_at = NULL`. Karena NULL tidak dianggap
sama dengan NULL, `('kammi-uin', NULL)` dan `('kammi-uin', NULL)` **tidak** dianggap
duplikat. Constraint-nya terpasang, terlihat di `\d`, dan **tidak menangkap apa pun**
— persis bug yang tiket ini mau tutup, sekarang dengan alibi.

**Kandidat C — `UNIQUE NULLS NOT DISTINCT (slug, deleted_at)`.** Ini kandidat B yang
sudah dibetulkan, dan ia **benar-benar bekerja**, termasuk di kasus pemulihan. Dengan
`NULLS NOT DISTINCT`, NULL dianggap sama dengan NULL, jadi dua baris hidup dengan slug
sama tertangkap. Tetap ditolak karena dua hal:

1. **Tabrakan palsu.** Dua Struktur berbeda yang pernah memakai slug sama, lalu dihapus
   pada `deleted_at` yang **persis sama**, akan saling menolak. Peluangnya kecil (presisi
   `timestamp` PostgreSQL mikrodetik) tapi bukan nol — dan yang mahal bukan peluangnya,
   melainkan bahwa penghapusan bisa gagal karena alasan yang tidak bisa dijelaskan ke
   pengguna.
2. **Ia menaruh kolom jejak ke dalam key.** `deleted_at` itu catatan audit (map.md:75).
   Begitu ia jadi bagian kunci unik, mengoreksi timestamp-nya jadi operasi yang bisa
   melanggar constraint. Partial index tidak punya masalah ini: `deleted_at` hanya
   dibaca predikat, tidak diindeks.

**Kandidat D — generated column, mis. `slug_live GENERATED ALWAYS AS (CASE WHEN
deleted_at IS NULL THEN slug END) STORED` + `UNIQUE (slug_live)`.** Sah secara
PostgreSQL (ekspresinya immutable dan hanya menyentuh baris sendiri, sesuai syarat di
[5.4. Generated Columns](https://www.postgresql.org/docs/18/ddl-generated-columns.html)),
dan perilakunya di kasus pemulihan **identik** dengan partial index. Kelebihannya satu
dan nyata: hasilnya `UNIQUE` constraint betulan, bukan sekadar index (lihat §4.3 kenapa
itu tidak bisa didapat dari partial index). Ditolak karena harganya kolom tersimpan
ketiga di tabel yang sudah punya dua kolom turunan, dan karena skema jadi punya **dua
ejaan untuk satu slug** — orang berikutnya harus menebak mana yang dibaca. Kalau
suatu saat ada alasan kuat butuh constraint bernama alih-alih index, ini opsi
cadangannya; catat, jangan pakai sekarang.

### 1.3 Kasus pemulihan — inti soalnya

Skenarionya, dengan angka:

1. `PK Kammi UIN` punya `slug = 'kammi-uin'`. Dihapus. `deleted_at` terisi.
   Barisnya **keluar dari index** — index parsial hanya berisi baris yang memenuhi
   predikat.
2. Struktur baru dibuat, mengambil `slug = 'kammi-uin'`. **Berhasil, dan memang
   seharusnya berhasil** — tidak ada baris hidup lain yang memegang slug itu. Ini bukan
   kecelakaan; ini kebijakan "slug dibebaskan" yang bekerja.
3. Root memulihkan Struktur yang tadi dihapus:
   ```sql
   UPDATE organization
      SET deleted_at = NULL, is_non_active = false
    WHERE id = '…';
   ```

**Di langkah 3 barisnya masuk kembali ke predikat index, dan di situ galatnya muncul.**
Dokumentasinya menyebut `UPDATE` secara eksplisit, bukan hanya `INSERT`:

> "Causes the system to check for duplicate values in the table when the index is created (if data already exist) and each time data is added. Attempts to insert or update data which would result in duplicate entries will generate an error."
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

Yang perlu dipegang orang yang membangun:

- **Kapan:** saat `UPDATE` pemulihan, bukan saat penghapusan, dan bukan saat pembuatan
  Struktur baru di langkah 2. Tidak ada satu pun titik lebih awal yang bisa menolak —
  langkah 2 memang sah.
- **Apa:** `SQLSTATE 23505`, kondisi `unique_violation`
  ([Appendix A, PG 18](https://www.postgresql.org/docs/18/errcodes-appendix.html)).
  Galatnya menyebut nama index yang dilanggar, jadi **beri nama eksplisit** pada
  index-nya (`organization_slug_live_unique`) supaya jalur tulis bisa membedakannya dari
  pelanggaran `code`.
- **Sifatnya:** seluruh `UPDATE` dibatalkan. Tidak ada pemulihan separuh.

Perhatikan `code` **tidak** punya kasus ini sama sekali. Karena keunikannya lintas semua
baris, langkah 2 tidak akan pernah terjadi untuk `code` — Struktur baru yang mencoba
memungut `code` milik Struktur Terhapus ditolak saat **pembuatan**. Kegagalannya pindah
ke tempat yang benar, di depan orang yang sedang mengetik, bukan ke Root berbulan-bulan
kemudian. Ini persis yang dijanjikan ADR 0004, dan bentuk constraint-nya yang membuatnya
terjadi.

### 1.4 Celah spec yang ini buka

**`pulihkan` bisa gagal, dan tiket 02 tidak menampungnya.** Tiket 02 menulis
`pulihkan` "cukup `role === 'root'`" dan sengaja menaruh prasyarat penghapusan di luar
gate. Tapi tabrakan slug bukan kewenangan **dan** bukan prasyarat penghapusan — ia
kegagalan yang hanya bisa diketahui saat pemulihan dijalankan.

Ini bukan bug di keputusan tiket 02; ia konsekuensi yang belum pernah dinamai. Yang
perlu diputuskan di spec (tiket 08 atau permukaan Root-nya sendiri):

- Form `pulihkan` menerima slug pengganti, **atau**
- pemulihan otomatis menambah sufiks, **atau**
- pemulihan menolak dengan pesan "slug sudah dipakai, ganti dulu".

Yang ketiga paling murah dan paling jujur. Yang jelas tidak boleh: membiarkan 23505
naik sebagai galat 500. Riset ini tidak memilih — ia hanya menegaskan selnya kosong.

Catatan kecil yang ikut terbawa: tiket 01 memutuskan pemulihan mengosongkan
`deleted_at` **dan** `is_non_active`. Kalau suatu saat ada pemulihan yang berujung
Non-Aktif, barisnya tetap masuk predikat (`deleted_at IS NULL`), jadi tabrakan slug
tetap berlaku. Non-Aktif tidak membebaskan slug — hanya Terhapus.

---

## 2. Cara Drizzle menyatakannya, dan apakah `drizzle-kit` benar-benar mengeluarkannya

### 2.1 Jawaban singkat

Ya, benar-benar dikeluarkan. Bukan cuma lolos tipe. Diverifikasi tiga lapis: API,
serializer, konvertor SQL — plus satu kali `drizzle-kit generate` yang benar-benar
dijalankan.

### 2.2 Bentuknya di skema

```ts
import { pgTable, uniqueIndex, unique, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql, isNull, type SQL } from 'drizzle-orm'

export const organization = pgTable(
  'organization',
  (t) => ({
    // …kolom yang sudah ada…
    deletedAt: t.timestamp('deleted_at')
  }),
  (table) => [
    unique('organization_code_unique').on(table.code),
    uniqueIndex('organization_slug_live_unique')
      .on(table.slug)
      .where(isNull(table.deletedAt))
  ]
)
```

Dua bentuk itu sengaja berbeda, dan bedanya kelihatan di DDL:

- `unique()` → `ALTER TABLE … ADD CONSTRAINT … UNIQUE(...)` — constraint bernama.
- `uniqueIndex().where()` → `CREATE UNIQUE INDEX … WHERE …` — index, **bukan** constraint.
  Ini bukan pilihan; PostgreSQL tidak punya bentuk constraint untuk keunikan parsial.
  Lihat §4.3.

`.where()` hanya ada di `uniqueIndex()`/`index()`. `unique()` tidak punya — pilihan
satu-satunya di sana adalah `.nullsNotDistinct()`
(`node_modules/drizzle-orm/pg-core/unique-constraint.d.ts:12`), yaitu kandidat C di §1.2.

**Beri nama index secara eksplisit.** Kalau nama dikosongkan, drizzle menurunkannya dari
nama tabel + kolom (`node_modules/drizzle-kit/drizzle-DX4zjwm_.js:287`). Nama turunan
menyulitkan penanganan 23505 di §1.3 dan berubah diam-diam kalau kolomnya bergeser.

### 2.3 Bukti berlapis

**Lapis 1 — API menerima dan menyimpannya.**
`node_modules/drizzle-orm/pg-core/indexes.js:81-84`:

```js
where(condition) {
    this.config.where = condition;
    return this;
}
```

dan `:73-76` untuk `concurrently()`. Keduanya menempel ke `IndexBuilder.config`, bukan
dibuang.

**Lapis 2 — serializer drizzle-kit membacanya dari config.**
`node_modules/drizzle-kit/drizzle-DX4zjwm_.js:315-326`:

```js
let where = value.config.where ? dialect.sqlToQuery(value.config.where.inlineParams(), "indexes").sql : "";
where = where === "true" ? "" : where;
return {
    …
    isUnique: value.config.unique,
    where: where ? where : null,
    concurrently: value.config.concurrently ?? false,
    …
};
```

Perhatikan `.inlineParams()` — predikatnya di-inline sebagai literal SQL, bukan
parameter bind. Itu memang wajib: index predicate tidak bisa memuat parameter.

**Lapis 3 — konvertor menuliskannya ke DDL.**
`node_modules/drizzle-kit/diff-BQc-7Nm8.js:458-469`:

```js
const createIndexConvertor = convertor("create_index", (st) => {
    const { schema, table, name, columns, isUnique, concurrently, with: w, method, where } = st.index;
    const indexPart = isUnique ? "UNIQUE INDEX" : "INDEX";
    …
    const concur = concurrently ? " CONCURRENTLY" : "";
    const whereClause = where ? ` WHERE ${where}` : "";
    return `CREATE ${indexPart}${concur} "${name}" ON ${key}… (${value})${withClause}${whereClause};`;
});
```

**Lapis 4 — dijalankan betulan.** `drizzle-kit generate` dijalankan di direktori scratch
terpisah, dengan snapshot awal = skema `organization` yang ada di repo hari ini, lalu
skema diubah persis seperti §2.2 ditambah kolom turunan Keadaan. Keluaran
`migration.sql`, apa adanya:

```sql
ALTER TABLE "organization" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "keadaan" text GENERATED ALWAYS AS (CASE WHEN deleted_at IS NOT NULL THEN 'terhapus' WHEN is_non_active THEN 'non_aktif' ELSE 'aktif' END) STORED;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_code_unique" UNIQUE("code");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_live_unique" ON "organization" ("slug") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX CONCURRENTLY "organization_code_slug_concurrent_probe" ON "organization" ("code_slug");
```

Jadi: `WHERE` keluar, dan `CONCURRENTLY` juga keluar. Yang kedua itu justru masalahnya
— lihat §4.4.

### 2.4 Dua jebakan yang ikut ketemu, wajib dibaca tiket 01 dan 05

**Jebakan 1 — `NOT NULL` hilang dari kolom turunan yang ditambahkan lewat `ALTER`.**
Lihat baris `keadaan` di keluaran §2.3: di skema TS ia ditulis `.notNull()`, di DDL
`NOT NULL`-nya **tidak ada**. Ini sistematis, bukan kebetulan.
`node_modules/drizzle-kit/diff-BQc-7Nm8.js`, `addColumnConvertor`:

```js
const notNullStatement = column.notNull && !identity && !generated && !isSerial && !st.isCompositePK ? " NOT NULL" : "";
```

`!generated` mematikannya. Bandingkan jalur `CREATE TABLE`, yang **tidak** kena: di
`src/db/__migrations/20260529063120_free_vengeance/migration.sql`, `code_slug` dan
`level` dua-duanya keluar dengan `NOT NULL`.

Akibatnya untuk tiket 01: kolom Keadaan `generatedAlwaysAs` yang direncanakan akan
mendarat di produksi sebagai **nullable**, tidak cocok dengan skema TS, dan
`drizzle-kit` akan terus melihat selisih di generate berikutnya. Perbaikannya satu baris
yang ditambahkan manual ke `migration.sql`:

```sql
ALTER TABLE "organization" ALTER COLUMN "keadaan" SET NOT NULL;
```

**Jebakan 2 — `drizzle-kit` menerima dan mengeluarkan `CONCURRENTLY` yang tidak bisa
dijalankan oleh runner-nya sendiri.** Detailnya di §4.4. Disebut di sini supaya orang
yang membaca §2 saja tidak menyimpulkan "berarti aman dipakai".

---

## 3. Apakah `code_slug` butuh keunikannya sendiri

### 3.1 Jawaban

**Keunikan `code` TIDAK menurunkan keunikan `code_slug`.** Pemetaannya lossy, dan
tabrakannya bukan teoretis — bentuk `code` yang dipakai di repo ini membuatnya mudah.

Tapi jawaban praktisnya: **jangan tambahkan keunikan pada `code_slug` di migrasi ini.**

### 3.2 Kenapa pemetaannya bisa bertabrakan

Ekspresinya `replace(lower(code), '.', '-')` (`src/db/schema/organization.sql.ts:12-15`).
Dua operasi, dua-duanya membuang informasi:

- `lower()` melebur beda huruf besar-kecil,
- `replace('.', '-')` melebur `.` ke `-`, sehingga **dua karakter yang berbeda di `code`
  menjadi satu karakter yang sama di `code_slug`**.

Bentuk `code` sungguhan di sistem ini bisa dibaca dari regex di
`src/lib/utils/member.ts` — komentarnya menyebut `'19.PD-1'`, `'23.PD.1'`, `'31.PD 1'`,
`'1.PD-1.USK'`, `'PD.LN-8'`, `'PW1'`. Jadi `.` dan `-` **dua-duanya sudah dipakai
sebagai pemisah di data nyata**. Contoh tabrakan yang tidak dibuat-buat:

| `code` A     | `code` B     | `code_slug` yang sama |
| ------------ | ------------ | --------------------- |
| `19.PD-1`    | `19-PD-1`    | `19-pd-1`             |
| `1.PD-1.USK` | `1.PD.1.USK` | `1-pd-1-usk`          |
| `19.PD-1`    | `19.pd-1`    | `19-pd-1`             |

Ketiganya lolos `UNIQUE (code)` — nilainya memang berbeda — lalu bertabrakan di
`code_slug`. `code` diketik manusia dan **beku selamanya** (ADR 0004), jadi variasi
tanda baca dan huruf besar-kecil itu hal yang harus diasumsikan ada, bukan dikecualikan.

### 3.3 Kenapa tetap tidak diberi constraint sekarang

Tiga alasan, berurutan dari yang paling menentukan:

1. **Tidak ada yang membacanya.** Penelusuran seluruh `src/`: `code_slug` hanya muncul
   di definisi skema, dan di lima tempat yang meneruskannya sebagai kolom keluaran —
   `src/db/query/organization.ts:259`, `src/db/query/training.ts:140,306,328`,
   `src/db/query/cte/member.ts:16`, `src/db/query/cte/user.ts:21`. **Nol pemakaian di
   `src/app/`, `src/components/`, `src/lib/`.** Tidak ada rute yang mengalamati Struktur
   lewat `code_slug`. Keunikan menjaga pengalamatan; tidak ada yang dijaga.
2. **Nomor Induk tidak lewat sini.** `generateRegisterNumber` (`src/lib/utils/member.ts`)
   membaca `organization.code` langsung dan memarsingnya dengan regex. `code_slug` tidak
   ikut. Jadi argumen ADR 0004 — "`code` menurun ke Nomor Induk" — **tidak** merambat ke
   `code_slug`.
3. **Constraint-nya lebih ketat dari kebijakannya.** Kebijakannya "`code` unik".
   `UNIQUE (code_slug)` akan menolak `code` baru yang sah hanya karena tanda bacanya
   melebur ke `code` lama. Itu memberlakukan aturan yang tidak pernah diputuskan siapa
   pun.

Dan satu risiko operasional: kalau produksi **sudah** punya dua `code` yang melebur,
`ALTER TABLE … ADD CONSTRAINT UNIQUE(code_slug)` akan menggagalkan seluruh migrasi.
Menambahkan constraint yang tidak dibutuhkan sambil menaruh migrasi produksi dalam
risiko itu perdagangan yang salah arah.

### 3.4 Yang harus dicatat supaya tidak jadi bug diam

Begitu ada permukaan yang mengalamati Struktur lewat `code_slug` — URL, pencarian,
apa pun — ia **harus** dapat unique index-nya sendiri, dan bentuknya **lintas semua
baris** (bukan parsial), mengikuti `code` bukan `slug`, karena ia turunan `code`. Pada
saat itu, jalankan dulu pemeriksaan duplikat di §4.5. Selama itu belum terjadi,
`code_slug` adalah kolom yang tidak dibaca siapa pun — dan itu pertanyaan sendiri,
di luar tiket ini.

---

## 4. `CREATE UNIQUE INDEX` di tabel produksi yang sedang dilayani

### 4.1 Apa yang dikunci

**`CREATE UNIQUE INDEX` biasa (tanpa `CONCURRENTLY`)** — menahan tulis, membiarkan baca:

> "…whereas a standard index build locks out writes (but not reads) on the table until it's done."
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

**`ALTER TABLE … ADD CONSTRAINT … UNIQUE`** — lebih berat, karena ia `ALTER TABLE`:

> "Note that the lock level required may differ for each subform. An `ACCESS EXCLUSIVE` lock is acquired unless explicitly noted."
> — [ALTER TABLE, PG 18](https://www.postgresql.org/docs/18/sql-altertable.html)

`ADD CONSTRAINT … UNIQUE` tidak termasuk yang dikecualikan, jadi ia `ACCESS EXCLUSIVE`:
**baca ikut terhenti**, bukan hanya tulis. Ini yang akan dipakai `code` (§2.2), jadi
kalau ada satu pernyataan yang perlu diperhatikan durasinya, itu dia — bukan partial
index-nya.

Kedua-duanya di `organization` berskala pohon nasional KAMMI (PP + PW + PD/PDLN + PK),
yang ordenya ribuan baris, bukan jutaan. Durasi yang masuk akal: milidetik sampai
puluhan milidetik. **Ukuran tabel bukan risiko di sini.** Risikonya ada di §4.5.

### 4.2 Apakah `CONCURRENTLY` diperlukan di sini

**Tidak.** Dan lebih dari itu — **tidak bisa**, lewat jalur migrasi yang dipakai repo ini
(§4.4). Dua alasan berdiri sendiri; yang kedua saja sudah cukup memutuskan.

Biayanya, kalau toh dipertimbangkan:

> "Thus this method requires more total work than a standard index build and takes significantly longer to complete. However, since it allows normal operations to continue while the index is built, this method is useful for adding new indexes in a production environment. Of course, the extra CPU and I/O load imposed by the index creation might slow other operations."
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

Menukar kunci milidetik dengan "significantly longer to complete" plus mode gagal
sendiri (§4.6) di tabel seukuran ini adalah perdagangan yang rugi.

### 4.3 Konsekuensi bentuk: partial index tidak bisa jadi constraint

Trik baku "bangun index dengan `CONCURRENTLY`, lalu naikkan jadi constraint" —
`ALTER TABLE … ADD CONSTRAINT … UNIQUE USING INDEX …` — **tidak berlaku untuk `slug`**:

> "The index cannot have expression columns nor be a partial index. Also, it must be a b-tree index with default sort ordering."
> — [ALTER TABLE, PG 18](https://www.postgresql.org/docs/18/sql-altertable.html)

Jadi `organization_slug_live_unique` selamanya berupa **index**, tidak pernah muncul di
`information_schema.table_constraints`, dan tidak bisa di-`DROP CONSTRAINT`. Ia
di-`DROP INDEX`. Ini bukan kekurangan — itu memang satu-satunya bentuk yang PostgreSQL
sediakan untuk keunikan parsial — tapi harus diketahui siapa pun yang menulis kode yang
memeriksa nama constraint.

Untuk `code`, jalur `USING INDEX` **tersedia** (index-nya penuh, b-tree, tanpa
ekspresi), dan dokumentasinya menyebutnya persis untuk kasus produksi:

> "Adding a constraint using an existing index can be helpful in situations where a new constraint needs to be added without blocking table updates for a long time. To do that, create the index using `CREATE UNIQUE INDEX CONCURRENTLY`, and then convert it to a constraint using this syntax."

Itu jalan keluar **kalau** suatu saat `organization` cukup besar untuk peduli. Hari ini
tidak, dan §4.4 membuatnya mahal untuk dijalankan lewat drizzle.

### 4.4 `CONCURRENTLY` tidak bisa diekspresikan sebagai migrasi drizzle

Ini temuan paling menentukan di bagian 4, dan bukan soal PostgreSQL — soal runner-nya.

PostgreSQL:

> "Another difference is that a regular `CREATE INDEX` command can be performed within a transaction block, but `CREATE INDEX CONCURRENTLY` cannot."
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

Runner drizzle. `drizzle-kit migrate` untuk PostgreSQL menyerahkan eksekusi ke migrator
`drizzle-orm` (`node_modules/drizzle-kit/bin.cjs:244940-244946` →
`preparePostgresDB` → `drizzle-orm/<driver>/migrator`). Repo ini tidak memasang `pg`
maupun `postgres`, jadi urutan deteksi di
`node_modules/drizzle-kit/connections-DRQjaCx9.js:6616,6804,6864,6935,7010` mendarat di
cabang `bun` (`:7010-7014`), yang mengimpor
`drizzle-orm/bun-sql/postgres/migrator`. Migrator itu meneruskan ke
`node_modules/drizzle-orm/pg-core/async/session.js:98`, dan inilah eksekusinya
(`:128-132`):

```js
await db.transaction(async (tx) => {
    for (const migration of migrationsToRun) {
        for (const stmt of migration.sql) await tx.execute(sql.raw(stmt));
        await tx.execute(sql`insert into … values(…)`);
    }
});
```

**Seluruh migrasi yang tertunda — semua berkas, semua pernyataan — dijalankan di dalam
satu transaksi.** Pemisah `--> statement-breakpoint` hanya memecah string jadi beberapa
`execute` (`node_modules/drizzle-orm/migrator.js`, `query.split("--> statement-breakpoint")`);
ia **tidak** memecah transaksi. Tidak ada opsi untuk mematikannya: pencarian
`no-transaction` / `noTransaction` di `drizzle-kit` dan `drizzle-orm` nihil.

Akibatnya, kalau `CREATE INDEX CONCURRENTLY` ditulis di `migration.sql`:

- `drizzle-kit generate` mengeluarkannya dengan senang hati (dibuktikan di §2.3),
- `drizzle-kit migrate` menjalankannya di dalam transaksi,
- PostgreSQL menolak dengan **`SQLSTATE 25001`**, dan
- **seluruh transaksi rollback** — termasuk `ADD COLUMN deleted_at` dan index `slug`
  yang berada di berkas yang sama, dan termasuk migrasi lain yang kebetulan ikut
  tertunda.

Gagal total, bukan gagal separuh — itu satu-satunya kabar baiknya.

Kalau `CONCURRENTLY` betul-betul dibutuhkan suatu hari, jalurnya bukan `migration.sql`:

- **Jalankan di luar band** lewat `psql`, lalu tanam berkas migrasi kosong/penanda
  supaya snapshot drizzle tetap sinkron. Bahwa migrasi tulis-tangan sudah preseden di
  repo ini terlihat dari `src/db/__migrations/20260601000001_training_identifier_trigger/`
  — satu-satunya folder tanpa `snapshot.json`.
- **`drizzle-kit push` bisa**, karena ia mengeksekusi satu per satu tanpa transaksi
  (`node_modules/drizzle-kit/bin.cjs:238777-238780`: `for (const statement of …) { await db.query(statement) }`).
  Tapi `push` bukan migrasi berversi dan tidak meninggalkan riwayat — jangan dipakai
  untuk produksi.

### 4.5 Risiko yang sebenarnya: data yang sudah melanggar

Kunci bukan bahayanya. Bahayanya adalah `CREATE UNIQUE INDEX` **memeriksa data yang
sudah ada**:

> "Causes the system to check for duplicate values in the table when the index is created (if data already exist)…"
> — [CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html)

Dan tiket ini sendiri mencatat sebabnya: `slug` dan `code` **belum pernah punya
constraint apa pun**, dan `getCachedOrganization(slug)` mengambil baris pertama apa
adanya, jadi duplikat bisa sudah ada di produksi sekarang tanpa pernah terlihat.
Kalau ada satu saja, migrasinya gagal — dan karena semuanya satu transaksi (§4.4),
gagalnya menyeluruh.

**Ini sudah punya tiket sendiri: 04 — Cek duplikat `code`/`slug` di data nyata**
(`issues/04-cek-duplikat-code-slug-di-produksi.md`, status `open`), lengkap dengan
skripnya di `.scratch/manajemen-struktur/check-duplicates.ts`. Riset ini tidak
menjalankannya dan tidak menggantikannya. Yang ditambahkan di sini hanya satu hal:
**04 bukan sekadar pengumpul informasi, ia blocker teknis untuk 03.** Selama 04 belum
ditutup dengan hasil nol, migrasi §4.7 tidak boleh dijalankan — dan kalau hasilnya
tidak nol, yang dibutuhkan bukan `ALTER TABLE` melainkan pembersihan data lebih dulu,
yang untuk `code` berarti menyentuh Nomor Induk Anggota yang sudah tercetak.

Bentuk kuerinya, untuk dibaca berdampingan dengan skrip 04. Tiga-tiganya baca-saja:

```sql
-- 1. `code` kembar — harus nol. Kalau tidak nol, ini keputusan data, bukan teknis:
--    ADR 0004 mengunci `code`, jadi tidak ada yang boleh "dibetulkan" tanpa memeriksa
--    Nomor Induk Anggota yang sudah tercetak dari code itu.
SELECT code, count(*), array_agg(id) FROM organization GROUP BY code HAVING count(*) > 1;

-- 2. `slug` kembar di antara baris hidup — di sini masih semua baris hidup, karena
--    deleted_at belum ada. Harus nol.
SELECT slug, count(*), array_agg(id) FROM organization GROUP BY slug HAVING count(*) > 1;

-- 3. `code_slug` kembar — informatif saja; §3 memutuskan tidak memberinya constraint.
--    Hasil tidak-nol di sini adalah bukti langsung argumen §3.2.
SELECT code_slug, count(*), array_agg(code) FROM organization GROUP BY code_slug HAVING count(*) > 1;
```

Kueri (2) sengaja tidak memakai `WHERE deleted_at IS NULL`: kolomnya baru ada setelah
migrasi. Sebelum migrasi, semua baris hidup, jadi duplikat slug apa pun akan
menggagalkan index parsialnya.

### 4.6 Kalau `CONCURRENTLY` toh dipakai: mode gagalnya

Dicatat untuk kelengkapan, karena tiket menanyakannya. Semua dari
[CREATE INDEX, PG 18](https://www.postgresql.org/docs/18/sql-createindex.html):

**Apa yang tertinggal saat gagal:**

> "If a problem arises while scanning the table, such as a deadlock or a uniqueness violation in a unique index, the `CREATE INDEX` command will fail but leave behind an "invalid" index. This index will be ignored for querying purposes because it might be incomplete; however it will still consume update overhead."

Jadi kegagalannya **meninggalkan jejak**, tidak bersih seperti `CREATE INDEX` biasa.
Index INVALID tidak menegakkan apa-apa dan tidak dipakai kueri, tapi tetap dibebani
setiap tulis — kerugian murni.

**Cara mendeteksi:**

> "The psql `\d` command will report such an index as `INVALID`"

Cara yang bisa diskrip, tanpa `psql` interaktif:

```sql
SELECT c.relname
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
 WHERE NOT i.indisvalid;
```

**Cara pulih:**

> "The recommended recovery method in such cases is to drop the index and try again to perform `CREATE INDEX CONCURRENTLY`. (Another possibility is to rebuild the index with `REINDEX INDEX CONCURRENTLY`)."

```sql
DROP INDEX CONCURRENTLY "organization_slug_live_unique";
-- lalu ulangi CREATE UNIQUE INDEX CONCURRENTLY …
```

Perhatikan satu hal yang mudah terlewat: untuk **unique** index, penyebab gagal yang
paling mungkin bukan deadlock — melainkan **pelanggaran keunikan pada data yang sudah
ada**, yaitu persis §4.5. Kalau §4.5 dijalankan lebih dulu dan hasilnya nol,
`CONCURRENTLY` tidak menyelesaikan masalah apa pun yang tersisa.

### 4.7 Bentuk migrasi yang direkomendasikan

Satu berkas, tanpa `CONCURRENTLY`, urutan yang penting: kolom dulu, baru index yang
memakainya.

```sql
ALTER TABLE "organization" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_code_unique" UNIQUE("code");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_live_unique" ON "organization" ("slug") WHERE deleted_at IS NULL;
```

(Kolom jejak `deleted_by`, kolom `non_active_at`/`non_active_by`, dan kolom turunan
Keadaan dari tiket 01 masuk berkas yang sama; ditinggalkan di sini supaya yang
diperlihatkan hanya bagian yang tiket 03 putuskan. Kalau kolom Keadaan ikut, jangan lupa
§2.4 jebakan 1.)

Keterbalikannya asimetris, dan itu perlu dinyatakan:

```sql
DROP INDEX "organization_slug_live_unique";                                  -- index, bukan constraint
ALTER TABLE "organization" DROP CONSTRAINT "organization_code_unique";        -- constraint
ALTER TABLE "organization" DROP COLUMN "deleted_at";
```

---

## Yang TIDAK bisa diverifikasi di riset ini

Dinyatakan terpisah supaya tidak terbaca sebagai temuan.

1. **Isi basis data produksi.** Tidak ada perintah basis data yang dijalankan dan tidak
   ada koneksi yang dibuka (batasan tugas). Jadi **tidak diketahui** apakah `code`,
   `slug`, atau `code_slug` sudah punya duplikat hari ini. Itu pekerjaan **tiket 04**,
   yang masih `open`; §4.5 hanya menaikkannya dari "informasi berguna" jadi **blocker**
   untuk migrasi tiket ini.

2. **Versi PostgreSQL produksi.** `docker-compose.yml:4` menyebut `postgres:18.3-bookworm`
   dan seluruh dokumentasi di atas dikutip dari PG 18. Produksinya sendiri tidak
   diperiksa. Yang relevan: partial unique index dan `CREATE INDEX CONCURRENTLY` sudah
   ada sejak lama dan tidak berisiko soal versi; `NULLS NOT DISTINCT` (kandidat C, yang
   ditolak) butuh PG 15+.
   **Ikutannya, di luar cakupan tiket ini tapi ditemukan sambil jalan:**
   `.github/workflows/ci.yml:13` memakai `postgres:16`, sementara migrasi dasar
   (`20260529063120_free_vengeance`) memakai `uuidv7()`. Kalau CI benar-benar
   menjalankan migrasi, kombinasi itu tidak akan jalan. Tidak dikejar di sini.

3. **Teks pesan galat 23505.** SQLSTATE-nya `23505`/`unique_violation` terverifikasi dari
   [Appendix A](https://www.postgresql.org/docs/18/errcodes-appendix.html). Bahwa
   pesannya memuat nama index disimpulkan dari perilaku umum PostgreSQL, **bukan** dari
   kutipan dokumentasi maupun eksekusi. Kalau jalur tulis mau mencocokkan nama index,
   verifikasi dulu bentuk pesannya terhadap server sungguhan — atau lebih aman, cocokkan
   pada SQLSTATE ditambah nama constraint dari field terstruktur driver, bukan
   substring pesan.

4. **Larangan index di virtual generated column.** Halaman
   [5.4. Generated Columns](https://www.postgresql.org/docs/18/ddl-generated-columns.html)
   yang diambil tidak memuat satu pun kalimat tentang index atau unique pada generated
   column, jadi tidak ada kutipan yang bisa disajikan. Ini tidak menghalangi apa pun di
   sini: `drizzle-kit` selalu mengeluarkan `STORED` (terlihat di
   `src/db/__migrations/20260529063120_free_vengeance/migration.sql` untuk `code_slug`
   dan `level`, dan di §2.3 untuk `keadaan`), dan index atas stored generated column
   terbukti dikeluarkan tanpa keluhan di §2.3. Yang belum diverifikasi adalah larangan
   untuk kolom **virtual** — tidak relevan karena repo ini tidak memakainya.

5. **Perilaku runtime migrasi.** `drizzle-kit generate` dijalankan betulan (offline,
   tanpa koneksi). `drizzle-kit migrate` **tidak** dijalankan. Klaim "satu transaksi
   untuk semua pernyataan" di §4.4 dibaca dari kode migrator
   (`node_modules/drizzle-orm/pg-core/async/session.js:128`) dan dari rantai pemilihan
   driver, bukan dari eksekusi. Rantai driver itu sendiri bergantung pada `checkPackage`
   saat runtime; kesimpulan "cabang `bun` yang terpilih" didasarkan pada tidak adanya
   `pg`, `postgres`, `@vercel/postgres`, dan `@neondatabase/serverless` di
   `node_modules/`. **Yang tidak bergantung pada driver mana pun:** keempat cabang
   PostgreSQL memanggil migrator `drizzle-orm` yang sama, dan pembungkus transaksinya ada
   di migrator itu — jadi kesimpulannya berdiri walau drivernya berubah.

6. **`CREATE INDEX CONCURRENTLY` → SQLSTATE 25001.** Bahwa PostgreSQL menolaknya di
   dalam transaksi terverifikasi dari kutipan dokumentasi CREATE INDEX. Kode galat
   spesifik `25001` (`active_sql_transaction`) tidak dikonfirmasi lewat kutipan maupun
   eksekusi. Yang penting untuk keputusan — penolakannya dan rollback-nya — tidak
   bergantung pada nomor itu.

---

## Catatan metode

`drizzle-kit generate` dijalankan dua kali di direktori scratch di luar repo
(`node_modules` di-symlink, `out` mengarah ke scratch), dengan
`dbCredentials.url` menunjuk host yang tidak ada. `generate` tidak membuka koneksi
basis data, dan `src/scripts/db-guard.ts` memang hanya dipasang di depan `db:migrate`,
`db:push`, dan `db:studio` — bukan `db:generate`. Tidak ada berkas repo yang berubah, dan
`src/db/__migrations/` tidak disentuh. Direktori scratch-nya sudah tidak dipakai lagi.
