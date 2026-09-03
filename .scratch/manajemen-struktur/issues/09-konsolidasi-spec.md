# 09 — Konsolidasi jadi spec siap-serah

**Type:** task
**Status:** resolved
**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 10, 11, 12

## Question

Menyatukan seluruh jawaban tiket jadi satu `.scratch/manajemen-struktur/spec.md`
yang bisa dipecah jadi tiket implementasi tanpa perlu membaca peta ini lagi.

Isinya minimal:

- Model keadaan Struktur dan istilah kanoniknya (dari 01)
- Matriks kewenangan lengkap, dalam bentuk yang bisa langsung jadi daftar
  kasus tes (dari 02). **Rakit versi yang sudah diamandemen tiket 12**, bukan
  versi asli: BPW PP × `pulihkan` bukan lagi `—`, dan gate `pulihkan` bukan lagi
  `role === 'root'` saja. Gate-nya **bukan** `role === 'bpw'` — yang lolos hanya
  BPW yang Struktur terhubungnya **PP**.
- **Prasyarat penghapusan berbunyi lengkap** (dari 12): "nol anak, nol Member,
  nol Daurah", dengan **anak Non-Aktif menghitung** (tiket 06) dan **anak
  Terhapus tidak menghitung** (tiket 12). Tulis dua klausa itu apa adanya —
  keduanya diputus di tiket berbeda dan gampang hilang saat dirakit.
- Bentuk skema: kolom baru, constraint, dan urutan migrasi yang aman untuk
  basis data produksi (dari 01, 03, 04, 05). **Entri kabut "Migrasi produksi"
  sudah lulus ke sini** — isinya tidak lagi kabur, tinggal dirakit. Yang sudah
  tetap dan tidak boleh dilanggar saat merakitnya:
  - `is_non_active` **tidak disentuh**; `deleted_at` ditambahkan (tiket 01).
  - Keadaan Struktur itu kolom `generatedAlwaysAs` — **tanpa backfill**, tapi
    `drizzle-kit` membuang `NOT NULL` dari kolom generated yang ditambah lewat
    `ALTER TABLE`, jadi `SET NOT NULL` harus ditulis tangan (tiket 03).
  - **Tidak ada `CONCURRENTLY`** — runner Drizzle membungkus seluruh migrasi
    dalam satu transaksi, dan `CREATE INDEX CONCURRENTLY` di dalamnya
    me-rollback semuanya (tiket 03).
  - `code` unik lintas semua baris; `slug` partial unique
    `WHERE deleted_at IS NULL`; `code_slug` **tanpa** constraint (tiket 03).
  - **Nol kolom baru di `user`** — Keadaan Akun turunan, bukan tersimpan
    (tiket 05).
  - ~~**Tiket 04 penghalang keras**: migrasi constraint tidak boleh ditulis
    sebelum data duplikat diperiksa.~~ **Diamandemen oleh tiket 04.** Akses
    produksi tidak pernah diberikan, jadi pemeriksaannya pindah dari momen
    perencanaan ke **momen migrasi**. Migrasinya boleh ditulis sekarang; yang
    haram adalah menjalankannya tanpa pra-terbang. Spec wajib membawa tiga hal
    dari 04: (a) **dua migrasi terpisah** — `slug` dan `code` tidak boleh
    disatukan, sebab `code` duplikat menuntut putusan manusia sementara `slug`
    duplikat perbaikannya mekanis; (b) **pra-terbang wajib** —
    `check-duplicates.ts` dipindahkan ke `src/scripts/` dengan skrip
    `package.json`-nya sendiri; (c) **pohon keputusan** per hasil pra-terbang,
    disalin apa adanya dari jawaban 04.
- Aturan sinkronisasi keadaan Akun dan bagaimana drift-nya ketahuan (dari 05)
- Aturan pemindahan induk sebagai **aksi berdiri sendiri** — hanya BPW PP dan
  Root, nol sel baru di matriks (dari 06). Termasuk aturan cermin: menghidupkan
  anak menuntut induknya hidup lebih dulu. **Batas calon induknya ditulis dalam
  rumusan tiket 11, bukan rumusan asli tiket 06**: calon sah bila **`pwCode`
  hasil penurunan NIA tidak berubah** — bukan "dalam PW yang sama", yang tidak
  terdefinisi untuk PK di bawah PDLN dan meloloskan penyeberangan PDLN → PW.
- **Perubahan penurunan NIA** (dari 06): untuk PK, coba kode induk dulu lalu
  mundur ke kode sendiri. **Wajib menyentuh dua tempat** — `lib/utils/member.ts`
  dan salinannya di `kader/_components/bulk-upload/action.ts:110-145`. Yang
  menyentuh satu saja melahirkan dua sistem penomoran.
- Empat permukaan beserta keputusan desainnya (dari 07, 08, 11, 12)
- **Invarian lapisan baca** (dari 10, menggantikan rumusan sempit tiket 08).
  Tiap pembacaan atas **ketujuh** referensi ke `organization` menyaring Struktur
  **Terhapus** dan **tidak** menyaring **Non-Aktif** — asimetri itu wajib
  dipertahankan, sebab keputusan penelusuran tiket 08 bergantung padanya.
  `user.connected_organization_id` **dikecualikan**: gerbangnya sudah di sesi
  (tiket 05), jangan tambah yang kedua. Kasus konkret yang sudah ketahuan bocor:
  **`readMemberAggregates`** (`member.ts:145-147`) memancarkan satu baris per
  organisasi di subtree, jadi Struktur Terhapus muncul sebagai entri berhitungan
  nol. `readDescendantMembers` **tidak** bocor (`m.deleted_at IS NULL` +
  prasyarat nol Member hidup) — jangan tambal di sana.
- **Cascade dicabut, `deleteOrganization` dihapus** (dari 10). Keempat
  `onDelete: 'cascade'` ke `organization` (`article`, `article_category`,
  `site_settings`, `user`) dicabut, dan fungsi `deleteOrganization`
  (`organization.ts:325`) dihapus. Setelah ini `DELETE FROM organization` gagal
  dengan `23503` alih-alih berhasil senyap sambil membawa Akun — **ADR 0004 jadi
  dijamin skema, bukan dijaga ingatan.** Ikut rombongan migrasi yang sama.
- **Publikasi bukan prasyarat penghapusan** (dari 10). Artikel, Kategori, dan
  Pengaturan Situs boleh menggantung; yang menahan penghapusan tetap tiga —
  anak, Member, Daurah.
- Nasib publikasi milik Struktur Terhapus dan Non-Aktif (dari 10)

Lalu pecah jadi tiket implementasi di `.scratch/manajemen-struktur/issues/`,
melanjutkan penomoran. ~~Urutkan supaya **penambalan celah Cakupan di
`add-form/action.ts` jadi yang pertama**~~ — **sudah ditambal di luar peta**
(commit `a9c535b`), jadi ia tidak perlu tiket sendiri lagi.

Yang menggantikannya sebagai catatan urutan: tambalan itu **sengaja sempit**
(Cakupan, Jenjang, pembekuan `type`/`parentId`) dan meninggalkan dua gerbang
sempit di `src/lib/auth/kestrukturan.ts`. Tiket implementasi matriks tiket 02
harus **menggantikan** keduanya dengan `canManageKestrukturan` beserta dua gate
async-nya — bukan menambahkan lapis ketiga di sebelahnya. Tes
`kestrukturan.test.ts` yang sudah ada ikut dirombak bersamanya, dan ia sekaligus
memberi jawaban pertama untuk kabut **bentuk tes**: pola seam
`kekaderan.test.ts` terbukti jalan untuk permukaan ini.

Sesi ini **tidak menulis kode aplikasi**. Kalau muncul dorongan untuk mulai
membangun, itu tandanya peta sudah selesai dan pekerjaannya berpindah tangan.

Sebelum menutup: periksa **Not yet specified** di `map.md`. Kabut yang masih
tersisa di sana saat tiket ini dikerjakan harus salah satu dari tiga —
sudah terjawab diam-diam oleh tiket lain (pindahkan ke spec), masih kabur
(katakan terang di spec bahwa implementasi akan menabraknya), atau ternyata di
luar cakupan (pindahkan ke **Out of scope**). Jangan tinggalkan menggantung.

## Answer

Spec-nya ada di **[`../spec.md`](../spec.md)** — 11 bagian, siap-serah, berdiri
sendiri. Tiket implementasinya **13–29**, 17 berkas, di folder yang sama.

Sesi ini nol kode aplikasi, sesuai instruksi.

### Sebelas titipan badan tiket — semuanya mendarat

| Titipan | Di spec |
| --- | --- |
| Model Keadaan + istilah kanonik | §1 |
| Matriks **versi teramandemen tiket 12** | §2.2, dengan gate `pulihkan` di §2.5 |
| Prasyarat berbunyi lengkap, dua klausa anak | §3 |
| Skema, constraint, urutan migrasi | §4 |
| Tiga hal dari tiket 04 (dua migrasi, pra-terbang, pohon keputusan) | §4.5–§4.7 |
| Sinkronisasi keadaan Akun | §5 |
| Pemindahan induk, **rumusan `pwCode`** bukan "PW yang sama" | §6.1–§6.4 |
| Perubahan NIA, **dua tempat** | §6.6 |
| Empat permukaan | §8 |
| Invarian lapisan baca, tujuh referensi | §7 |
| Cascade dicabut, `deleteOrganization` dihapus | §4.4 |
| Publikasi bukan prasyarat | §3 |

### Tiga hal yang berubah saat dirakit

Konsolidasi bukan penyalinan. Tiga hal baru muncul justru karena semuanya
diletakkan berdampingan:

1. **Tiga momen tabrakan `23505` ternyata satu tabel, bukan tiga catatan
   tersebar.** Tiket 03 memetakan dua, tiket 07 menemukan yang ketiga, tiket 12
   memutuskan dua di antaranya memakai pola pesan yang sama. Dirakit jadi §4.3, dan
   di situ terlihat bahwa **momen pertama (Struktur baru memungut slug Terhapus)
   memang sengaja tidak gagal** — hal yang mudah dibaca sebagai bug oleh yang
   membangun.

2. **`isLegalChildType` nyaris ikut terbuang.** Tiket 02 menyuruh
   `canManageKestrukturan` **menggantikan** dua gerbang sempit di
   `src/lib/auth/kestrukturan.ts`. Diperiksa isinya, dan berkas itu memuat **tiga**
   hal, bukan dua: `isLegalChildType` menjaga **bentuk pohon**, bukan kewenangan —
   pertanyaan yang berbeda, dan tidak ada satu pun tiket yang menggantikannya.
   Dinyatakan terang di §2.6 dan diulang di tiket 18.

3. **`parentId` punya dua status yang bertentangan sampai dirakit.** Tiket 02
   membekukannya "untuk semua Kewenangan termasuk Root"; tiket 06 lalu mencabut
   Out-of-scope pindah-induk dan membuat aksi yang mengubah kolom itu. Keduanya
   benar, tapi berdampingan mereka terbaca bertabrakan. §2.4 memakai catatan kaki:
   beku di **form Sunting**, berubah **hanya lewat aksi Pindah Induk**.

### Kabut dibereskan — Not yet specified sekarang kosong

Dua-duanya lulus, tidak ada yang digantung:

- **Bentuk tesnya** → sekarang bisa dinyatakan penuh, sebab 05/06/08 sudah memberi
  tahu berapa permukaan yang sebenarnya ada. Empat lapis beserta seam-nya di spec
  §9.3, jadi **tiket 29**. Ganjalan CI `postgres:16` ikut lulus jadi **tiket 17** —
  ia soal CI-nya, bukan soal migrasinya, dan tiket 04 sudah membuktikan itu.
- **Gladi bersih migrasi** → tiket ini menetapkan migrasi apa saja yang dipecah
  (§4.7: tiga rombongan), yang persis fakta yang dulu menahannya jadi tiket. Ikut
  **tiket 17**.

**Nol butir ditambahkan ke Out of scope.** Tidak ada kabut yang ternyata di luar
cakupan.

### Bentuk tiket implementasinya

Lima rombongan, 17 tiket. Urutan yang tidak boleh dibalik ada di spec §11.

Empat keputusan pemecahan yang perlu dicatat sebabnya:

- **Migrasi dipecah tiga, bukan satu** — B dan C terpisah karena tiket 04
  mensyaratkannya (satu `code` duplikat tidak boleh menyandera constraint `slug`),
  dan A terpisah karena ia **boleh berangkat tanpa menunggu pra-terbang sama
  sekali**.
- **Tiket 24 (NIA) memblokir tiket 23 (pindah induk)**, bukan sebaliknya. Penurunan
  NIA harus sudah benar sebelum pemindahan mungkin dilakukan — kalau dibalik, ada
  jendela di mana PK yang dipindah memancarkan NIA yang salah.
- **Tiket 27 diberi peringatan ketergantungan keras pada tiket 20.** Redup +
  penelusuran berhenti itu sah **hanya** selama filter baca menyaring Terhapus dan
  **tidak** menyaring Non-Aktif. Siapa pun yang "merapikan" filter itu jadi menyaring
  dua-duanya mengubah pilihan desain jadi data yang hilang, dan ia tidak akan tahu.
- **Tiket 22 (hapus) diblokir tiket 20 (lapisan baca)**, karena prasyarat "nol anak"
  hanya benar setelah anak Terhapus berhenti terhitung.

### Yang tidak dilakukan sesi ini, dan sebabnya

- **Nol kode aplikasi**, sesuai instruksi badan tiket.
- **`/shadcn` dan `base-ui-docs` tidak dipanggil.** Nol komponen dibuat, diubah, atau
  di-debug — spec menyebut komponen yang repo sudah pakai, dan memilih primitifnya
  adalah kerja tiket 25–28. Keempat tiket itu membawa instruksi memanggilnya.
  `/impeccable` **dipanggil**, sesuai Notes peta.
- **Tiket 04 mengunci `code`/`slug` produksi tetap tak terlihat.** Spec mengatakan
  itu terang di §4.5 alih-alih menyembunyikannya — nol pemeriksaan pernah dilakukan
  di sana, dan yang dibeli bukan angkanya melainkan jaminan bahwa angka itu **pasti
  dibaca oleh orang yang menjalankan migrasinya**.
