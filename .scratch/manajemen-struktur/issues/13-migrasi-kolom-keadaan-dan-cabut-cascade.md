# 13 — Migrasi A: kolom Keadaan, kolom jejak, cabut cascade

**Type:** implementation
**Status:** resolved
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

## Answer

Migrasi `20260807060403_swift_anita_blake`. **Ia belum dijalankan ke staging
maupun produksi** — berkasnya siap, penjalanannya menunggu gladi bersih (tiket
17).

**Kolom Keadaan bernama `state`**, bernilai `'aktif' | 'non_aktif' | 'terhapus'`.
Nama kolomnya Inggris dan nilainya Indonesia, mengikuti pola yang sudah ada di
repo (`gender` → `ikhwan`/`akhwat`, `role` → `bph`/`bpw`). `status` sengaja
dihindari: `member.status` sudah memakai nama itu untuk Jenjang Kekaderan.

**Jebakannya nyata, persis seperti yang diperingatkan.** `drizzle-kit generate`
memancarkan kolomnya sebagai `text GENERATED ALWAYS AS (...) STORED` **tanpa**
`NOT NULL`. `ALTER COLUMN "state" SET NOT NULL` ditulis tangan ke berkas
migrasinya, dengan komentar yang menyebut bahwa regenerasi akan membuangnya lagi.
Snapshot-nya sendiri sudah mencatat `notNull: true`, jadi `drizzle-kit generate`
berikutnya menjawab "No schema changes" — kalau `SET NOT NULL` hilang, drift-nya
tidak akan pernah ketahuan dari `generate`, hanya dari basis data. Karena itu
verifikasinya lewat `information_schema`, dan itu satu tes.

`deleted_by` dan `non_active_by` menunjuk `user.id`, jadi
`organization.sql.ts` sekarang mengimpor `user.sql.ts` yang sudah mengimpornya
balik. Siklusnya aman karena kedua sisi memakai `references()` yang malas
(`(): AnyPgColumn => ...`), dan itu memang pola yang sudah dipakai
`parent_id` di tabel yang sama.

**Gladi bersih dari nol sudah dijalankan** di basis data scratch lokal
(`kammi_migrate_dryrun` di localhost:5434, dibuat lalu dibuang) — seluruh rantai
migrasi jalan bersih, `state` mendarat `is_nullable = NO` dan
`is_generated = ALWAYS`, dan **ketujuh** FK ke `organization` berakhir
`confdeltype = 'a'` (NO ACTION), nol cascade tersisa. Staging dan produksi tidak
disentuh.

`DELETE FROM organization` atas baris ber-Akun sekarang gagal dengan `23503` di
constraint `user_connected_organization_id_organization_id_fkey`, nol baris
berubah. Satu catatan untuk yang menulis tes berikutnya: **SQLSTATE-nya ada di
`error.cause.errno`**, bukan `error.code` — Drizzle membungkus galatnya dan
`PostgresError` bawaan Bun menaruh kodenya di `errno`.

**Pembaca terpusatnya sengaja tipis**: `OrganizationState` diekspor,
`OrganizationFilters.state` menyaring lewat kolom turunan (bukan menyusun ulang
`deleted_at`/`is_non_active`), dan `readOrganization` membawa keempat kolom jejak
plus `state`. **Nol asali dipasang** — invarian "tiap pembacaan menyaring
Terhapus, dan tidak menyaring Non-Aktif" tetap milik tiket 20, dan memasang
setengahnya di sini akan membuat tiket itu lebih sulit dibaca, bukan lebih mudah.

Tes: `tests/organization-state.test.ts`, 10 kasus — derivasi ketiga Keadaan,
dominasi Terhapus, pemulihan mengosongkan dua-duanya, `NOT NULL` di basis data,
kolom jejak, pembaca terpusat, dan `23503`.

**ADR 0004 ikut disunting.** Paragraf terakhirnya menyatakan cascade "tidak
berbahaya" dan dibiarkan terpasang — itu sekarang keliru dua kali: kalimatnya
usang, dan alasannya salah sejak awal (cascade justru yang membuat penghapusan
tak sengaja jadi kehilangan senyap). Paragrafnya dicoret dan diganti, dengan
kenaikan status dari konvensi jadi jaminan skema dinyatakan di ADR-nya sendiri,
bukan cuma di spec.

Satu keputusan kecil yang tidak diminta spec tapi harus diambil: **`deleted_by`
dan `non_active_by` NO ACTION, bukan `onDelete: 'set null'`**. Jejak yang bisa
dikosongkan diam-diam oleh penghapusan baris lain bukan jejak. Harganya, baris
`user` yang pernah bertindak atas sebuah Struktur tidak bisa di-hard-delete —
hari ini nol biaya (`deleteUser` nol call-site, `deleteMember` cuma menyapu Akun
Kader yang nol kewenangan atas Struktur), dan arahnya sejalan dengan ADR 0004.
Alasannya ditulis di skema, bukan cuma di sini.
