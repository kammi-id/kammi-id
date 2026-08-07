# 13 — Migrasi A: kolom Keadaan, kolom jejak, cabut cascade

**Type:** implementation
**Status:** open
**Blocked by:** —

Spec: [`../spec.md`](../spec.md) §1.1, §1.2, §1.6, §4.1, §4.4, §4.7

## Pekerjaan

Satu rombongan migrasi. Ia tidak memasang satu pun unique constraint — itu tiket
15 dan 16, dan pemisahannya disengaja.

### Skema `organization`

Tambahkan:

- `deleted_at` (timestamp, nullable), `deleted_by` (uuid, nullable, → `user.id`)
- `non_active_at` (timestamp, nullable), `non_active_by` (uuid, nullable, → `user.id`)
- Kolom **Keadaan** sebagai `generatedAlwaysAs`, mengikuti pola `level` dan
  `code_slug` yang sudah ada di tabel yang sama:

  ```
  deleted_at IS NOT NULL  → 'terhapus'
  is_non_active = true    → 'non_aktif'
  selain itu              → 'aktif'
  ```

`is_non_active` **tidak disentuh sama sekali** — jangan tergoda menukarnya jadi
enum tunggal. Ia sudah berisi data produksi dan sudah punya call-site baca
(`getCachedOrganizations({ isNonActive: false })` di `trainings/page.tsx:45`).

### Jebakan yang wajib ditangani tangan

`drizzle-kit` **membuang `NOT NULL` dari kolom generated** yang ditambahkan lewat
`ALTER TABLE` (cabang `!generated` di `addColumnConvertor`). Kolom Keadaan akan
mendarat **nullable** dan selamanya berselisih dengan skema TS-nya.

**Buka berkas migrasi hasil `drizzle-kit generate` dan tambahkan `SET NOT NULL`
dengan tangan.** Verifikasi dengan menjalankan migrasinya, bukan dengan membaca
tipenya.

**Tidak ada `CONCURRENTLY`** di berkas ini maupun di tiket 15/16 — lihat spec §4.1.

### Cabut cascade

Cabut keempat `onDelete: 'cascade'` ke `organization`:
`article.organization_id`, `article_category.organization_id`,
`site_settings.organization_id`, `user.connected_organization_id`.

**Hapus fungsi `deleteOrganization`** (`src/db/query/organization.ts:325`, masih
`db.delete`, nol call-site).

Setelah ini `DELETE FROM organization` gagal dengan `23503 foreign_key_violation`
dan nol baris berubah, alih-alih berhasil senyap sambil membawa Akun penggunanya.
**ADR 0004 naik dari konvensi jadi jaminan skema.**

### Pembaca terpusat

Kolom turunan **tidak menggantikan** pembaca terpusat di
`src/db/query/organization.ts`. Kolom membuat Keadaan bisa **dibaca**; ia tidak
membuat orang ingat **menyaringnya**. Bangun dua-duanya. Penyaringannya sendiri
adalah tiket 20.

## Selesai bila

- `drizzle-kit generate` menghasilkan migrasi yang jalan bersih dari nol
- Kolom Keadaan `NOT NULL` di basis data, bukan cuma di TS
- `deleteOrganization` tidak ada lagi, dan `bun run check:types` hijau
- `DELETE FROM organization` atas baris yang punya Akun gagal dengan `23503`
