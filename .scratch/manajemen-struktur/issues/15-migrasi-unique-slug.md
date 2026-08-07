# 15 — Migrasi B: partial unique index `slug`

**Type:** implementation
**Status:** open
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

- Migrasinya jalan bersih di staging
- Dua Struktur hidup ber-slug sama ditolak `23505`
- Struktur baru boleh memungut slug milik Struktur Terhapus (itu **sah**, bukan bug)
