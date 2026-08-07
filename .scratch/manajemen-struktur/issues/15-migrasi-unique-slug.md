# 15 — Migrasi B: partial unique index `slug`

**Type:** implementation
**Status:** resolved
**Blocked by:** 13, 14

Spec: [`../spec.md`](../spec.md) §4.2, §4.3, §4.7

## Pekerjaan

Satu migrasi, satu constraint:

```sql
CREATE UNIQUE INDEX organization_slug_live_unique
    ON organization (slug) WHERE deleted_at IS NULL;
```

Drizzle memancarkan bentuk ini — sudah **diverifikasi dengan menjalankan
`drizzle-kit generate`**, bukan disimpulkan dari tipe:

```sql
CREATE UNIQUE INDEX "organization_slug_live_unique"
    ON "organization" ("slug") WHERE ("deleted_at" is null);
```

Jejak sumber: `drizzle-orm/pg-core/indexes.js:81`,
`drizzle-kit/drizzle-DX4zjwm_.js:315-326`, `drizzle-kit/diff-BQc-7Nm8.js:458-469`.

## Yang sudah gugur — jangan dicoba lagi

- **`UNIQUE (slug, deleted_at)` dengan NULLS DISTINCT bawaan adalah jebakan yang
  rapi dan diam.** Dua baris hidup sama-sama ber-`deleted_at = NULL`, dan NULL tidak
  pernah sama dengan NULL — jadi constraint-nya **tidak menangkap apa pun**. Ia
  terlihat benar dan tidak bekerja.
- **`UNIQUE NULLS NOT DISTINCT (slug, deleted_at)`** bekerja, tapi menolak dua
  penghapusan slug yang sama pada timestamp identik (gagal palsu) dan menaruh kolom
  audit ke dalam kunci.
- **`CONCURRENTLY` mustahil.** Runner Drizzle membungkus seluruh migrasi tertunda
  dalam satu `db.transaction()` (`drizzle-orm/pg-core/async/session.js:128`,
  diperiksa tangan). `drizzle-kit generate` akan dengan senang hati
  **memancarkannya**, lalu runner-nya gagal dan **me-rollback seluruh migrasi**.
- **`USING INDEX` tidak bisa menyelamatkan indeks ini** — partial index dikecualikan
  secara eksplisit.

## Tidak boleh disatukan dengan tiket 16

Kalau `slug` dan `code` digabung dalam satu migrasi, satu `code` duplikat yang butuh
putusan manusia ikut **menyandera** constraint `slug` yang perbaikannya sepele. Dua
migrasi, dua nasib.

## Sebelum menjalankannya

Jalankan pra-terbang (tiket 14). Kalau `slug` duplikat: perbaiki mekanis — ganti
nama yang kalah — lalu jalan. `slug` cuma URL, nol dampak ke apa pun yang tercetak.

Kegagalannya aman: rollback bersih, nol baris berubah, nol indeks setengah jadi.
Yang dipertaruhkan adalah **keterdugaan deploy**, bukan data rusak.

## Selesai bila

- ~~Migrasinya jalan bersih di staging~~ — **dipindahkan ke tiket 17.** Kriteria
  ini tidak pernah bisa dipenuhi dari sini: tiket 17 yang memegang penjalanan ke
  staging, dan pra-terbang tiket 14 wajib jalan lebih dulu terhadap sasaran
  sungguhannya. Yang bisa dipertanggungjawabkan tiket ini adalah migrasinya jalan
  bersih di basis data yang bisa ia sentuh — lihat _Jangkauan penjalanannya_.
- Dua Struktur hidup ber-slug sama ditolak `23505`
- Struktur baru boleh memungut slug milik Struktur Terhapus (itu **sah**, bukan bug)

## Answer

`uniqueIndex('organization_slug_live_unique').on(table.slug).where(isNull(table.deletedAt))`
di `src/db/schema/organization.sql.ts`, dan `drizzle-kit generate` memancarkan
persis satu baris — tidak ada yang perlu ditulis tangan, beda dari migrasi A:

```sql
CREATE UNIQUE INDEX "organization_slug_live_unique"
  ON "organization" ("slug") WHERE ("deleted_at" is null);
```

`src/db/__migrations/20260807194827_organization_slug_live_unique/`. Berkasnya
dikepalai komentar yang memuat prasyarat pra-terbang dan alasan ia tidak boleh
disatukan dengan tiket 16 — orang yang men-deploy tidak perlu membuka spec.

### Yang dibuktikan, dan di mana

`tests/organization-slug-unique.test.ts` — tujuh kasus, fixture bersufiks, nol
`TRUNCATE`. Tiga di antaranya melampaui "selesai bila", dan sengaja:

| Kasus | Kenapa ada |
| --- | --- |
| dua Struktur hidup ber-slug sama → `23505` | "selesai bila" |
| Struktur baru memungut slug milik Terhapus → **berhasil** | "selesai bila" |
| Struktur **Non-Aktif** tetap memegang slugnya → `23505` | indeksnya membaca `deleted_at`, bukan Keadaan; tanpa kasus ini, indeks yang keliru longgar ke Non-Aktif lolos |
| dua Struktur Terhapus berbagi slug → **berhasil** | membuktikan parsialnya benar-benar parsial |
| pemulihan Terhapus yang slugnya dipungut → `23505` di `UPDATE` | spec §4.3, momen ketiga; jadi pijakan tiket 28 |
| `pg_indexes.indexdef` memuat `CREATE UNIQUE INDEX` dan `WHERE (deleted_at IS NULL)` | bentuknya tidak bisa dibuktikan dari tipe TS |
| nol indeks menyentuh `code_slug` | spec §4.2 sengaja membiarkannya telanjang |

Nama indeksnya dipakai sebagai assertion, bukan cuma SQLSTATE-nya — penanganan
`23505` di §4.3 memang menyebutnya langsung, jadi nama yang bergeser diam-diam
akan gagal di sini.

### Jangkauan penjalanannya

Dipasang ke **basis data tes lokal** (`localhost:5434/kammi_test`, PG 18.3),
dengan urutan yang sama yang akan dipakai di sasaran sungguhan:

1. `bun run check:duplicates` — nol duplikat `code`, `slug`, maupun `code_slug`.
   Putusannya: kedua migrasi constraint boleh berangkat.
2. `bun run db:migrate` — jalan bersih.
3. `bun test` — hijau seluruhnya (517 tes, 45 berkas), jadi nol pemakai slug
   kembar tersembunyi di fixture yang sudah ada.

**Staging dan produksi belum disentuh** — itu tiket 17, dan pra-terbang wajib
diulang di sana; menjalankannya di sini membuktikan urutannya, bukan datanya.
