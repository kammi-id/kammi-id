# 29 — Tes seam dan transisi Keadaan

**Type:** implementation
**Status:** resolved
**Blocked by:** 18, 21, 22, 23, 24

Spec: [`../spec.md`](../spec.md) §9.3, §1.5, §2.2

## Pekerjaan

**Nol tes untuk seluruh permukaan ini hari ini.** Empat lapis, dan seam-nya sudah
ditentukan oleh keputusan-keputusan sebelumnya — tidak perlu dicari lagi.

| Lapis | Bentuk | Seam |
| --- | --- | --- |
| **Matriks** | tabel argumen-ke-hasil, **nol fixture** | `canManageKestrukturan` |
| **Gate async** | tes seam, pola `src/lib/auth/kekaderan.test.ts` | tiga gate di `kestrukturan.ts` + gate `pulihkan` |
| **Transisi Keadaan** | tabel spec §1.5 jadi daftar kasus | jalur aksi (nonaktifkan / aktifkan / hapus / pulihkan) |
| **Penurunan NIA** | unit, **dua salinan** | `resolveOrgCodes`, `generateRegisterNumber`, dan salinan di `bulk-upload/action.ts` |

### Lapis 1 — matriks sebagai tabel argumen ke hasil

`canManageKestrukturan` dibuat **murni justru supaya ini mungkin**: tabelnya dites
tanpa satu pun fixture, bukan sebagai delapan tes integrasi. Kalau tes lapis ini
butuh basis data, ada yang salah di tiket 18, bukan di sini.

Turunkan kasusnya dari matriks spec §2.2 **secara lengkap** — termasuk sel-sel yang
berbunyi "tidak". Sel kosong yang tidak pernah dites adalah sel kosong yang kembali.

Yang paling gampang salah dan **wajib punya kasusnya sendiri**:

- Root × `nonaktifkan` × PP → **tidak**
- BPW PP × `hapus` × PW → **boleh** (yang melindungi PW adalah prasyarat, bukan
  kewenangan)
- BPW PW × apa pun selain baca → **tidak**
- BPW PD/PDLN × `pulihkan` → **tidak**
- BPW PP × `pulihkan` → **boleh**
- BPW × Strukturnya sendiri → **tidak** (aturan "di bawah", bukan "di dalam")
- BPK, Humas, Akun Kader × seluruh baris → **tidak**

### Lapis 2 — gate async

Pola `src/lib/auth/kekaderan.test.ts` sudah terbukti jalan untuk permukaan ini.
`kestrukturan.test.ts` yang sudah ada (17 tes untuk dua gerbang sempit yang tiket 18
buang) **dirombak**, bukan ditambahi.

Gate `pulihkan` dapat perhatian ekstra: buktikan **BPW PD dan BPW PDLN ditolak**,
bukan cuma bahwa BPW PP lolos.

### Lapis 3 — transisi Keadaan

Tabel spec §1.5 jadi daftar kasus langsung, ditambah prasyaratnya:

- Aktif → Non-Aktif dengan anak Aktif → **ditolak**
- Aktif → Non-Aktif dengan anak Non-Aktif saja → **berhasil**
- PP → Non-Aktif → **ditolak, siapa pun pelakunya**
- Non-Aktif → Aktif dengan induk Non-Aktif → **ditolak**
- Non-Aktif → Terhapus → **berhasil**, `is_non_active` **tetap menyala**
- Terhapus → Aktif → mengosongkan **dua** kolom
- Hapus dengan anak Terhapus saja → **berhasil**
- Hapus dengan Artikel menggantung → **berhasil**
- Hapus dengan Member hidup → **ditolak, Root juga**

### Lapis 4 — NIA

**Dua salinan wajib dites terpisah dan dibuktikan sepakat** — `src/lib/utils/member.ts`
dan `bulk-upload/action.ts:110-145`. Ini satu-satunya yang menahan keduanya tidak
menjadi dua sistem penomoran.

Ditambah: PK menurunkan dari induk, cadangan ke kode sendiri saat kode induk tidak
terurai, dan PD/PDLN/PW tidak berubah perilakunya.

## Sebelum menjalankan tes

> **Tes lokal repo ini menghantam satu basis data remote bersama.** Itu sebab tes
> `access-control` pernah terlihat flaky — bukan sifat berkasnya. **Konfirmasi ke
> pengguna sebelum menjalankan `bun test`.**

Ganjalan CI (`postgres:16` vs `uuidv7()` yang butuh PG 18+) diselesaikan tiket 17.
Tanpa itu, lapis 3 tidak bisa hijau di CI.

## Selesai bila

- Keempat lapis ada
- Lapis 1 jalan tanpa basis data
- Kedua salinan NIA terbukti sepakat
- `bun test` hijau (setelah konfirmasi pengguna), `bun run check:types` hijau

## Answer

**Keempat lapis ada. Statusnya tetap `open` karena satu syarat "Selesai bila"
belum terpenuhi: `bun test` penuh belum dijalankan** — lihat di bawah.

### Yang sudah berdiri sebelum tiket ini dibuka

Lapis 1 (`canManageKestrukturan`), lapis 2 (tiga gate async), sebagian besar
lapis 3, dan seluruh lapis 4 sudah ditulis bersama tiket 18, 21, 22, 23, dan 24 —
tiap tiket membawa tesnya sendiri alih-alih menunda ke sini. Lapis 1 sudah
berbentuk tabel argumen-ke-hasil, nol fixture, dan ketujuh sel "wajib punya
kasusnya sendiri" sudah dinyatakan eksplisit.

Lapis 4 selesai dengan bentuk yang lebih baik daripada yang tiket ini minta:
tiket 24 **membubarkan salinan keduanya**, jadi alih-alih membuktikan dua salinan
sepakat, `member.test.ts` menjaga bahwa keduanya memang satu — "keeps the
per-Jenjang branch in exactly one file".

### Yang ditambahkan di sesi ini

- **`src/lib/struktur/kemampuan.test.ts`** — lapis 1 untuk bendera kemampuan
  tiket 26, tabel argumen-ke-hasil, nol fixture. Termasuk "bukan Strukturnya
  sendiri", Root yang dikecualikan darinya, dan BPD yang nol `pindah`.
- **`checkRestore` di `keadaan.test.ts`** — aturan murni pemulihan, termasuk
  bahwa induk Terhapus menang atas induk Non-Aktif saat dua-duanya terbaca
  (pesannya mengirim orang ke tempat yang berbeda, jadi urutannya bukan selera).
- **`branches/terhapus/.../action.test.ts`** — lapis 2 dan 3 untuk pemulihan:
  gate `pulihkan` menolak BPW PD, BPW PW, BPH, BPK, dan Humas; Terhapus → Aktif
  mengosongkan empat kolom jejak; pemulihan tidak berantai; tabrakan slug
  mendarat di `slugError`.
- **`organization/.../action.test.ts`** — `code`/`type`/`parentId` yang dikirim
  **diabaikan**, bukan dipercaya. Form yang tidak punya kotaknya tidak
  membuktikan apa pun tentang Server Action yang bisa dicapai tanpa form.
- **PDLN masuk pohon fixture `kestrukturan.test.ts`** — tesnya sudah bernama
  "menolak BPW PW, BPW PD, dan BPW PDLN" padahal nol PDLN ada di pohonnya.
  Namanya benar, buktinya yang belum ada.

### Yang belum: menjalankannya

Basis data tes (`db-test`, `localhost:5434` dari `docker-compose.yml`) mati di
sesi ini dan daemon Docker-nya tidak menjawab. Yang **terverifikasi hijau**
hanyalah berkas yang tidak menyentuh basis data: 100 tes di `src/lib/struktur/`,
`src/lib/utils/`, `src/lib/logger/`, dan `src/lib/shadcn/`. `check:types`,
`check:lint`, dan `check:structure` hijau.

**Langkah tersisa:** `docker compose up -d db-test`, lalu `bun test`. Tiga berkas
tes yang lahir di sesi ini belum pernah dijalankan sama sekali.

## Comments

**18 Agustus 2026 — dua tes murni ditambahkan setelah `/code-review`.**

- `slug-conflict.test.ts` — spec §4.3 mewajibkan penanganan `23505`, dan kedua
  cabang `catch`-nya hanya bisa dicapai lewat balapan sungguhan. Predikat yang
  keduanya bergantung padanya sekarang diuji langsung, termasuk kasus yang
  paling mahal kalau salah: `23505` dari indeks `code` **bukan** tabrakan slug,
  dan memperlakukannya begitu akan menaruh galat di field yang salah.
- `pindah-induk.test.ts` — premis pintasan massal dinyatakan sebagai tes:
  berlaku untuk PD, **tidak** untuk PW maupun PDLN. Itu bug yang review temukan,
  dan sekarang ia punya penjaga di lapis murni.

Sisanya tidak berubah: berkas tes ber-basis-data di sesi ini masih belum pernah
dijalankan.

**18 Agustus 2026 (kedua) — dijalankan penuh, tiket ditutup.**

`docker compose up -d db-test` (sudah hidup), migrasi disemai lewat
`DATABASE_URL=<TEST_DATABASE_URL> bun run db:migrate` (bersih, 10 migrasi),
lalu `bun test --preload ./tests/setup.ts` dengan `TEST_DATABASE_URL` diset:
**561 lewat, 0 gagal**, 919 `expect()` di 50 berkas. Tiga berkas tes yang
lahir sesi lalu (lapis 1 kemampuan, `checkRestore`, pemulihan Terhapus) lolos
bersama sisanya, tanpa perubahan kode produksi. `check:types` dan
`check:structure` bersih; `check:lint` 0 error (118 warning, semuanya
pra-eksisting dan di luar cakupan tiket ini).

Keempat "Selesai bila" sekarang terpenuhi. Tiket ditutup.
