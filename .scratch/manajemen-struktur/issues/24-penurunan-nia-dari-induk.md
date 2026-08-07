# 24 — Penurunan NIA dari induk untuk PK

**Type:** implementation
**Status:** open
**Blocked by:** —

Spec: [`../spec.md`](../spec.md) §6.5, §6.6

## Pekerjaan

> **WAJIB MENYENTUH DUA TEMPAT.** Logika ini punya **dua salinan**:
> `src/lib/utils/member.ts` dan salinan tx-aware di
> `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts:110-145`.
> Yang menyentuh satu saja **melahirkan dua sistem penomoran yang berbeda.**
> Ini bukan peringatan hipotetis — salinan kedua itu memang sudah ada di repo hari
> ini, ditulis ulang alih-alih memanggil `generateRegisterNumber`.

### Invarian tersembunyi yang jadi sebab tiket ini

NIA berbentuk 11 karakter: `[PW 2][PD 2][tahun 4][urut 3]` → `19012024001`.

`resolveOrgCodes` (`src/lib/utils/member.ts:15-42`) mengurai `code` dengan regex,
bercabang per Jenjang:

| Jenjang | Yang diurai | Hasil |
| --- | --- | --- |
| `pw` | `PW\s*(\d+)` dari kodenya sendiri | PW dari kode, **PD = `00`** |
| `pdln` | `-\s*(\d+)` dari kodenya sendiri | **PW = `99`**, PD dari kode |
| `pd` | `(\d+)\s*\.?\s*PD[\s.-]*(\d+)` | PW dan PD dari kodenya sendiri |
| `pk` | **pola yang sama persis dengan `pd`** | PW dan PD **dari kode PK** |

Baris terakhir itu intinya: **ada invarian yang tidak pernah ditulis di mana pun —
kode sebuah PK wajib memuat kode PD induknya.** Komentar di kodenya sendiri
membocorkannya (`'1.PD-1.USK'`). Karena `code` beku selamanya (ADR 0004),
memindahkan sebuah PK memecahkan invarian itu **secara permanen** — kalau NIA tetap
diturunkan dari kode PK sendiri.

**Komisariat tidak muncul di NIA sama sekali.** Dua PK di bawah PD yang sama berbagi
satu kolam nomor.

### Perubahannya

NIA menamai level **PW/PD**, jadi aturannya tidak seragam:

- **PK** → yang menamai adalah **induknya**. Turunkan dari **induk**.
- **PD, PDLN, PW** → merekalah yang dinamai. Turunkan dari **kodenya sendiri**.
  **Jangan disentuh** — menurunkan PD dari induknya justru membuat nomor PD-nya jadi
  `00`.

Urutannya **dibalik, cadangannya dipertahankan** — khusus PK:

```
coba kode induk  →  gagal, mundur ke kode PK sendiri  →  gagal, throw (seperti sekarang)
```

**Kenapa bukan "gagal keras":** ini jalur yang dilewati **tiap Kader baru di
produksi**, dan **nol pendaftaran yang hari ini berhasil boleh jadi gagal**. Yang
berubah cuma siapa yang ditanya lebih dulu — dan hari ini kedua arah memberi jawaban
identik, karena kode PK memang memuat kode PD-nya. Bedanya baru muncul setelah
pindah, dan di situ arah induk yang benar.

Kasus terdegradasi yang **diterima sadar**: PK yang sudah pindah tapi kode induk
barunya tidak terurai akan mundur ke kodenya sendiri dan salah lagi.

### Dua fakta yang perlu diketahui saat menulis tesnya

- **Penjaga keunikan NIA bukan tabel `member`.** `member.registerNumber` **tidak
  punya unique constraint sama sekali**; yang menjaga adalah `user.name` yang
  `.unique()` (`src/db/schema/user.sql.ts:9`), diisi NIA saat Akun Kader dibuat. Ia
  bekerja hanya karena tiap Member selalu dibuatkan Akun.
- **Nol tes** untuk seluruh mekanisme ini hari ini. Tiket ini menulis yang pertama;
  lapis lengkapnya di tiket 29.

### Yang TIDAK dikerjakan di sini

**Tembok 1000** — nomor urut `padStart(3)` sementara urutannya dicari
`orderBy(desc())` pada kolom **teks**, jadi begitu tembus `1000` teks `'999'` masih
menang dan `nextSeq` mengulang selamanya. Bug nyata di produksi, tapi soal
**kekaderan**, bukan CRUD Struktur. Ada di Out of scope spec §10. **Jangan
diselundupkan ke sini** — ia menuntut putusan sendiri soal Kader yang sudah bernomor.

## Selesai bila

- Kedua salinan berubah, dan tesnya membuktikan keduanya sepakat
- PK menurunkan `pwCode`/`pdCode` dari **induknya**, dengan cadangan ke kode sendiri
- PD/PDLN/PW tidak berubah perilakunya sama sekali
- Nol pendaftaran yang hari ini berhasil jadi gagal
