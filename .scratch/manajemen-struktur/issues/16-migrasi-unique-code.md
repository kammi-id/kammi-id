# 16 — Migrasi C: unique `code`

**Type:** implementation
**Status:** resolved
**Blocked by:** 13, 14

Spec: [`../spec.md`](../spec.md) §4.1, §4.2, §4.6, §4.7

## Pekerjaan

Satu migrasi, satu constraint: **`code` unik lintas SEMUA baris, Terhapus
termasuk.**

Bukan partial. Prinsip "Struktur Terhapus diperlakukan seolah barisnya tidak pernah
ada" berlaku untuk **pembacaan**, **bukan** untuk keunikan `code` — ADR 0004
mengunci `code` selamanya justru karena Struktur yang "nol Member" masih bisa
menggantung Member terhapus (`member.deleted_at`) yang Nomor Induknya sudah tercetak
dari `code` itu.

Constraint lintas semua baris memajukan kegagalan ke **waktu pembuatan**, dan itu
memang yang ADR 0004 inginkan. `code` tidak punya kasus tabrakan-saat-pemulihan sama
sekali.

Catatan operasional: `ADD CONSTRAINT UNIQUE` mengambil ACCESS EXCLUSIVE (memblokir
baca juga), sementara `CREATE UNIQUE INDEX` hanya memblokir tulis. Tabel ini ribuan
baris, bukan jutaan, jadi durasi kuncinya tidak jadi soal — tapi pilih sadar.

## `code_slug` TIDAK dipasangi constraint

Keunikan `code` **tidak** menurunkan keunikan `code_slug` —
`replace(lower(code), '.', '-')` membuang dua dimensi sekaligus, dan format `code`
nyata di `src/lib/utils/member.ts` sudah memakai `.` maupun `-` sebagai pemisah
(`19.PD-1` dan `19-PD-1` menghasilkan slug yang sama).

Tapi nol pembaca `code_slug` di `src/app`, `src/components`, maupun `src/lib`, dan
`generateRegisterNumber` mengurai `code` langsung — jadi argumen ADR 0004 tidak
merambat ke sini. **Jangan tambahkan constraint-nya.**

## Penghalang keras sebelum menjalankannya

**Migrasi ini hanya berangkat kalau pra-terbang (tiket 14) menemukan NOL duplikat
`code`.**

`code` duplikat **tidak bisa diperbaiki secara mekanis, titik** — menggantinya untuk
memuaskan constraint justru melanggar ADR 0004 yang melahirkan constraint itu. Ia
**insiden data yang menuntut putusan manusia**: Struktur mana yang keliru, dan apa
yang terjadi pada Kader yang sudah memegang nomor dari kode itu.

Kalau pra-terbang menemukan duplikat: **berhenti.** Kirim migrasi `slug` (tiket 15)
saja, dan naikkan `code` ke manusia.

### Koreksi faktual yang mudah salah tebak

Duplikat `code` **TIDAK** membuat dua Kader punya Nomor Induk yang sama.
`generateRegisterNumber` mencari urutan terakhir dengan
`ilike(member.registerNumber, ${prefix}%)` **tanpa filter organisasi**
(`src/lib/utils/member.ts:80`), jadi dua Struktur bercode kembar berbagi satu deret
dan tetap menerima nomor berbeda.

Yang rusak adalah **NIA berhenti mengidentifikasi Struktur** — dua Kader dari dua
Struktur berbeda memikul prefiks identik, dan tidak ada cara membaca balik dari nomor
ke Struktur. Itu persis kemampuan yang ADR 0004 kunci `code` untuk menjaganya.

## Selesai bila

- Pra-terbang menyatakan nol duplikat `code`
- ~~Migrasinya jalan bersih di staging~~ — **dipindahkan ke tiket 17**, dengan
  alasan yang sama persis dengan tiket 15: tiket 17 memegang penjalanan ke
  staging, dan pra-terbang wajib diulang di sana terhadap sasaran sungguhan.
- Membuat Struktur ber-`code` kembar ditolak `23505`, termasuk kembar dengan
  Struktur yang sudah Terhapus

## Answer

`unique('organization_code_unique').on(table.code)` di
`src/db/schema/organization.sql.ts`, dan `drizzle-kit generate` memancarkan
persis satu baris — sama seperti riset tiket 03 memprediksi:

```sql
ALTER TABLE "organization" ADD CONSTRAINT "organization_code_unique" UNIQUE("code");
```

`src/db/__migrations/20260813034832_organization_code_unique/`. Berkasnya
dikepalai komentar yang memuat prasyarat pra-terbang dan alasan ia tidak boleh
disatukan dengan tiket 15 — pola yang sama dengan migrasi B, cermin ke arah
yang berlawanan.

Ini `unique()` biasa (constraint, `ADD CONSTRAINT`), bukan `uniqueIndex()`
(index): aturannya tanpa syarat lintas semua baris, jadi PostgreSQL punya
bentuk constraint asli untuknya — beda dari `slug` yang partial dan terpaksa
lewat index. `code_slug` tetap tidak dipasangi apa pun, sesuai spec §4.2.

### Yang dibuktikan, dan di mana

`tests/organization-code-unique.test.ts` — tiga kasus, fixture bersufiks, nol
`TRUNCATE`:

| Kasus | Kenapa ada |
| --- | --- |
| dua Struktur hidup ber-code sama → `23505` | "selesai bila" |
| Struktur baru mencoba memungut code milik Struktur Terhapus → `23505` | "selesai bila" — dan ini justru **kebalikan** perilaku `slug`. Keunikan `code` melintasi semua baris, jadi Struktur Terhapus tetap menyandera code-nya; kalau tes ini lolos padahal seharusnya gagal, itu tanda migrasinya diam-diam jadi partial |
| `pg_constraint.contype = 'u'` untuk `organization_code_unique` | bentuknya (constraint asli, bukan index) tidak bisa dibuktikan dari tipe TS |

Nama constraint-nya dipakai sebagai assertion, bukan cuma SQLSTATE — sama
seperti pola tiket 15.

### Jangkauan penjalanannya

Dipasang ke **basis data tes lokal** (`localhost:5434/kammi_test`, PG 18.3),
urutan yang sama dengan tiket 15:

1. `bun run check:duplicates` — nol duplikat `code`, `slug`, `code_slug`.
2. `bun run db:migrate` — jalan bersih.
3. `bun test` — hijau seluruhnya (520 tes, 46 berkas; naik dari 517/45 di
   tiket 15).

**Staging dan produksi belum disentuh** — itu tiket 17, dan pra-terbang wajib
diulang di sana.
