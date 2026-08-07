# Spec: Manajemen Struktur (PW/PD/PK)

**Status:** siap-serah
**Asal:** peta wayfinder `.scratch/manajemen-struktur/map.md`, 12 tiket keputusan
**Tanggal konsolidasi:** 7 Agustus 2026

Dokumen ini berdiri sendiri. Yang membangun tidak perlu membaca peta maupun tiket
mana pun — tautan ke tiket asal hanya untuk menelusuri **kenapa**, bukan untuk
melengkapi **apa**.

Yang dibangun: CRUD Struktur yang lengkap, dengan semantik Terhapus dan Non-Aktif
yang pasti dan matriks kewenangan yang tidak menyisakan sel kosong.

---

## 0. Peta jalan

| Bagian | Isi |
| --- | --- |
| [1](#1-model-keadaan-struktur) | Model Keadaan Struktur dan istilah kanoniknya |
| [2](#2-matriks-kewenangan) | Matriks kewenangan — siap jadi daftar kasus tes |
| [3](#3-prasyarat-penghapusan) | Prasyarat penghapusan, berbunyi lengkap |
| [4](#4-skema-dan-migrasi) | Kolom baru, constraint, urutan migrasi, pra-terbang |
| [5](#5-keadaan-akun) | Keadaan Akun sebagai turunan |
| [6](#6-pemindahan-induk-dan-nomor-induk-anggota) | Pemindahan induk dan penurunan NIA |
| [7](#7-invarian-lapisan-baca) | Invarian lapisan baca atas ketujuh referensi |
| [8](#8-permukaan) | Empat permukaan beserta keputusan desainnya |
| [9](#9-yang-implementasi-akan-tabrak) | Ganjalan yang sudah diketahui dan sengaja tidak diselesaikan di sini |
| [10](#10-di-luar-cakupan) | Di luar cakupan |

**Dua ADR yang lahir dari peta ini sudah ditulis** dan berlaku:
`docs/adr/0004-tidak-ada-hard-delete-struktur.md` dan
`docs/adr/0005-keadaan-struktur-satu-sumbu-dua-kolom.md`. `CONTEXT.md` juga sudah
disunting (bagian **Keadaan Struktur**, definisi BPW, BPH, dan Nomor Induk
Anggota). Implementasi mengikuti keduanya, tidak menulis ulang keduanya.

---

## 1. Model Keadaan Struktur

### 1.1 Satu sumbu, dua kolom, Terhapus mendominasi

Di domain, sebuah Struktur berada pada **tepat satu** Keadaan: **Struktur Aktif**,
**Struktur Non-Aktif**, atau **Struktur Terhapus**. Istilahnya **berprefiks** —
tanpa prefiks, "Non-Aktif" bertabrakan dengan Keadaan Kader yang sudah memakai
nama itu.

Di simpanan, dua kolom:

- `is_non_active` — sudah ada, **tidak disentuh sama sekali**.
- `deleted_at` — ditambahkan.

Dibaca berurutan, **Terhapus mendahului Non-Aktif**:

```
deleted_at IS NOT NULL          → Struktur Terhapus
is_non_active = true            → Struktur Non-Aktif
selain itu                      → Struktur Aktif
```

Baris yang `is_non_active` **dan** `deleted_at` menyala bersamaan itu **sah**, dan
artinya Terhapus. Penghapusan **tidak** menyapu `is_non_active` — mendominasi
bukan berarti menghapus.

Pemulihan mengosongkan **dua-duanya**. Struktur yang Non-Aktif → dihapus →
dipulihkan kembali sebagai **Aktif**, bukan Non-Aktif.

### 1.2 Derivasinya hidup di skema **dan** di satu pembaca terpusat

Keadaan turunan adalah kolom **`generatedAlwaysAs`** di `organization`, mengikuti
pola `level` dan `code_slug` yang sudah ada di tabel yang sama.

Kolom turunan **tidak menggantikan** kebutuhan satu pembaca terpusat di
`src/db/query/organization.ts`. Kolom membuat Keadaan bisa **dibaca**; ia tidak
membuat orang ingat **menyaringnya**. Dua-duanya dibangun. Yang ditolak adalah
membiarkan tiap call-site menyaring sendiri seperti hari ini.

### 1.3 Terhapus = catatan yang keliru, bukan pensiun

**Struktur Terhapus adalah Struktur yang tercatat keliru** — salah Jenjang,
duplikat, atau dibuat lalu tidak jadi berjalan. Non-Aktif menyangkut kepengurusan
yang berhenti; Terhapus menyangkut catatan yang keliru.

Ini yang menjelaskan kenapa prasyaratnya nol-isi: yang sudah punya sejarah tidak
keliru, ia cuma berhenti — dan itu Non-Aktif.

### 1.4 "Seolah barisnya tidak pernah ada" — dan itu ketat

Struktur Terhapus diperlakukan **seolah barisnya tidak pernah ada di basis data**,
tanpa benar-benar mengeluarkannya:

- Slug yang menunjuk Struktur Terhapus menghasilkan **404**, sama persis dengan
  slug yang memang tidak pernah ada.
- Tidak muncul di pohon, di dropdown induk, di agregat, di pencarian, di mana pun.
- **Tidak ada permukaan yang berkata "Struktur ini sudah dihapus."** Kalimat itu
  sendiri membocorkan bahwa ia ada. Sistem tidak boleh punya jawaban berbeda
  antara "tidak pernah ada" dan "pernah ada lalu dihapus".
- **Pengecualiannya satu dan disengaja:** permukaan Struktur Terhapus
  ([§8.4](#84-permukaan-struktur-terhapus--dashboardbranchesterhapus)), yang
  dilihat **Root dan BPW PP**.

Harganya diterima sadar: tautan lama jadi 404 tanpa penjelasan.

### 1.5 Tabel transisi

| Dari | Ke | Boleh | Syarat / catatan |
| --- | --- | --- | --- |
| Aktif | Non-Aktif | ya | seluruh anak **Aktif** harus dipindah atau dinonaktifkan lebih dulu; sasaran bukan PP |
| Non-Aktif | Aktif | ya | **induknya wajib Aktif** (aturan cermin, [§6.4](#64-aturan-cermin-menghidupkan-anak-menuntut-induk-yang-hidup)) |
| Aktif | Terhapus | ya | prasyarat [§3](#3-prasyarat-penghapusan) |
| Non-Aktif | Terhapus | ya | prasyarat [§3](#3-prasyarat-penghapusan); `is_non_active` dibiarkan menyala |
| Terhapus | Aktif | ya | Root dan BPW PP; **induknya wajib Aktif**; mengosongkan `deleted_at` **dan** `is_non_active` |
| Terhapus | Non-Aktif | **tidak** | pemulihan selalu berujung Aktif |

Keadaan asal **tidak** dilihat saat menghapus — prasyarat nol-isi adalah
satu-satunya penjaga. Mengharuskan Struktur diaktifkan dulu sebelum dihapus itu
ritual tanpa perlindungan tambahan.

### 1.6 Kolom jejak

`deleted_at` / `deleted_by` dan `non_active_at` / `non_active_by`. Bukan tabel
riwayat penuh.

> **Sadari ini pola baru.** Preseden Kader di repo ini
> (`src/db/schema/member.sql.ts:40`) cuma punya `deletedAt`, tanpa `deletedBy`.
> Struktur beda taruhannya, jadi kolom `*_by` tetap dipasang — tapi ia tidak
> mengikuti apa pun yang sudah ada.

_Asal: [tiket 01](issues/01-keadaan-struktur.md), diamandemen
[tiket 05](issues/05-sinkronisasi-keadaan-akun.md) dan
[tiket 12](issues/12-permukaan-root-pulihkan.md)._

---

## 2. Matriks kewenangan

### 2.1 Enam aturan baca — berlaku untuk seluruh tabel

Tabelnya sengaja dikolapskan. Bentuk utuhnya (Kewenangan × Jenjang Akun × aksi ×
Jenjang sasaran) itu 6 × 4 × 7 × 5 sel yang tidak akan pernah dibaca orang, dan
tabel yang tidak kebaca sama saja dengan sel kosong. Bentuk utuh bisa dihasilkan
kembali dari yang kolaps ini — tidak sebaliknya.

1. **Tiap sel dibaca sebagai konjungsi.** Sel berisi Jenjang sasaran yang boleh;
   hak itu berlaku **hanya** kalau sasaran juga ada di **Cakupan** Akun. Sumbu
   Cakupan tidak muncul di tabel karena tidak pernah punya pengecualian.
2. **Matriks ini mengatur permukaan Struktur saja.** Nama Struktur yang muncul di
   halaman Kader, Daurah, atau Artikel diatur gate permukaan masing-masing
   (`requireKekaderanAccess` dan kawan-kawan), bukan oleh tabel ini. Kalau tabel
   ini ikut mengatur "boleh baca Struktur", ada dua tempat yang menjawab
   pertanyaan sama dan mereka akan berselisih.
3. **Struktur Terhapus tidak bisa dialamati siapa pun kecuali Root dan BPW PP.**
   Seluruh aksi selain `pulihkan` otomatis "tidak" — bukan karena dilarang, tapi
   karena barisnya tidak terlihat ([§1.4](#14-seolah-barisnya-tidak-pernah-ada--dan-itu-ketat)).
   Tidak perlu kolom sendiri.
4. **Keadaan sasaran tidak mengubah Kewenangan.** Yang boleh mengelola sebuah PK
   boleh mengelolanya baik Aktif maupun Non-Aktif. `nonaktifkan` dan `aktifkan
   kembali` simetris penuh — satu aturan, bukan dua. **Pembekuan ada di pelaku,
   bukan di sasaran** ([§5](#5-keadaan-akun)).
5. **Prasyarat penghapusan bukan kewenangan.** Berlaku untuk **semua**, Root
   termasuk. Cakupan membatasi jangkauan; prasyarat menjaga konsistensi. Root
   menembus yang pertama, tidak pernah yang kedua.
6. **BPW tidak pernah mengelola Strukturnya sendiri.** Gate-nya "**di bawah**
   Cakupan", bukan "di dalam Cakupan" — dan itu berarti `isOrgInAccessScope` yang
   sudah ada **tidak cukup**, karena ia menghitung Struktur si Akun sendiri
   sebagai anggota Cakupan (lihat cabang `humas` di
   `src/db/query/organization.ts:71-73` yang mengembalikan `[connectedOrgId]`).

### 2.2 Matriks

| Kewenangan | baca | buat | sunting | nonaktifkan / aktifkan | hapus | pulihkan |
| --- | --- | --- | --- | --- | --- | --- |
| **Root** | semua | semua | semua | **semua kecuali PP** | semua | semua |
| **BPH** (tiap Jenjang) | Cakupan | — | Strukturnya sendiri | — | — | — |
| **BPW PP** | semua | PW, PDLN, PD, PK | PW, PDLN, PD, PK | PW, PDLN, PD, PK | PW, PDLN, PD, PK | PW, PDLN, PD, PK |
| **BPW PW** | Cakupan | — | PD, PK | — | — | — |
| **BPW PD/PDLN** | Cakupan | PK | PK | PK | PK | — |
| **BPK** | — | — | — | — | — | — |
| **Humas** | — | — | — | — | — | — |
| **Akun Kader** | — | — | — | — | — | — |

**BPW PK tidak ada barisnya** — Kewenangan itu tidak pernah diterbitkan di Jenjang
PK, dan kode sudah melewatinya (`src/db/query/organization.ts:148-161`).

### 2.3 Sel yang wajib dinyatakan, bukan disimpulkan

- **Jenjang PP tidak bisa dinonaktifkan oleh siapa pun**, Root termasuk. Larangan
  dipasang pada **sasaran**, bukan sebagai pengecualian pada pelaku. Alasannya
  bukan melindungi Akun `root` yang terhubung ke PP, melainkan bahwa "kepengurusan
  pusat sedang tidak berjalan" bukan keadaan yang punya arti di organisasi ini.
  PP tidak punya induk, jadi larangannya satu baris.
- **BPW PP boleh menghapus sebuah PW utuh.** Yang melindungi PW bukan Kewenangan
  tapi **isinya**: PW yang hidup pasti punya anak, Member, atau Daurah, jadi
  prasyarat menolaknya. PW yang baru dibuat lima menit lalu dengan Jenjang salah
  memang harus bisa dihapus — itu persis definisi "tercatat keliru"
  ([§1.3](#13-terhapus--catatan-yang-keliru-bukan-pensiun)). Ditulis terang supaya
  orang berikutnya tidak mengira ini celah lalu "menambalnya".
- **BPW PW membaca dan menyunting, dan cuma itu.** ~~Nol hak kelola.~~
  **Diamandemen 7 Agustus 2026** atas putusan pengguna saat tiket 18 dikerjakan:
  BPD memegang `sunting` atas **PD dan PK** di dalam Cakupannya, dan tetap nol
  `buat`, nol `hapus`, nol `nonaktifkan`/`aktifkan`, nol `pulihkan`.

  Yang tidak berubah adalah sebabnya: **pembuatan PD tetap tersentralisasi di BPW
  PP** (konsekuensi konstitusi organisasi), dan aksi merusak tinggal di sana juga.
  Yang dikoreksi adalah asimetrinya — BPD sudah membaca seluruh subtree-nya, jadi
  melarangnya membetulkan nama Daerah yang salah ketik memaksa eskalasi ke PP
  untuk pekerjaan yang tidak berisiko. **Baca dan sunting itu satu pasang; buat
  dan hapus pasangan yang lain.**

  **PW tidak masuk selnya.** Satu-satunya PW di dalam Cakupan sebuah BPD adalah
  PW-nya sendiri, dan itu sudah ditutup [§2.1](#21-enam-aturan-baca--berlaku-untuk-seluruh-tabel)
  aturan 6. Menuliskannya di sel ini akan menyatakan hak yang gate-nya lalu
  tolak.
- **BPK, Humas, dan Akun Kader nol di seluruh baris.** Diam berarti tidak boleh.
  Memberi Humas hak baca rekursif akan membatalkan ADR 0002 lewat pintu belakang.
- **Penghapusan PP tidak diputuskan.** Prasyarat menolaknya dalam praktik karena
  PP selalu punya anak, tapi itu perlindungan yang kebetulan dan **belum jadi
  kebijakan tertulis**. Kalau seseorang ingin itu jadi kebijakan, itu keputusan
  baru — jangan diselundupkan saat implementasi.

### 2.4 Bidang mana yang boleh disunting

| Bidang | Root | BPW (atas sasaran) | BPH (atas Strukturnya sendiri) |
| --- | --- | --- | --- |
| `name` | ubah | ubah | ubah |
| `slug` | ubah | ubah | ubah |
| `logo` | ubah | ubah | ubah |
| `code` | tetap sejak dibuat | tetap sejak dibuat | — |
| `type` | tetap sejak dibuat | tetap sejak dibuat | — |
| `parentId` | tetap sejak dibuat<sup>†</sup> | tetap sejak dibuat<sup>†</sup> | — |
| Keadaan Struktur | lewat aksi, bukan bidang | lewat aksi, bukan bidang | — |

<sup>†</sup> `parentId` berubah **hanya** lewat aksi Pindah Induk
([§6](#6-pemindahan-induk-dan-nomor-induk-anggota)), tidak pernah lewat form
Sunting.

**`type` dan `parentId` beku setelah pembuatan, untuk semua Kewenangan termasuk
Root.** Ini keputusan, bukan kelalaian, dan dia yang **menjelaskan kenapa aksi
hapus ada**: kalau Jenjang yang salah tinggal disunting, penghapusan kehilangan
alasan hidupnya. Salah Jenjang saat membuat → hapus lalu buat ulang.

**Konsekuensi wajib untuk permukaan:** form Tambah dan form Sunting **bukan form
yang sama**. Tambah punya kotak `type` dan `parentId`; Sunting **tidak punya
keduanya sama sekali** — bukan `disabled`, tapi tidak ada. Itu menutup celah
`add-form/action.ts` **secara konstruksi**, bukan lewat pemeriksaan tambahan yang
bisa lupa dipasang.

### 2.5 Bentuk gate

Rumahnya `src/lib/auth/kestrukturan.ts`, sejajar `kekaderan.ts`, memakai kata yang
sudah dipakai `CONTEXT.md` untuk hal ini ("BPW: mengelola kestrukturan").

1. **`canManageKestrukturan(role, jenjangAkun, jenjangSasaran): boolean`** —
   **murni, nol basis data.** Ini matriksnya sendiri. Alasan utamanya bukan
   performa: ini satu-satunya gate di repo yang isinya cukup banyak untuk salah,
   dan isi sebanyak itu harus bisa dites sebagai **tabel argumen ke hasil** tanpa
   satu pun fixture.
2. **`requireKestrukturanReadAccess(targetOrgId)`** — hak membuka permukaan
   Struktur. Root/BPH/BPW, sasaran di dalam Cakupan.
3. **`requireKestrukturanManageAccess(targetOrgId)`** — hak mengubah sebuah
   Struktur sasaran. Membungkus `readAccessScope` + Cakupan + fungsi murni + aturan
   "sasaran bukan Strukturnya sendiri".
4. **Gate BPH tanpa argumen sasaran** ([§8.1](#81-profil-nama-struktur--dashboardorganization))
   — sasarannya selalu Struktur si Akun, jadi ia **mengembalikan Struktur itu**;
   satu panggilan melayani otorisasi sekaligus pembacaan data halaman.

**UI memanggil fungsi murni yang sama** dengan yang dipakai gate, sehingga tombol
yang tampak dan tulisan yang lolos dijaga satu sumber — tidak akan ada tombol yang
menyala lalu ditolak saat dipencet. Ini yang membunuh opsi "satu gate per aksi":
grid 20 kartu × 3 tombol berarti 60 `await` hanya untuk memutuskan tombol mana yang
muncul.

**Gate `pulihkan` berdiri sendiri**, dan ini yang paling gampang salah. Ia **bukan**
`role === 'root'` saja, dan **bukan** `role === 'root' || role === 'bpw'`. Yang
lolos hanya Root **dan BPW yang Struktur terhubungnya PP**. BPW PD dan BPW PDLN
tetap nol, sama seperti seluruh baris lain milik mereka. Menyalin pola
`role === 'bpw'` dari tempat lain membuka pemulihan untuk seluruh BPW se-Indonesia.

**Prasyarat penghapusan tidak masuk gate mana pun.** Ia invarian data, bukan
kewenangan; menaruhnya di dalam gate akan membuat orang menyimpulkan bahwa
Kewenangan yang cukup tinggi bisa menembusnya. Ia diperiksa di jalur hapus,
**terpisah dan sesudah gate**.

### 2.6 Yang menggantikan tambalan keamanan yang sudah ada

Celah produksi di `add-form/action.ts` **sudah ditambal** (commit `a9c535b`), dan
tambalan itu **sengaja sempit**: Cakupan, Jenjang, dan pembekuan `type`/`parentId`.
Ia meninggalkan dua gerbang sempit di `src/lib/auth/kestrukturan.ts` —
`requireCreateStrukturAccess` dan `requireEditStrukturAccess` — plus
`isLegalChildType`.

Implementasi matriks ini **menggantikan** kedua gerbang itu, bukan menambah lapis
ketiga di sebelahnya. `isLegalChildType` **tetap hidup** — ia menjaga bentuk pohon,
bukan kewenangan, dan itu pertanyaan yang berbeda. Tes `kestrukturan.test.ts` yang
sudah ada (17 tes) ikut dirombak bersamanya.

_Asal: [tiket 02](issues/02-matriks-kewenangan-struktur.md), diamandemen
[tiket 05](issues/05-sinkronisasi-keadaan-akun.md),
[tiket 06](issues/06-pindah-induk-saat-penonaktifan.md), dan
[tiket 12](issues/12-permukaan-root-pulihkan.md)._

---

## 3. Prasyarat penghapusan

Berbunyi lengkap: **nol Struktur anak, nol Member, nol Daurah.**

Tiga klausa yang gampang hilang saat dirakit, diputus di tiket berbeda, dan
ketiganya wajib ditulis apa adanya:

1. **Anak Non-Aktif MENGHITUNG.** Sebuah induk dengan anak Non-Aktif tidak bisa
   dihapus selama anak itu masih ada. Itu tidak apa-apa — penghapusan memang untuk
   salah catat. _([tiket 06](issues/06-pindah-induk-saat-penonaktifan.md))_
2. **Anak Terhapus TIDAK menghitung.** Konsisten dengan
   [§1.4](#14-seolah-barisnya-tidak-pernah-ada--dan-itu-ketat): Terhapus
   diperlakukan seolah barisnya tidak pernah ada, jadi ia tidak boleh menahan apa
   pun. _([tiket 12](issues/12-permukaan-root-pulihkan.md))_
3. **Publikasi BUKAN prasyarat.** Artikel, Kategori Artikel, dan Pengaturan Situs
   boleh menggantung. Yang menahan penghapusan tetap tiga.
   _([tiket 10](issues/10-nasib-publikasi-struktur-terhapus.md))_

Harga klausa 2 dibayar sadar: **rantai Terhapus-di-bawah-Terhapus jadi mungkin.**

```
PD Jakarta
 └─ PK Percobaan        ← dihapus lebih dulu

lalu PD Jakarta ikut dihapus (prasyarat melihat nol anak yang menghitung)

hasilnya:  PD Jakarta      (Terhapus)
            └─ PK Percobaan (Terhapus)
```

Permukaan [§8.4](#84-permukaan-struktur-terhapus--dashboardbranchesterhapus) yang
menanganinya.

**Kenapa publikasi tidak jadi prasyarat keempat, dan skema sendiri yang
menjawabnya.** Periksa siapa yang memasang `onDelete: 'cascade'` ke `organization`:

| Bercascade | Tanpa cascade |
| --- | --- |
| `article.organization_id` | `organization.parent_id` |
| `article_category.organization_id` | `member.organization_id` |
| `site_settings.organization_id` | `training.organization_id` |
| `user.connected_organization_id` | |

Kolom **tanpa** cascade persis sama dengan daftar prasyarat. Penulis skema aslinya
sudah mengklasifikasi: **cascade = ikut mati, tanpa cascade = wajib kosong lebih
dulu.** Argumen tandingannya nyata dan sudah ditimbang ("Struktur yang sempat
menerbitkan Artikel susah disebut salah catat"), tapi yang mengalahkannya adalah
skenario yang paling sering terjadi — Struktur salah buat yang sempat dicoba
dengan satu draft artikel akan jadi **tak bisa dihapus selamanya**, dan `code` yang
beku (ADR 0004) membuatnya nyangkut permanen.

`member_organization_history.organization` **bukan** FK — ia kolom teks
(`src/db/schema/organization-history.sql.ts:17`), jadi ia di luar percakapan ini
seluruhnya.

---

## 4. Skema dan migrasi

### 4.1 Yang tetap dan tidak boleh dilanggar

- `is_non_active` **tidak disentuh**; `deleted_at` ditambahkan.
- Keadaan Struktur itu kolom `generatedAlwaysAs` — **tanpa backfill**, tapi
  `drizzle-kit` **membuang `NOT NULL` dari kolom generated** yang ditambahkan lewat
  `ALTER TABLE` (cabang `!generated` di `addColumnConvertor`). Kolomnya akan
  mendarat nullable dan selamanya berselisih dengan skema TS-nya. **`SET NOT NULL`
  harus ditulis tangan** ke dalam berkas migrasi.
- **Tidak ada `CONCURRENTLY`, sama sekali.** Runner Drizzle membungkus seluruh
  migrasi tertunda dan tiap statement di dalamnya ke dalam satu `db.transaction()`
  (`drizzle-orm/pg-core/async/session.js:128`, diperiksa tangan di repo ini). Tidak
  ada opsi keluar di kedua paket. `drizzle-kit generate` dengan senang hati
  **memancarkan** `CREATE INDEX CONCURRENTLY`, lalu runner-nya menjalankannya di
  dalam transaksi, gagal, dan **me-rollback seluruh migrasi**. Lapisan tipe dan
  generator sama-sama menerima apa yang runner-nya tidak bisa jalankan.
- `code` unik lintas **semua** baris, Terhapus termasuk.
- `slug` **partial unique** `WHERE deleted_at IS NULL`.
- `code_slug` **tanpa** constraint.
- **Nol kolom baru di `user`** — Keadaan Akun turunan ([§5](#5-keadaan-akun)).

### 4.2 Bentuk constraint-nya

```sql
-- slug: hanya di antara baris yang belum Terhapus
CREATE UNIQUE INDEX organization_slug_live_unique
    ON organization (slug) WHERE deleted_at IS NULL;
```

Drizzle memancarkan bentuk ini — **diverifikasi dengan menjalankan
`drizzle-kit generate`**, bukan disimpulkan dari tipe:

```sql
CREATE UNIQUE INDEX "organization_slug_live_unique"
    ON "organization" ("slug") WHERE ("deleted_at" is null);
```

Jejak sumber: `drizzle-orm/pg-core/indexes.js:81`,
`drizzle-kit/drizzle-DX4zjwm_.js:315-326`, `drizzle-kit/diff-BQc-7Nm8.js:458-469`.

Dua alternatifnya gugur berdasarkan bukti, dan yang pertama layak diingat:

- **`UNIQUE (slug, deleted_at)` dengan NULLS DISTINCT bawaan itu jebakan yang rapi
  dan diam.** Dua baris hidup sama-sama ber-`deleted_at = NULL`, dan NULL tidak
  pernah sama dengan NULL — jadi constraint-nya **tidak menangkap apa pun**. Ia
  terlihat benar dan tidak bekerja.
- **`UNIQUE NULLS NOT DISTINCT (slug, deleted_at)`** benar-benar bekerja, tapi
  menolak dua penghapusan slug yang sama pada timestamp identik (gagal palsu) dan
  menaruh kolom audit ke dalam kunci.

`code` memakai unique biasa lintas semua baris. Catatan operasional:
`ADD CONSTRAINT UNIQUE` mengambil ACCESS EXCLUSIVE (memblokir baca juga), sementara
`CREATE UNIQUE INDEX` hanya memblokir tulis. `USING INDEX` tidak bisa menyelamatkan
indeks slug — partial index dikecualikan secara eksplisit.

**`code_slug` tidak dipasangi constraint.** Keunikan `code` **tidak** menurunkan
keunikan `code_slug` — `replace(lower(code), '.', '-')` membuang dua dimensi
sekaligus, dan format `code` nyata di `src/lib/utils/member.ts` sudah memakai `.`
maupun `-` sebagai pemisah (`19.PD-1` dan `19-PD-1` menghasilkan slug yang sama).
Tapi nol pembaca di `src/app`, `src/components`, maupun `src/lib`, dan
`generateRegisterNumber` mengurai `code` langsung — jadi argumen ADR 0004 tidak
merambat ke sini.

### 4.3 Tiga momen tabrakan `23505`

Partial unique index `slug` bisa gagal di tiga tempat, dan ketiganya sudah punya
rumah:

| Momen | Gagal? | Ditangani di |
| --- | --- | --- |
| Struktur baru memungut slug milik Struktur Terhapus | **tidak** — memang sah | — |
| Pemulihan Struktur Terhapus yang slugnya sudah dipungut | ya, di `UPDATE` | [§8.4](#84-permukaan-struktur-terhapus--dashboardbranchesterhapus) |
| BPH menyunting slug Strukturnya sendiri | ya, di `UPDATE` | [§8.1](#81-profil-nama-struktur--dashboardorganization) |

Dua yang gagal memakai **pola pesan yang sama**: galat mendarat **di field slug**,
bukan toast, karena ia bisa diperbaiki di tempat. Dua kegagalan dengan sebab
identik tidak dijelaskan dengan dua cara berbeda.

`code` tidak pernah punya kasus ini — constraint lintas semua baris memajukan
kegagalan ke waktu pembuatan, dan itu memang yang ADR 0004 inginkan.

### 4.4 Cascade dicabut, `deleteOrganization` dihapus

Keempat `onDelete: 'cascade'` ke `organization` — `article`, `article_category`,
`site_settings`, `user` — **dicabut**. Fungsi `deleteOrganization`
(`src/db/query/organization.ts:325`, masih `db.delete`, nol call-site) **dihapus**.

Ini bukan sekadar merapikan skema yang menyesatkan. Hari ini
`DELETE FROM organization` **berhasil diam-diam dan membawa serta Akun
penggunanya** — sebuah pemanggilan `deleteOrganization` yang tak sengaja adalah
kehilangan senyap, bukan galat. Setelah cascade dicabut, perintah yang sama gagal
dengan `23503 foreign_key_violation` dan **nol baris berubah**.

Hasilnya: **larangan hard delete berhenti dijaga ingatan manusia dan mulai dijaga
basis data.** ADR 0004 naik dari konvensi jadi **jaminan skema**.

Ikut rombongan migrasi yang sama dengan kolom-kolom di [§4.1](#41-yang-tetap-dan-tidak-boleh-dilanggar).

### 4.5 Pra-terbang wajib

**Nol pemeriksaan duplikat pernah dilakukan di produksi, dan spec ini tidak
berpura-pura sebaliknya.** Akses produksi ditolak sadar oleh pengguna (7 Agustus
2026, alasan risiko) dan itu **batasan tetap**, bukan penghalang sementara.

Yang dibeli sebagai gantinya: pemeriksaan pindah dari **momen perencanaan** ke
**momen migrasi**, di mana ia tidak bisa basi. Inspeksi sekali pakai memang lebih
lemah daripada yang terlihat **bahkan seandainya akses diberikan** — jendela antara
inspeksi dan deploy bisa berhari-hari, dan pendaftaran Struktur baru jalan terus di
dalamnya.

**Skripnya sudah ditulis**: `src/scripts/check-duplicates.ts`, dijalankan lewat
`bun run check:duplicates` (dipindahkan ke sana oleh [tiket 14](issues/14-pra-terbang-duplikat.md)). Ia
murni `SELECT`, lewat `requireDatabaseConsent` yang sama dengan `db:migrate`
(bukan pintu belakang), dan sudah mengorientasi diri lebih dulu (versi server,
`search_path`, skema mana yang memuat `organization`) sehingga basis data kosong
dijawab dengan kalimat, bukan galat mentah.

Ia menghitung duplikat `code`, `slug`, **dan** `code_slug`, dan memisahkan Member
hidup dari Member yang sudah dihapus lunak — ADR 0004 bertumpu pada fakta bahwa
Member terhapus **masih memegang** Nomor Induk yang tersusun dari `code` itu.

Ia **artefak, bukan buangan** — rumahnya permanen di `src/scripts/`, bersebelahan
dengan `db-guard.ts`, `reset.ts`, dan `seed.ts`.

**Dijalankan sesaat sebelum migrasi**, terhadap basis data yang akan dimigrasi —
bukan sekali saat perencanaan.

### 4.6 Pohon keputusan pra-terbang

| Temuan | Putusan |
| --- | --- |
| nol duplikat | jalan; kedua migrasi constraint berangkat |
| `slug` duplikat saja | perbaiki mekanis (ganti nama yang kalah), lalu jalan |
| `code` duplikat | **berhenti.** Kirim migrasi `slug` saja; `code` menunggu putusan manusia |
| `code_slug` duplikat | abaikan — ia tidak dipasangi constraint ([§4.2](#42-bentuk-constraint-nya)) |

**Kenapa `slug` dan `code` tidak setara.** `slug` cuma URL dan sudah diputuskan
bebas dipungut ulang setelah penghapusan — yang kalah tinggal diganti namanya, nol
dampak ke apa pun yang tercetak. `code` **tidak bisa diperbaiki secara mekanis,
titik**: ADR 0004 mengunci `code` selamanya, jadi menggantinya untuk memuaskan
constraint justru melanggar ADR yang melahirkan constraint itu. `code` duplikat
bukan pekerjaan migrasi — ia **insiden data yang menuntut putusan manusia**.

**Koreksi faktual yang mudah salah tebak:** duplikat `code` **TIDAK** membuat dua
Kader punya Nomor Induk yang sama. `generateRegisterNumber` mencari urutan terakhir
dengan `ilike(member.registerNumber, ${prefix}%)` **tanpa filter organisasi**
(`src/lib/utils/member.ts:80`), jadi dua Struktur bercode kembar berbagi satu deret
dan tetap menerima nomor yang berbeda. Yang rusak bukan keunikan nomornya — yang
rusak adalah **NIA berhenti mengidentifikasi Struktur**. Efek samping kecil tapi
nyata: berbagi satu deret membuat tembok 1000 ([§9](#9-yang-implementasi-akan-tabrak))
tercapai kira-kira dua kali lebih cepat untuk prefiks itu.

### 4.7 Rombongan migrasi — tiga, bukan satu

| # | Isi | Boleh ditulis | Boleh dijalankan |
| --- | --- | --- | --- |
| **A** | `deleted_at`, `deleted_by`, `non_active_at`, `non_active_by`, kolom Keadaan `generatedAlwaysAs` + `SET NOT NULL` tangan, cabut 4 cascade | sekarang | setelah gladi bersih |
| **B** | partial unique index `slug` | sekarang | setelah pra-terbang, kalau `slug` bersih atau sudah diperbaiki |
| **C** | unique `code` | sekarang | **hanya** kalau pra-terbang menemukan nol duplikat `code` |

**B dan C tidak boleh disatukan.** Kalau digabung, satu `code` duplikat yang butuh
putusan manusia ikut menyandera constraint `slug` yang perbaikannya sepele. Dua
migrasi, dua nasib.

**Kegagalannya aman.** `CREATE UNIQUE INDEX` atas tabel berisi duplikat gagal, dan
runner Drizzle membungkus seluruh migrasi tertunda dalam satu transaksi — jadi
**rollback bersih: nol baris berubah, nol indeks setengah jadi.** Indeks invalid
yang tertinggal itu risiko khas `CONCURRENTLY`, dan `CONCURRENTLY` mustahil
dinyatakan di sini sama sekali ([§4.1](#41-yang-tetap-dan-tidak-boleh-dilanggar)).

Jadi **pra-terbang bukan penghalang keselamatan, ia penghalang keterdugaan
deploy.** Yang dipertaruhkan kalau lalai bukan data rusak, melainkan migrasi
meledak di tengah deploy dan orang yang memegangnya harus mentriase data yang belum
pernah ia lihat, di bawah tekanan.

_Asal: [tiket 01](issues/01-keadaan-struktur.md),
[tiket 03](issues/03-unique-constraint-di-bawah-soft-delete.md) (temuan lengkap:
[`research/03-unique-constraint.md`](research/03-unique-constraint.md)),
[tiket 04](issues/04-cek-duplikat-code-slug-di-produksi.md),
[tiket 05](issues/05-sinkronisasi-keadaan-akun.md),
[tiket 10](issues/10-nasib-publikasi-struktur-terhapus.md)._

---

## 5. Keadaan Akun

### 5.1 Turunan, bukan kolom tersimpan

**Akun tidak punya Keadaan sendiri — ia mewarisi Keadaan Strukturnya saat dibaca.**

Nol kolom baru di `user`, nol migrasi di tabel itu, nol jalur sapu, nol deteksi
drift. Bug yang paling dikhawatirkan — "seseorang berhasil login ke Struktur yang
sudah tidak ada" — jadi **mustahil secara konstruksi**, bukan dijaga kedisiplinan.
Tidak ada angka kedua yang bisa berselisih.

Yang memungkinkannya: **sesi sudah membawa Keadaan Struktur di tiap request.**
`withUserCTE` (`src/db/query/cte/user.ts:16-26`) men-join `organization` dan ikut
memilih `isNonActive` ke dalam `connectedOrganization`. Jalurnya
`readActiveSession()` → `validateSession` → `readSession` → `withSessionCTE` →
`withUserCTE`. **Nol query tambahan** yang perlu ditambahkan; join-nya sudah
terjadi. Struktur milik Akun Kader juga sudah terjangkau lewat jalur kedua,
`withMemberCTE` (`src/db/query/cte/member.ts:11-22`).

Implementasi wajib memperluas CTE itu agar ikut membawa **Keadaan** (bukan cuma
`isNonActive`) begitu kolom generated-nya mendarat.

### 5.2 Seam-nya di `readActiveSession` / `validateSession`

Struktur mati → **sesi dianggap tidak ada**.

**Nol call-site baru.** Tiap `if (!session) redirect('/login')` yang sudah tersebar
di seluruh halaman dan Server Action langsung berlaku apa adanya, dan permukaan
yang **belum ditulis** ikut terjaga karena mereka juga harus lewat situ.

`readAccessScope` ditolak sebagai seam: Server Action yang tidak memakainya lolos.
Layout dasbor dan `AccessGuard` ditolak lebih keras: keduanya menutup **halaman**,
sementara Server Action bisa dipanggil langsung tanpa merender halamannya sama
sekali.

### 5.3 Pintunya menutup di request berikutnya

Bukan di login berikutnya, dan bukan lewat penghapusan sesi paksa.

"Login berikutnya" berarti sampai **tiga hari** (`maxAge` di
`login-form/action.ts:88`) setelah sebuah Struktur mati, orang-orangnya masih
mencatat Kader dan mengubah data di sana — persis yang penonaktifan dimaksudkan
untuk hentikan. Penghapusan sesi paksa benar hasilnya tapi kerja dua kali, dan
menambah satu lagi jalur-yang-bisa-lupa-dipanggil.

### 5.4 Akun Kader tidak ikut mati

Yang berhenti bisa dipakai hanya **empat Akun kepengurusan** — BPH, BPK, BPW,
Humas. **Akun Kader tetap hidup.**

Buktinya ada di kalimat definisi Non-Aktif itu sendiri: _"Menyangkut keadaan
kepengurusan, bukan keadaan Kader di dalamnya."_ Kalau menonaktifkan sebuah PD ikut
mengunci ratusan Kader dari akun mereka sendiri, kalimat itu jadi bohong. Mereka
bukan pengurusnya — mereka orang yang kebetulan terdaftar di sana.

Struktur **Terhapus** tidak punya kasus ini sama sekali: prasyaratnya nol Member,
jadi tidak ada Akun Kader yang bisa terdampak.

### 5.5 Pesan penolakan: generik untuk dua-duanya

Baik Struktur Non-Aktif maupun Struktur Terhapus menghasilkan pesan yang **sama
persis** dengan password yang benar-benar salah: **"Username atau password
salah."**

> Ini **pilihan pengguna**, bukan rekomendasi agen. Agen mengusulkan pesan berbeda
> untuk Non-Aktif (alasan: Non-Aktif bukan rahasia, dan pengurus yang sah akan
> mengira lupa password). Pengguna memilih generik dua-duanya. Jangan dibuka ulang
> saat implementasi.

**Konsekuensinya dipikul di tempat lain:** sistem sengaja **tidak** memberi tahu,
jadi yang menonaktifkan sebuah Struktur wajib memberi tahu orangnya **di luar
sistem** — dan dialog konfirmasi
([§8.2](#82-sheet-struktur--branchmanagementsheet)) yang menyatakan kewajiban itu.

_Asal: [tiket 05](issues/05-sinkronisasi-keadaan-akun.md)._

---

## 6. Pemindahan induk dan Nomor Induk Anggota

### 6.1 Aksi berdiri sendiri

Pemindahan adalah **aksi berdiri sendiri**, bukan langkah wajib di dalam alur
penonaktifan. Alurnya dua langkah: **pindahkan dulu, baru nonaktifkan.**

Yang berubah **hanya `organization.parentId` milik Struktur yang dipindahkan** —
satu kolom, satu baris. `member.organizationId` dan `training.organizationId`
dua-duanya menunjuk Komisariat, bukan induknya, jadi **Member dan Daurah tidak ke
mana-mana**.

Daurah lampau **tidak** menyesatkan setelah pindah: ia tetap tercatat
diselenggarakan oleh Komisariat itu, dan pernyataan itu tetap benar. Yang berubah
cuma di bawah Daerah mana ia terbaca hari ini — cerminan keadaan sekarang, bukan
klaim tentang masa lalu.

**Pelakunya hanya BPW PP dan Root**, dan **nol sel baru di matriks
[§2.2](#22-matriks)**. Pemindahan cuma "kelola Struktur yang dipindah" **dan**
"kelola induk tujuan" — dua hak yang keduanya sudah punya.

### 6.2 Batas calon induk: `pwCode` tidak boleh berubah

> **Rumusan yang dipakai adalah ini, bukan "dalam PW yang sama".** Rumusan lama
> adalah **proxy** yang bocor: ia tidak terdefinisi untuk PK di bawah PDLN
> (`pwCode = 99`, nol PW) dan **meloloskan penyeberangan terselubung** PDLN → PW.

**Calon induk sah bila `pwCode` hasil penurunan NIA tidak berubah.**

| Yang dipindah | Calon induk sah | `pwCode` |
| --- | --- | --- |
| PK di bawah PD | PD lain di PW itu, atau **PW itu sendiri** | tetap, mis. `19` |
| PK di bawah PDLN | **PDLN lain** | tetap `99` |

Satu invarian, dua kasus, nol hafalan terpisah. Ia sekaligus menolak PDLN → PW,
yang persis kebohongan permanen yang [§6.3](#63-pd-tidak-pindah-antar-pw) tolak.

Rumusan ini membatasi **daftar calon**, bukan **siapa yang boleh** — ia tidak
menyentuh kewenangan sama sekali.

### 6.3 PD tidak pindah antar-PW

Secara mekanis bisa — satu kolom — tapi **tidak ada versi pemindahan langsung yang
menjaga NIA tetap jujur**, karena nomor PW ikut terkunci di `code` yang beku:

- membiarkan NIA menyebut PW lama = **bohong permanen** di tiap identitas baru;
- menurunkan nomor PW dari induk baru = `pdCode` tetap dari kode sendiri, sehingga
  dua PD berbeda bisa berbagi kolam nomor dan **NIA berhenti menunjuk PD mana pun
  secara pasti**.

Maka **pemekaran ditangani tanpa pemindahan**: PD lama dinonaktifkan, PD baru
dibuat di PW baru **dengan kode yang benar sejak awal**, lalu Kader terkait
dipindahkan ke sana. Untuk kasus yang memang jarang, menukar kemudahan sekali
dengan kesalahan permanen di tiap identitas sesudahnya adalah tukar yang buruk.

> **Jaring pengamannya belum ada.** Memindahkan Kader antar-Struktur ada di
> [§10](#10-di-luar-cakupan) — permukaannya belum dibangun. Alur pemekaran di atas
> belum bisa dituntaskan hari ini, dan itu diketahui.

### 6.4 Aturan cermin: menghidupkan anak menuntut induk yang hidup

- **Menonaktifkan induk** menuntut seluruh anak **Aktif** pergi lebih dulu
  (dipindah atau dinonaktifkan). Anak yang sudah Non-Aktif **boleh ditinggal**.
- **Menghidupkan anak** menuntut induknya hidup lebih dulu. Kalau induknya mati, ia
  harus dipindah dulu ke induk yang hidup.

Satu aturan, dua arah, tidak ada yang perlu dihafal terpisah. Berlaku penuh juga
untuk **pemulihan dari Terhapus**, sebab pemulihan selalu berujung Aktif.

Meninggalkan anak Non-Aktif **diverifikasi tidak merusak apa pun**: penelusuran
Cakupan berjalan murni lewat `parent_id` tanpa saringan Keadaan
(`src/db/query/organization.ts:77-83`), jadi menonaktifkan induk tidak memutus
pohon; daftar di halaman tetap tampil; NIA tidak tersentuh karena PK Non-Aktif
memang tidak mendaftarkan Kader. Satu-satunya yang mengeras: induk itu jadi tidak
akan pernah bisa dihapus selama anaknya masih ada ([§3](#3-prasyarat-penghapusan)).

**"Mengaktifkan induk otomatis menghidupkan seluruh anaknya" ditolak** — perubahan
keadaan massal yang tidak diminta adalah cara tercepat membangunkan Struktur yang
memang sengaja dimatikan. Hal yang sama menolak **pemulihan berantai otomatis**.

### 6.5 Nomor Induk Anggota — mekanismenya, dan invarian yang tidak pernah ditulis

**Bentuknya 11 karakter:** `[PW 2][PD 2][tahun 4][urut 3]` → `19012024001`.

`resolveOrgCodes` (`src/lib/utils/member.ts:15-42`) mengurai string `code` dengan
regex, bercabang per Jenjang:

| Jenjang | Yang diurai | Hasil |
| --- | --- | --- |
| `pw` | `PW\s*(\d+)` dari kodenya sendiri | PW dari kode, **PD = `00`** |
| `pdln` | `-\s*(\d+)` dari kodenya sendiri | **PW = `99`**, PD dari kode |
| `pd` | `(\d+)\s*\.?\s*PD[\s.-]*(\d+)` | PW dan PD dari kodenya sendiri |
| `pk` | **pola yang sama persis dengan `pd`** | PW dan PD dari kode PK |

Baris terakhir itu intinya. **Ada invarian tersembunyi: kode sebuah PK wajib memuat
kode PD induknya.** Komentar di kodenya sendiri membocorkannya (`'1.PD-1.USK'`).
Karena `code` beku selamanya (ADR 0004), memindahkan sebuah PK **memecahkan
invarian itu secara permanen** — kalau NIA tetap diturunkan dari kode PK sendiri.

**Komisariat tidak muncul di NIA sama sekali.** Dua PK di bawah PD yang sama berbagi
satu kolam nomor.

Dua fakta lain yang perlu diketahui yang membangun:

- **Penjaga keunikan NIA bukan tabel `member`.** `member.registerNumber` **tidak
  punya unique constraint sama sekali**; yang menjaga adalah `user.name` yang
  `.unique()` (`src/db/schema/user.sql.ts:9`), diisi NIA saat Akun Kader dibuat. Ia
  bekerja hanya karena tiap Member selalu dibuatkan Akun.
- **Nol tes** untuk seluruh mekanisme ini.

### 6.6 Perubahan penurunan NIA

NIA menamai level **PW/PD**, jadi aturannya tidak bisa seragam:

- **PK** → yang menamai adalah **induknya**. Turunkan dari **induk**.
- **PD, PDLN, PW** → merekalah yang dinamai. Turunkan dari **kodenya sendiri**.
  Menurunkan PD dari induknya justru membuat nomor PD-nya jadi `00`.

Urutannya **dibalik, cadangannya dipertahankan** — khusus PK:

```
coba kode induk  →  gagal, mundur ke kode PK sendiri  →  gagal, throw (seperti sekarang)
```

PD/PDLN/PW **tidak disentuh**.

**Alasan memilih bentuk ini di atas "gagal keras":** ini jalur yang dilewati tiap
Kader baru di produksi, dan **nol pendaftaran yang hari ini berhasil boleh jadi
gagal**. Yang berubah cuma siapa yang ditanya lebih dulu — dan hari ini kedua arah
memberi jawaban identik, karena kode PK memang memuat kode PD-nya. Bedanya baru
muncul setelah pindah, dan di situ arah induk yang benar.

Kasus terdegradasi yang diterima sadar: PK yang sudah pindah tapi kode induk barunya
tidak terurai akan mundur ke kodenya sendiri dan salah lagi.

> **WAJIB MENYENTUH DUA TEMPAT.** Logika ini punya **dua salinan**:
> `src/lib/utils/member.ts` dan salinan tx-aware di
> `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts:110-145`.
> Yang menyentuh satu saja **melahirkan dua sistem penomoran yang berbeda.**

_Asal: [tiket 06](issues/06-pindah-induk-saat-penonaktifan.md), diamandemen
[tiket 11](issues/11-permukaan-pindah-induk.md)._

---

## 7. Invarian lapisan baca

**Tiap pembacaan atas tabel yang mereferensi `organization` wajib menyaring
Struktur Terhapus. Struktur Non-Aktif TIDAK disaring.**

Asimetri itu **inti aturannya**, dan ia wajib dipertahankan: Non-Aktif tetap
terlihat dari dalam dasbor beserta isinya, sementara Terhapus diperlakukan seolah
barisnya tidak pernah ada. Keputusan penelusuran di
[§8.3](#83-struktur-non-aktif-di-grid-dan-tabel) **bergantung padanya**.

Tujuh referensi yang tunduk padanya:

| Referensi | Catatan |
| --- | --- |
| `organization.parent_id` | Terhapus tidak boleh muncul sebagai anak |
| `member.organization_id` | lihat kasus konkret di bawah |
| `training.organization_id` | hampa oleh prasyarat, tetap disaring demi keseragaman |
| `article.organization_id` | pembacanya belum ada — lihat [§7.2](#72-situs-publik-per-struktur-belum-ada-sama-sekali) |
| `article_category.organization_id` | idem |
| `site_settings.organization_id` | idem |
| `user.connected_organization_id` | **pengecualian yang disengaja** |

**`user` dikecualikan.** Keadaan Akun sudah dijaga di
`readActiveSession`/`validateSession` ([§5.2](#52-seam-nya-di-readactivesession--validatesession)),
bukan oleh filter baca. Menyaring Terhapus dari pembacaan `user` justru akan
menyembunyikan baris Akun dari permukaan administratif yang perlu melihatnya.
**Gerbangnya di sesi; jangan tambahkan yang kedua di lapisan baca.**

Ini ditetapkan **sebagai aturan, bukan sebagai temuan**, karena bentuk ini sudah
terbukti gampang kelewat — dan pembaca yang belum lahir akan mewarisinya tanpa harus
menemukannya ulang.

### 7.1 Kasus konkret yang sudah ketahuan bocor

**`readMemberAggregates` bocor** (`src/db/query/member.ts:145-147`). Ia memancarkan
**satu baris per organisasi di subtree**, dikunci `organizationId`, terlepas dari
berapa Member yang menempel. Jadi Struktur Terhapus muncul sebagai **entri
berhitungan nol** — Struktur yang seharusnya tak terlihat, hadir di daftar.

**`readDescendantMembers` TIDAK bocor** (`src/db/query/member.ts:459-463`,
`:523`). Ia menyaring `m.deleted_at IS NULL`, dan prasyarat penghapusan menjamin
Struktur Terhapus punya **nol Member hidup** — jadi ia tidak menghasilkan satu
baris pun. **Jangan tambal di sana**; tambalan di tempat yang salah tidak menutup
apa pun.

Keduanya memakai `WITH RECURSIVE org_tree` yang menelusuri `parent_id` **tanpa satu
pun filter Keadaan**. Setelah invarian ini terpasang, `org_tree` menyaring
**Terhapus** dan **tetap meloloskan Non-Aktif** — sebab justru pelolosan itu yang
membuat [§8.3](#83-struktur-non-aktif-di-grid-dan-tabel) sah: Kader di bawah sebuah
PD Non-Aktif **tetap terbaca dari daftar Kader PW induknya**, teragregasi ke atas.

### 7.2 Situs publik per-Struktur belum ada sama sekali

Diperiksa, dan permukaannya **belum dibangun**:

- `(main)` di-hardwire ke PP lewat `resolvePPOrgId` → `readOrganizationIdByType('pp')`
  (`src/app/(main)/_data/site-settings.ts`).
- `proxy.ts` hanya `matcher: '/dashboard/:path*'` — nol perutean per-tenant, nol
  subdomain, nol slug Struktur di rute publik.
- `/berita` masih **stub**: "Belum ada konten." (`src/app/(main)/berita/page.tsx:30`).

Jadi **nol Artikel milik siapa pun terbaca publik hari ini**, dan satu-satunya
Struktur yang punya situs publik adalah PP — yang
[§2.3](#23-sel-yang-wajib-dinyatakan-bukan-disimpulkan) sudah pastikan tidak bisa
dinonaktifkan oleh siapa pun.

Klausa **"Struktur Non-Aktif → situs publiknya mati total, artikelnya ikut 404"**
tetap berdiri sebagai **invarian yang diwarisi** lewat aturan di atas — tapi ia
invarian untuk permukaan yang belum ada. **Tidak ada yang perlu dirancang di sini**,
dan membangun situs publik per-Struktur ada di [§10](#10-di-luar-cakupan).

_Asal: [tiket 10](issues/10-nasib-publikasi-struktur-terhapus.md), mengoreksi
[tiket 08](issues/08-permukaan-hapus-nonaktif-pulihkan.md)._

---

## 8. Permukaan

Empat permukaan. Keputusan desainnya **sudah diambil** — bagian ini menuliskannya,
bukan membuka ulang.

Satu aturan gate yang berlaku untuk keempatnya: **kemampuan dihitung sekali di
server per baris, lalu diturunkan sebagai bendera.** Kartu, kolom tabel, dan item
sheet merender afordansi dari bendera itu dan **tidak pernah menurunkannya sendiri
dari `role`**. Sumbernya `canManageKestrukturan` ([§2.5](#25-bentuk-gate)), yang
memang fungsi murni sehingga bisa dipanggil per baris tanpa I/O.

> **Kebocoran yang aturan ini tutup:** `canManage` (`branches-grid.tsx:34`) hari ini
> berbunyi `userRole === 'bpw' || userRole === 'root'` — **peran saja, nol Cakupan,
> nol cek Jenjang** — dan ia hanya menyembunyikan tombol Tambah. Pensil Edit
> (`branch-card.tsx:46-57`) dan tombol aksi di tabel (`columns.tsx:104-133`) **tidak
> di-gate sama sekali**. `columns.tsx` menerima `onEdit` opsional tanpa gate apa pun;
> ia ikut memakai bendera yang sama, supaya grid dan tabel tidak punya dua aturan
> berbeda.

### 8.1 `Profil <nama Struktur>` — `/dashboard/organization`

Halaman BPH untuk menyunting identitas Strukturnya sendiri. `/dashboard/branches`
menampilkan **anak-anak** dari Struktur yang dibuka — form Edit di sana selalu
mengedit anak, tidak pernah dirinya sendiri.

**Rute:** `/dashboard/organization`.

- `user/` gugur — ia menyatakan kepemilikan yang keliru: Struktur dipegang bersama
  sampai empat Akun, jadi ia bukan milik Akun mana pun.
- `branches/saya` gugur atas dasar teknis — `branches/[[...slug]]` itu catch-all
  opsional, dan menaruh segmen statis di sebelahnya menciptakan dua aturan rute yang
  harus diingat bersamaan. Lagi pula `branches` itu penjelajah pohon sementara
  halaman ini editor satu baris.
- `kepengurusan` gugur mengikuti keputusan nama di bawah.

**Nama entri menu:** **`Profil <nama Struktur>`**, dinamis — mis. "Profil PW KAMMI
NTB". Letaknya di dropdown Akun kiri-bawah sidebar (`nav-user.tsx:93`),
bersebelahan dengan Akun dan Notifikasi. **Hanya BPH yang melihatnya.**

- "Struktur Saya" ditolak: ia berdiri persis di sebelah "Akun Saya" dengan pola nama
  identik, sementara `CONTEXT.md:24` justru menegaskan Akun ≠ Struktur. Pola "—
  Saya" yang kembar membuat dua benda beda kelas terbaca sekeluarga.
- **"Kepengurusan" ditolak dan istilahnya dicadangkan** untuk permukaan daftar
  pengurus yang belum dibangun ([§10](#10-di-luar-cakupan)). Ini fakta domain, bukan
  preferensi: **jangan pakai kata "Kepengurusan" untuk menamai apa pun yang lain.**

**Panjang nama ditangani, bukan diabaikan.** Panel dropdown `min-w-56`, dan nama
seperti "Pengurus Komisariat Universitas Indonesia" pasti terpotong. Keputusannya
**satu baris, biarkan `truncate`**, dengan `title` berisi nama utuh — bukan item dua
baris. Sebabnya: nama utuhnya **sudah terbaca dua baris di atas**, di header
dropdown yang sudah ada (`nav-user.tsx:146-149`, diisi
`connectedOrganization.name` lewat `app-sidebar.tsx:154`). Pemotongan di sini tidak
menghilangkan informasi apa pun, dan keseragaman tinggi antar item dropdown terjaga.
`truncate` juga sudah jadi idiom komponen itu sendiri.

Judul halamannya memakai bentuk **utuh tanpa potong**: "Profil PW KAMMI NTB".

**Konsekuensi yang ikut dikerjakan:** menu itu sekarang campur bahasa — "Account /
Notifications / Log out" berbahasa Inggris sementara judul halamannya "Pengaturan
Akun". Entri baru ini berbahasa Indonesia, jadi tetangganya **diseragamkan** jadi
**"Akun", "Notifikasi", "Keluar"**.

**Isi halaman: blok identitas + form, titik.**

```
┌──────────────────────────────────────────────┐
│  [logo]   PW KAMMI NTB                       │
│           PW · 19.PW-NTB                     │   ← mono untuk code
│           di bawah PP KAMMI                  │
├──────────────────────────────────────────────┤
│  Nama Struktur   [ PW KAMMI NTB          ]   │
│  Slug            [ pw-kammi-ntb          ]   │
│                  Mengubah slug mematahkan     │
│                  tautan publik yang lama.     │
│  Logo            [ unggah ]                   │
│                              [ Simpan ]       │
└──────────────────────────────────────────────┘
```

- **`code`, Jenjang, dan induk ditampilkan — tapi bukan sebagai kontrol form.**
  Mereka naik jadi **blok identitas** di kepala halaman. `code` pakai **mono**,
  sesuai DESIGN.md ("Do use the Mono font for IDs, NIKs, and status codes").
  - "Input disabled + gembok" **ditolak**: input mati terbaca sebagai "kamu kurang
    izin", padahal `code`/`type`/`parentId` beku selamanya untuk **semua orang, Root
    termasuk** — dan PRODUCT.md menyebut sebagian penggunanya gaptek.
  - "Sembunyikan total" juga **ditolak**: `code` menurunkan Nomor Induk tiap Kader di
    bawahnya, dan `/dashboard/branches` hanya menampilkan **anak** — jadi tanpa
    halaman ini BPH tidak punya satu pun tempat untuk melihat kodenya sendiri.
  - Hasilnya: **form berisi tiga field, ketiganya hidup. Nol kontrol mati.**
- **Tanpa hitungan anak, tanpa hitungan Kader, tanpa daftar Akun terhubung.**
  Alasannya bukan ongkos (lihat di bawah) melainkan peran: halaman ini
  **administrasi diri sendiri, bukan monitoring** — dan dua tempat yang menampilkan
  angka yang sama adalah dua tempat yang suatu hari menampilkan angka berbeda.
  Daftar Akun terhubung ditolak dengan alasan tambahan: ia memancing pertanyaan yang
  belum satu pun keputusan jawab (boleh tidak BPH mengundang atau mencabut Akun?),
  dan daftar yang hanya bisa dilihat adalah pajangan yang menimbulkan pertanyaan
  tanpa menjawabnya. **Menambahkan angka nanti itu murah; mencabut angka yang sudah
  dilihat orang itu mahal.**
- **Keadaan Struktur tidak ditampilkan sama sekali** — nol badge, nol toggle, nol
  penjelasan. Bukan sekadar "`isNonActive` tidak boleh disentuh": Akun kepengurusan
  Struktur Non-Aktif berhenti bisa dipakai ([§5.4](#54-akun-kader-tidak-ikut-mati)),
  dan BPH adalah Akun kepengurusan — jadi halaman ini **hanya pernah dirender untuk
  Struktur Aktif**. Sebuah badge di sini akan selamanya menampilkan satu nilai yang
  sama.

**Ongkos data: nol query tambahan.** Sesi sudah membawa seluruh Struktur terhubung —
`id, name, slug, code, codeSlug, type, level, logo, parentId, isNonActive`
(`src/db/query/cte/user.ts:16-27`). Yang berbayar hanya **nama induk** (1 join).

**Keadaan dan galat:**

| Kejadian | Perlakuan |
| --- | --- |
| Slug bentrok (`23505`) | galat **di field slug**, bukan toast — ia bisa diperbaiki di tempat |
| Mengubah slug mematahkan URL publik lama | **tidak diblokir**; peringatan tenang di `FieldDescription`, bukan dialog. Ini konsekuensi wajar, bukan kesalahan |
| Akun tanpa Struktur terhubung | ada di data (`app-sidebar.tsx:154` punya cadangan `'No Organization'`). Gate menolaknya; menunya tidak muncul |
| Sukses | toast (`sonner`), pola yang sudah ada di `add-form` |
| Logo | `~/components/image-upload` apa adanya, termasuk pembersihan berkas yatim saat batal (pola `add-form.tsx:77-83`) |

_Asal: [tiket 07](issues/07-permukaan-struktur-saya.md)._

### 8.2 Sheet Struktur — `BranchManagementSheet`

Seluruh aksi atas satu Struktur tinggal di sheet yang **sudah ada**. **Kartu tidak
berubah sama sekali — nol tombol baru.**

Tiga tingkat, dari atas ke bawah:

```
┌─ BranchManagementSheet ──────────────────────┐
│  1  Form: nama, slug, logo                   │
│  ───────────────────────────────────────────  │
│  2  Pemindahan   [ Pindahkan induk ]         │  ← netral, bisa dibalik
│  ───────────────────────────────────────────  │
│  3  Zona Berbahaya                            │
│       Nonaktifkan  — <satu kalimat akibat>    │
│       Hapus        — <satu kalimat akibat>    │
└──────────────────────────────────────────────┘
```

**Kenapa sheet, bukan kartu.** Tiga hal beres sekaligus:

- **Kartunya tidak jadi sesak.** Ia sudah memuat badge, pensil, nama, chevron, kode,
  dan sub-struktur (`branch-card.tsx`). Tiga ikon aksi berdempet di sana akan menaruh
  aksi paling destruktif sebagai **sasaran sentuh terkecil**.
- **Prasyaratnya muat sebagai kalimat utuh.** "Tidak bisa dihapus: masih ada 847
  Kader dan 3 Komisariat" ditulis utuh di sheet, bukan diperas jadi tooltip pada item
  menu yang mati — **tooltip pada item disabled sulit dijangkau keyboard maupun
  sentuhan**.
- **Ongkos datanya bubar.** Hitungan Kader dan Daurah dibaca **saat sheet dibuka
  untuk satu Struktur**, bukan untuk 12 kartu sekaligus. `childrenCount` malah sudah
  dibaca hari ini (`branch-card.tsx:82-89`), jadi yang benar-benar baru cuma dua
  agregat untuk satu baris, on demand.

Ini juga sejalan dengan DESIGN.md: _"Don't use modals as the first thought for data
entry; prefer inline rows or slide-over sheets."_

**Hapus dan Nonaktifkan dibedakan lewat urutan dan penjelasan, bukan warna.**
Nonaktifkan lebih dulu (yang lebih sering dipakai), Hapus di bawahnya, masing-masing
dengan **satu kalimat akibat** di sebelah tombolnya.

**Pemindahan duduk di tier sendiri, di atas Zona Berbahaya.** Ia tidak merusak apa
pun dan dibalik dengan aksi yang sama persis — bukan tetangga sekelas Hapus dan
Nonaktifkan, jadi tidak duduk di kotak yang sama. (Gerbangnya tetap sama berat;
lihat di bawah.)

#### Gerbang: ketik `code`, untuk ketiganya

Repo sudah punya idiom destruktifnya: **AlertDialog + ketik-untuk-konfirmasi**
(`delete-member-button.tsx:83-101`). Yang diketik adalah **`code`**, mono, seperti
`registerNumber` di sana.

> **Ini pilihan pengguna, dua kali, menolak usulan agen.**
> Untuk **Hapus**: agen mengusulkan gerbang lebih ringan (alasan: Hapus hanya boleh
> saat Struktur kosong total, jadi ia menghancurkan nol hal dan bisa dipulihkan).
> Untuk **Pindah induk**: agen mengusulkan kelas ketiga tanpa ketik-untuk-konfirmasi
> (alasan: gesekan seharusnya menandai **tak terpulihkan**, bukan sekadar
> **penting**).
> Yang menang dua-duanya: **satu bentuk gerbang untuk seluruh aksi di sheet** —
> konsisten dengan preseden repo, dan tidak menuntut siapa pun menilai sendiri mana
> yang lebih berbahaya. Jangan dibuka ulang saat implementasi.

#### Isi dialog **Nonaktifkan** — tiga hal, wajib terbaca sebelum tombolnya bisa ditekan

1. **Empat Akun kepengurusan berhenti bisa dipakai. Akun Kader tetap hidup.**
2. **Situs publiknya mati — artikelnya ikut 404**, bukan sekadar hilang dari daftar.
3. **Sistem tidak memberi tahu mereka.** Login yang ditolak berbunyi "Username atau
   password salah", sama persis dengan password yang salah. **Yang menonaktifkan
   wajib memberi tahu orangnya di luar sistem.**

#### Isi dialog **Pindahkan induk**

- **Konteks mati di kepala dialog**, bukan pilihan: "Dalam PW DKI Jakarta". PW
  sepenuhnya ditentukan oleh Struktur yang dipindahkan
  ([§6.2](#62-batas-calon-induk-pwcode-tidak-boleh-berubah)) — menawarkan pilihan
  yang jawabannya hanya satu bukan keluwesan, itu kebingungan.
- **Akibat NIA, yang tidak akan ditebak siapa pun:**

  > Kader yang didaftarkan **sesudah** ini mendapat Nomor Induk dengan kode induk
  > yang baru. Kader yang sudah terdaftar **tidak berubah sama sekali** — nomornya
  > permanen.

- Ditambah satu baris bahwa pemindahan **dapat dibalik kapan saja**. Itu
  satu-satunya kalimat yang membedakan dialog ini dari dua tetangganya di Zona
  Berbahaya, dan ia memikul seluruh beban pembedaan setelah gerbangnya diseragamkan.

**Keadaan kosong — ada tepat satu, dan ia nyata.** Untuk PK di bawah PD, daftar calon
induk **tidak pernah kosong**: PW-nya sendiri selalu sah, bahkan ketika ia
satu-satunya PD di wilayah itu. Yang bisa benar-benar kosong hanya **PK di bawah PDLN
ketika PDLN itu satu-satunya yang ada** — naik ke PP tidak tersedia, sebab PP bukan
induk yang sah untuk PK dan `pwCode` akan pecah. Keadaan kosongnya **harus mengatakan
sebabnya apa adanya**, bukan menampilkan pemilih kosong: _tidak ada Struktur lain
yang bisa menerimanya tanpa mengubah Nomor Induk Kader-nya._

#### Penolakan wajib memuat jalan keluarnya

Dua penolakan menuntun ke pemindahan, dan keduanya wajib **memuat tautannya** —
bukan sekadar menyebut pemindahan sebagai saran:

| Penolakan | Jalan keluar yang wajib ditawarkan |
| --- | --- |
| **Penonaktifan ditolak** karena masih ada anak Aktif | **pintasan "Pindahkan semua Komisariat Aktif ke PW"**, plus jalan ke pemindahan satuan |
| **Pengaktifan kembali ditolak** karena induknya Non-Aktif | jalan ke pemindahan satuan Struktur itu sendiri |

Aturan cermin ([§6.4](#64-aturan-cermin-menghidupkan-anak-menuntut-induk-yang-hidup))
berarti kedua penolakan diselesaikan oleh satu permukaan yang sama. **Yang menemui
jalan buntu harus menemukan pintunya di layar yang sama, bukan mencarinya.**

**Tentang pintasan massal.** Aksi dasarnya tetap **satu Struktur satu kali** — itu
yang dipakai hampir selalu. Pintasan ditambahkan hanya di tempat sakitnya, dan ia
dipilih bukan karena paling canggih tapi karena **ia tidak pernah bisa gagal**: tiap
anak sebuah PD berada di PW itu, dan PW selalu calon induk yang sah untuk semuanya.
Nol kasus gagal, nol validasi per baris.

Sifatnya **penitipan, bukan penempatan** — ia memindahkan lima PK ke PW supaya PD yang
bubar bisa dinonaktifkan hari ini, lalu siapa pun menempatkan ulang satu per satu
kemudian. Itu sebabnya "permukaan pindah massal penuh dengan satu pemilih tujuan"
ditolak: lima PK sebuah PD yang bubar biasanya tersebar geografis, dan **satu tujuan
untuk semua adalah jawaban yang salah yang terasa efisien**.

**Pintasan massal adalah satu aksi, jadi satu gerbang.** Yang diketik adalah `code`
**PD sumbernya, sekali** — bukan lima kode anak satu per satu. Melipatgandakan
gesekan lima kali akan mengembalikan persis rasa hukuman yang pintasan itu ada untuk
menghapusnya.

_Asal: [tiket 08](issues/08-permukaan-hapus-nonaktif-pulihkan.md) dan
[tiket 11](issues/11-permukaan-pindah-induk.md)._

### 8.3 Struktur Non-Aktif di grid dan tabel

**Kartunya diredupkan**, badge Jenjang-nya **didampingi penanda Non-Aktif**, dan
**chevron serta tautan ke anaknya mati** — penelusuran berhenti padanya.

Ini sempat terlihat menabrak `CONTEXT.md` ("ia dan seluruh isinya tetap terlihat dari
dalam dasbor"). **Diperiksa di kode, dan tidak menabrak:** janji "seluruh isinya tetap
terlihat" ditepati oleh **permukaan Kader**, lewat agregasi ke induk
([§7.1](#71-kasus-konkret-yang-sudah-ketahuan-bocor)) — ia tidak pernah merupakan
janji tentang pohon `branches`.

Dua fakta membuat penelusuran ke dalam Struktur Non-Aktif **nyaris tidak berguna**:

- **Di bawah Struktur Non-Aktif tidak pernah ada Struktur Aktif** — seluruh anak
  Aktif wajib dipindah atau dinonaktifkan lebih dulu
  ([§6.4](#64-aturan-cermin-menghidupkan-anak-menuntut-induk-yang-hidup)).
- **Menghidupkan anak menuntut induknya hidup.** Jadi tidak ada alur perbaikan yang
  menuntut masuk ke dalam Struktur Non-Aktif — induknya harus dihidupkan lebih dulu,
  dan saat itu jalurnya terbuka sendiri.

_Asal: [tiket 08](issues/08-permukaan-hapus-nonaktif-pulihkan.md)._

### 8.4 Permukaan Struktur Terhapus — `/dashboard/branches/terhapus`

**Permukaan berdiri sendiri**, bukan filter di `/dashboard/branches`. Rutenya boleh
dinamai lain, tapi ia **rute tersendiri**.

Untuk **Root dan BPW PP** ([§2.5](#25-bentuk-gate) soal bentuk gate-nya, yang paling
gampang salah).

**Kenapa berdiri sendiri, bukan filter.** Ia bertumpu pada invarian
[§7](#7-invarian-lapisan-baca): tiap pembacaan menyaring Terhapus. Cara teraman
menjaga invarian itu adalah punya tepat **satu** fungsi baca yang **sengaja
melakukan kebalikannya**, dipakai oleh tepat satu permukaan. Filter berbasis peran di
`/dashboard/branches` justru **melubangi invarian itu di halaman yang paling sering
dibaca** — dan lubang di permukaan tersibuk adalah lubang yang paling mahal.

**Konsekuensi menyenangkan: Keadaan itu sendiri adalah permukaannya.** Kalau seluruh
isi halaman ini Terhapus, Terhapus dan Non-Aktif **tidak pernah muncul
bersebelahan** — jadi **nol bahasa visual baru** untuk membedakan keduanya, dan
kekhawatiran "dua Keadaan yang dibedakan hanya oleh gradasi opasitas" tidak pernah
terjadi.

**Tiap baris wajib menampilkan:** nama, `code` (mono), Jenjang, dan **induk lamanya**.
Induk bukan hiasan — ia yang menentukan urutan pemulihan.

#### Pemulihan

**Gerbangnya konfirmasi biasa, bukan ketik-`code`.** Pemulihan **tidak** ikut pola
sheet: ia bukan aksi di sheet Struktur, ia satu-satunya aksi di permukaan yang
seluruh isinya sudah Terhapus, dan ia **memulihkan** alih-alih menghilangkan.

**Tabrakan slug: cek saat dibuka, eskalasi jadi form.**

| Keadaan slug | Perlakuan |
| --- | --- |
| bebas | konfirmasi biasa, satu klik |
| sudah dipungut | **dialog yang sama berubah jadi form** — menyebut siapa yang sekarang memakainya, lalu menyodorkan field slug terisi usulan |

Yang dibeli: pelakunya melihat masalahnya **sebelum** menekan, bukan sesudah.

- **Sufiks otomatis ditolak** — ia mengubah URL diam-diam tanpa ada yang memutuskan,
  dan menyembunyikan justru informasi yang menjelaskan kenapa Struktur ini dulu
  dihapus.
- **"Selalu form" ditolak** — membebani jalur mulus yang jauh lebih sering.

**Server tetap wajib menangani `23505`.** Ada jeda antara cek saat dialog dibuka dan
simpan saat tombol ditekan, dan slug bisa berpindah tangan di dalam jeda itu. Galatnya
mendarat **di field slug** — **pola yang sama persis dengan
[§8.1](#81-profil-nama-struktur--dashboardorganization)**. Dua kegagalan dengan sebab
identik tidak dijelaskan dengan dua cara berbeda; yang berbeda hanya salinannya, sebab
di sini pemilik barunya memang ada dan bisa dinamai.

#### Pemulihan menuntut induk yang hidup — ditolak **dengan langkah berikutnya**

| Keadaan induk | Penolakannya berbunyi |
| --- | --- |
| **Non-Aktif** | jalan keluarnya sudah ada: aktifkan induknya, atau pindahkan Struktur ini ke induk yang hidup ([§8.2](#82-sheet-struktur--branchmanagementsheet)) |
| **juga Terhapus** | induk itu ada di **permukaan yang sama ini** — penolakannya **menyebut namanya dan menautkannya ke barisnya**, supaya urutan pemulihan terbaca tanpa harus dicari |

**Pemulihan berantai otomatis ditolak.** Memulihkan induk sekaligus seluruh
keturunannya adalah perubahan keadaan massal yang tidak diminta. Root dan BPW PP
memulihkan **dari atas ke bawah, satu per satu**, dengan permukaan yang menunjukkan
urutannya.

#### Keadaan kosong

**Nol Struktur Terhapus adalah keadaan normal dan sehat, bukan kegagalan** —
penghapusan memang untuk salah catat, dan salah catat memang jarang. Keadaan kosongnya
**harus berbunyi begitu**, bukan "tidak ada data ditemukan".

_Asal: [tiket 12](issues/12-permukaan-root-pulihkan.md)._

---

## 9. Yang implementasi akan tabrak

Bagian ini ada supaya tidak ada kejutan. Ketiganya **diketahui, dan sengaja tidak
diselesaikan oleh peta ini**.

### 9.1 CI memakai PostgreSQL 16, migrasi dasarnya butuh PG 18+

`.github/workflows/ci.yml` memakai `postgres:16`, sementara migrasi dasar repo ini
memanggil `uuidv7()` yang butuh **PG 18+**. Dua-duanya tidak bisa benar.

Ini terbukti **soal CI-nya, bukan soal migrasinya**: seluruh migrasi yang ada hari ini
**sudah dijalankan dari nol sampai bersih** di basis data staging, dan **servernya PG
18+** — `uuidv7()` jalan. Seluruh 199 tes repo juga hijau terhadapnya.

Selama belum diluruskan, **migrasi peta ini tidak bisa diuji di CI**. Diselesaikan di
tiket implementasi, bukan di sini.

### 9.2 Gladi bersih migrasi belum dijalankan untuk yang lahir dari peta ini

Ada basis data remote kosong yang meniru bentuk produksi. Ia **bukan tanpa guna** — ia
justru target yang tepat untuk melatih migrasi peta ini sampai bersih sebelum menyentuh
produksi.

Yang belum digladi: `deleted_at` dan kolom jejak, kolom Keadaan `generatedAlwaysAs`
beserta `SET NOT NULL` tangannya, partial unique index, dan pencabutan cascade.
Diselesaikan di tiket implementasi.

### 9.3 Bentuk tesnya — sekarang bisa dinyatakan

Nol tes untuk seluruh permukaan ini hari ini. Empat lapis, dan seam-nya sudah
ditentukan oleh keputusan-keputusan di atas:

| Lapis | Bentuk | Seam |
| --- | --- | --- |
| **Matriks** | tabel argumen-ke-hasil, **nol fixture** | `canManageKestrukturan` — fungsi murni, itu sebabnya ia dibuat murni |
| **Gate async** | tes seam, pola `src/lib/auth/kekaderan.test.ts` | tiga gate di `kestrukturan.ts` + gate `pulihkan` |
| **Transisi Keadaan** | tabel [§1.5](#15-tabel-transisi) jadi daftar kasus | jalur aksi (nonaktifkan / aktifkan / hapus / pulihkan) |
| **Penurunan NIA** | unit, **dua salinan** ([§6.6](#66-perubahan-penurunan-nia)) | `resolveOrgCodes` dan `generateRegisterNumber` |

`kestrukturan.test.ts` yang sudah ada (17 tes untuk dua gerbang sempit) **dirombak**
bersama [§2.6](#26-yang-menggantikan-tambalan-keamanan-yang-sudah-ada) — ia sekaligus
membuktikan pola seam `kekaderan.test.ts` jalan untuk permukaan ini.

> **Peringatan operasional:** tes lokal repo ini menghantam satu basis data remote
> bersama. Konfirmasi ke pengguna sebelum menjalankan `bun test`.

---

## 10. Di luar cakupan

Tidak dikerjakan oleh spec ini, dan **bukan karena terlupa**.

| Yang dikeluarkan | Kenapa |
| --- | --- |
| **Memindahkan Kader antar-Struktur** | operasi atas **Kader**, bukan atas Struktur. Menyeret pertanyaan yang tidak satu pun keputusan di sini menyentuh: apakah NIA ikut berubah, apakah riwayat Daurah ikut, siapa yang berwenang. Layak petanya sendiri — dan [§6.3](#63-pd-tidak-pindah-antar-pw) menunggu permukaannya |
| **Tembok 1000 di penomoran NIA** | nomor urut `padStart(3)` sementara urutannya dicari `orderBy(desc())` pada kolom **teks**, jadi begitu tembus `1000` teks `'999'` masih menang dan `nextSeq` mengulang selamanya. Per PW+PD+tahun, ditangkap `user.name` yang unique sehingga **gagal berisik, bukan diam**. Bug nyata di produksi, tapi soal **kekaderan**, bukan CRUD Struktur |
| **Situs publik per-Struktur** | belum ada sama sekali ([§7.2](#72-situs-publik-per-struktur-belum-ada-sama-sekali)). Invariannya sudah diwarisi lewat [§7](#7-invarian-lapisan-baca); membangun permukaannya fitur tersendiri |
| **Permukaan daftar pengurus** | soal **orang**, bukan CRUD Struktur. Yang mengikat dari sini cuma satu: **jangan pakai kata "Kepengurusan" untuk menamai apa pun yang lain** |
| **Membekukan satu Akun terlepas dari Strukturnya** | konsep berbeda dari Keadaan Akun turunan ([§5](#5-keadaan-akun)) |
| **Memecah peran `bpw` jadi tiga nilai enum** (`bpw`/`bpd`/`bpkom`) | Jenjang sudah tersimpan di Struktur yang terhubung, jadi informasinya tidak perlu diduplikasi. Menambah nilai enum di basis data produksi itu migrasi berisiko tanpa imbalan. "BPD" dan "BPKOM" murni **nama tampilan** yang dikarang saat Akun dibuat (`src/db/query/organization.ts:148-161`) |
| **Kebijakan penghapusan PP** | prasyarat menolaknya dalam praktik, tapi itu perlindungan yang kebetulan. Menjadikannya kebijakan tertulis adalah keputusan baru ([§2.3](#23-sel-yang-wajib-dinyatakan-bukan-disimpulkan)) |

---

## 11. Tiket implementasi

Dipecah jadi **17 tiket**, `13`–`29`, di `.scratch/manajemen-struktur/issues/`.
Blocking-nya ada di tiap berkas.

| # | Tiket | Rombongan |
| --- | --- | --- |
| 13 | Migrasi A: kolom Keadaan, kolom jejak, cabut cascade | Skema |
| 14 | Pra-terbang duplikat → `src/scripts/` | Skema |
| 15 | Migrasi B: partial unique index `slug` | Skema |
| 16 | Migrasi C: unique `code` | Skema |
| 17 | CI PostgreSQL 18 + gladi bersih migrasi | Skema |
| 18 | `canManageKestrukturan` + tiga gate + gate `pulihkan` | Otorisasi |
| 19 | Gerbang sesi: Struktur mati = sesi tidak ada | Otorisasi |
| 20 | Invarian lapisan baca: saring Terhapus | Otorisasi |
| 21 | Aksi nonaktifkan dan aktifkan kembali | Aksi |
| 22 | Aksi hapus | Aksi |
| 23 | Aksi pindah induk | Aksi |
| 24 | Penurunan NIA dari induk untuk PK — **dua tempat** | Aksi |
| 25 | `/dashboard/organization` — Profil `<nama Struktur>` | Permukaan |
| 26 | Sheet Struktur: bendera, tiga tier, dialog | Permukaan |
| 27 | Struktur Non-Aktif di grid dan tabel | Permukaan |
| 28 | Permukaan Struktur Terhapus + pemulihan | Permukaan |
| 29 | Tes seam dan transisi Keadaan | Tes |

**Urutan yang tidak boleh dibalik:** 24 sebelum 23 (penurunan NIA harus benar sebelum
pemindahan mungkin), 13 sebelum apa pun yang menyentuh Keadaan di data, 18 sebelum
permukaan mana pun, 14 sebelum 15 dan 16.

Tiap tiket permukaan wajib memanggil `/impeccable`, `/shadcn`, dan `base-ui-docs` —
repo ini memakai **BaseUI** sebagai lapisan primitif Shadcn, bukan RadixUI.
