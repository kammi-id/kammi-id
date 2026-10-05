# 14 — Pra-terbang duplikat `code`/`slug`

**Type:** implementation
**Status:** resolved
**Blocked by:** —

Spec: [`../spec.md`](../spec.md) §4.5, §4.6

## Pekerjaan

Pindahkan `.scratch/manajemen-struktur/check-duplicates.ts` ke **`src/scripts/`**,
bersebelahan dengan `db-guard.ts`, `reset.ts`, dan `seed.ts`. Tambahkan skrip
`package.json`-nya sendiri (mis. `check:duplicates`).

Skripnya **sudah ditulis dan sudah benar** — ia murni `SELECT`, lewat
`requireDatabaseConsent` yang sama dengan `db:migrate` (bukan pintu belakang), dan
sudah mengorientasi diri lebih dulu (versi server, `search_path`, skema mana yang
memuat `organization`) sehingga basis data kosong dijawab dengan kalimat, bukan
galat mentah. Ia juga sudah memisahkan Member hidup dari Member yang dihapus lunak.

Yang dikerjakan tiket ini adalah **memindahkannya dan memberinya rumah permanen**,
bukan menulis ulang. Ia **artefak, bukan buangan** — instruksi lama "buang skripnya
setelah tiket 04 ditutup" sudah dicabut.

### Dokumentasikan pohon keputusannya di tempat yang akan dibaca

Pohon keputusan spec §4.6 harus ikut terbaca oleh orang yang menjalankan
migrasinya — di komentar kepala skrip, atau di keluarannya sendiri:

| Temuan | Putusan |
| --- | --- |
| nol duplikat | jalan; kedua migrasi constraint berangkat |
| `slug` duplikat saja | perbaiki mekanis (ganti nama yang kalah), lalu jalan |
| `code` duplikat | **berhenti.** Kirim migrasi `slug` saja; `code` menunggu putusan manusia |
| `code_slug` duplikat | abaikan — ia tidak dipasangi constraint |

**`code` duplikat tidak bisa diperbaiki secara mekanis, titik.** ADR 0004 mengunci
`code` selamanya, jadi menggantinya untuk memuaskan constraint justru melanggar ADR
yang melahirkan constraint itu. Ia insiden data yang menuntut putusan manusia.

## Jangan

**Jangan jalankan skripnya terhadap produksi.** Akses produksi ditolak sadar oleh
pengguna (7 Agustus 2026) dan itu batasan tetap. Skrip ini dijalankan oleh **orang
yang men-deploy migrasinya, sesaat sebelum migrasi** — bukan oleh agen, dan bukan
saat perencanaan.

`DATABASE_URL` yang bukan localhost menunjuk basis data nyata. Tanya dulu.

## Selesai bila

- `bun run check:duplicates` jalan dan mengorientasi diri di basis data staging
- Pohon keputusannya terbaca tanpa membuka spec
- `bun run check:structure` dan `check:types` hijau

## Answer

Skripnya pindah ke `src/scripts/check-duplicates.ts` lewat `git mv` (riwayat
terbawa), dengan `bun run check:duplicates` di `package.json`. Isinya **tidak
ditulis ulang** — yang berubah cuma jalur impor (`~/lib/db-guard/consent`,
menyamai tetangganya `db-guard.ts`), komentar kepala, dan pencetakan pohon
keputusan.

Pohon keputusan §4.6 sekarang terbaca **dua kali**: di komentar kepala dan di
keluaran skrip sendiri, diikuti putusan turunan untuk basis data yang barusan
dibaca. Yang menjalankan migrasi tidak perlu membuka spec.

Diverifikasi terhadap basis data tes lokal saja — ia mengorientasi diri (nama basis
data, `search_path`, skema pemilik `organization`, versi server) dan menjawab basis
data hampir kosong dengan kalimat, bukan galat mentah. **Produksi tidak disentuh**,
sesuai batasan tetap 7 Agustus 2026.
