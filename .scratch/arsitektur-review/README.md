# Review arsitektur — 3 Agustus 2026

Dijalankan lewat `/improve-codebase-architecture` pada commit `b7b978c`.
Laporan visualnya ada di `architecture-review-2026-08-03.html` (buka di
peramban — ada diagram Mermaid). Berkas ini indeks teksnya, supaya sesi
berikutnya bisa membacanya tanpa merender HTML.

Kosakata arsitektur di bawah mengikuti `/codebase-design`: **module**,
**interface**, **seam**, **depth**, **leverage**, **locality**. Kosakata domain
mengikuti `CONTEXT.md`.

## Cakupan survei

Titik panas dari 60 commit terakhir: berkas `action.ts` di bawah `trainings`,
`articles`, `kader`, `pages`, ditambah `src/db/query/`.

## Tiga celah nyata yang tersingkap

Bukan kandidat arsitektur — cacat yang perlu tiket sendiri. Sudah ditulis di
`.scratch/celah-kewenangan/`.

| # | Celah | Tiket | Status |
| - | ----- | ----- | ------ |
| 1 | `searchTrainingAttendantsAction` / `searchTrainingInstructorsAction` tanpa gate | `celah-kewenangan/01` | ✅ selesai (`8d7ab19`) |
| 2 | Cakupan dilewati di daftar Kader & Perangkat (slug URL + `if (user)` yang di-skip) | `celah-kewenangan/02` | ✅ selesai |
| 3 | `removeAttendantAction` menembus Masa Penetapan Kelulusan | `celah-kewenangan/03` | ✅ selesai (`d8265a7`) |
| 4 | `searchMasterCandidatesAction` tanpa sesi (terlewat dari survei awal) | `celah-kewenangan/04` | ✅ selesai (`6ba13be`) |
| 5 | Struktur dari slug tanpa Cakupan (sisa tiket 02) | `celah-kewenangan/05` | ✅ selesai (`78bd068`) |

**Keempat celah sudah tertutup per 6 Agustus 2026.** Kandidat deepening di bawah
belum — nomor 1 selesai, sisanya masih berdiri.

## Tujuh kandidat deepening

### 1. Masa Penetapan Kelulusan — ✅ SELESAI (`efa8262`)

Aritmetika jendela ditulis ulang di tiga tempat. Sekarang jadi satu module
murni di `src/lib/daurah/masa-penetapan-kelulusan.ts`.

### 2. Kewenangan tanpa seam — **Strong, terbuka**

~40 perbandingan literal peran; lima bentuk balikan guard yang berbeda
(`string | null`, `boolean`, `{orgId} | null`, JSX, inline); 14 pasang
page↔action yang menyatakan aturan sama dua kali, sebagian sudah hanyut
(`trainings/page.tsx:88` memperbolehkan BPH, aksinya tidak;
`reset-password` sebaliknya).

Bentuk yang dituju: gate dinamai menurut **privilege** yang diberikan,
mengembalikan Akun yang sudah dipersempit — persis bentuk
`requireSiteSettingsAccess` di `src/lib/auth/site-settings.ts`, yang sudah
disebut AGENTS.md sebagai acuan. Page dan action memanggil gate yang sama.

Catatan: `UserRole` di `src/lib/access-control.ts` mengeja Akun Kader sebagai
`'member'` — nama yang `CONTEXT.md:107` minta dihindari. `isHumas` di berkas
itu tidak punya pemanggil sama sekali.

### 3. Cakupan sebagai parameter opsional — **Strong, terbuka**

`fetchAllowedOrgIds` (`db/query/organization.ts:22`) dipanggil dengan tiga
bentuk `user` yang berbeda-beda, dan `readDescendantMembers`
(`db/query/member.ts:435`) menegakkannya di dalam `if (user)` — sehingga
pemanggil yang tidak menyertakannya lolos diam-diam. Itulah akar celah #2.

`isOrgInScope` (`organization.ts:316`) juga mencampur Cakupan dengan "peran
harus BPK". Aturan Humas ADR-0002 punya dua penulisan bebas:
`organization.ts:50` dan `db/query/article.ts:9`. Penelusuran pohon Struktur
bahkan ditulis ulang di peramban: `kader/_components/add-form/utils.ts:51`.

Bentuk yang dituju: module Cakupan yang menerima Akun dan mengembalikan nilai
Cakupan yang **wajib** diserahkan ke fungsi baca. Melewatkannya jadi galat
tipe, bukan pintu terbuka.

Tidak melanggar ADR-0002 — pengecualian Humas tetap seperti yang diputuskan,
hanya diberi satu rumah alih-alih dua.

### 4. Keadaan Kader — **Strong, terbuka**

ADR-0001 menyatakan Aktif/Sanksi/Non-Aktif/Alumni saling meniadakan. Aturannya
hanya hidup di React state satu komponen
(`profile-sidebar.tsx:107-121`), dan `kader/_components/add-form/status-section.tsx:90-143`
sudah melanggarnya dengan tiga Switch yang tidak saling mengunci. Tangga
turunannya disalin empat kali (satu di antaranya tidak konsisten:
`profile-sidebar.tsx:291` merender dua lencana untuk Alumni+Sanksi). Delapan
penulisan SQL terpisah.

Bentuk yang dituju: module Keadaan — satu tipe, satu parse dari tiga kolom,
satu serialisasi balik, satu filter SQL. Skema **tidak** berubah, jadi tidak
ada migrasi dan keputusan production di ADR-0001 tetap utuh. Ini justru
konsekuensi yang ADR-0001 sendiri tuliskan.

### 5. Nomor Induk Anggota — **Worth exploring, terbuka**

Tiga implementasi: `src/lib/utils/member.ts:44`,
`kader/_components/bulk-upload/action.ts:126` (sadar-transaksi), dan
`src/scripts/seed-members.ts:111` (regex yang sudah menyimpang). Tidak satu pun
diuji langsung. Tidak ada UNIQUE constraint pada `register_number`, sehingga
tabrakan tersimpan diam-diam. `padStart(3,'0')` juga merusak urutan
leksikografis lewat 999.

Catatan: menambah UNIQUE constraint adalah keputusan terpisah dan butuh
migrasi — periksa duplikat yang sudah ada lebih dulu.

### 6. Envelope Server Action — **Worth exploring, terbuka**

22 berkas `action.ts`, 57 aksi, **17 tipe balikan berbeda**. 43 badan
`try//catch`. Ekspresi proyeksi ulang `values` disalin verbatim 11 kali.
Deteksi galat unik lewat `error.message.includes('unique constraint')` di tiga
tempat; 14 aksi tanpa `catch` sama sekali; satu berkas memakai `any`.

Paling berisiko salah bentuk dari semua kandidat — envelope yang buruk adalah
module dangkal yang setiap aksi terpaksa pelajari. Layak lewat
`design-it-twice` sebelum dipilih.

### 7. Kelulusan tidak melakukan apa pun — **Speculative, butuh keputusan produk**

`CONTEXT.md:163-165` menyatakan Kelulusan-lah yang menaikkan Jenjang Kekaderan
dan memberi sertifikasi Perangkat. Di kode, `updateAttendantStatus`
(`db/query/training.ts:411`) hanya menulis satu boolean pada baris join.
`member.status`, `isCertifiedMentor`, dan `isCertifiedInstructor` seluruhnya
disetel dengan tangan lewat tiga permukaan UI masing-masing.

Terkait: `profile-header.tsx:60` dan `profile-sidebar.tsx:100` memeriksa
kehadiran Daurah di riwayat **tanpa melihat `isPassing`** — DPMK yang diikuti
tapi tidak lulus tetap menghapus peringatan Sertifikasi Tanpa Riwayat.

Bukan panggilan arsitektur, melainkan keputusan produk. Dicatat karena pembaca
`CONTEXT.md` berikutnya akan mengira sisi itu sudah ada di kode.

## Urutan yang disarankan

Kandidat 1 dikerjakan lebih dulu sebagai penetap pola — instans terkecil dari
bentuk yang kandidat 2, 3, dan 4 ulang di skala lebih besar, dan satu-satunya
yang sudah punya jaring tes rapat.

Berikutnya kandidat 3 (Cakupan), karena di situ letak eksposur nyatanya. Tapi
kerjakan tiket `celah-kewenangan/02` lebih dulu sebagai perbaikan sempit —
lubang production tidak menunggu refactor.

Kandidat besar mana pun sebaiknya masuk lewat `/grill-with-docs`, bukan
langsung `/implement`.
