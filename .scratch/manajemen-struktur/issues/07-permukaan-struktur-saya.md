# 07 — Permukaan "Struktur Saya"

**Type:** prototype
**Status:** resolved
**Blocked by:** 02

## Question

`/dashboard/branches` menampilkan **anak-anak** dari Struktur yang dibuka —
form Edit di sana selalu mengedit anak, tidak pernah dirinya sendiri. Padahal
BPH berhak menyunting Strukturnya sendiri, BPH ada sampai Jenjang PK, dan
halaman itu menolak PK mentah-mentah (`page.tsx:59`) sekaligus menolak Akun
level 3 ke bawah lewat `AccessGuard levelRequirement={2}` (`:131`).

Charting menetapkan permukaan baru di dropdown Akun di kiri bawah sidebar —
bersebelahan dengan "Akun Saya" (`/dashboard/user/account`) dan "Notifikasi",
di `_components/nav-user/nav-user.tsx:93`. **Hanya BPH yang melihat menunya**;
Kewenangan lain tidak melihatnya sama sekali.

Bikin prototipenya, lalu putuskan lewat reaksi terhadap benda konkret:

1. **Field mana yang tampil dan mana yang terkunci.** `code`, `type`, dan
   `parentId` terkunci mati. Yang belum diputuskan: field terkunci itu
   **ditampilkan sebagai teks mati** (jadi BPH tahu kodenya apa) atau tidak
   ditampilkan sama sekali. `isNonActive` tidak boleh muncul dalam bentuk apa
   pun yang bisa disentuh — sebuah kepengurusan tidak menyatakan dirinya
   berhenti berjalan.
2. **Apa lagi yang layak ada di sana.** Induk, jumlah anak, jumlah Kader,
   Akun-akun yang terhubung — atau justru menahan diri dan hanya menampilkan
   yang bisa disunting.
3. **Namanya.** "Struktur Saya" itu istilah kerja dari charting, bukan
   keputusan. Ia bersebelahan dengan "Akun Saya" di menu yang sama, dan Akun ≠
   Struktur (`CONTEXT.md:24`) — pastikan dua entri itu tidak terbaca sebagai
   hal yang sama.
4. **Rutenya.** `/dashboard/user/organization` mengikuti tetangganya, tapi
   `user/` di situ berarti "milik Akun ini" sementara Struktur dimiliki
   bersama oleh empat Akun. Putuskan.

**Masukan dari tiket 02 (sudah selesai).** Daftar bidangnya sudah tetap dan
bukan lagi bahan diskusi: BPH menyunting `name`, `slug`, dan `logo` — itu saja.
`code`, `type`, dan `parentId` **beku setelah pembuatan untuk semua Kewenangan,
Root termasuk**, jadi pertanyaan nomor 1 di atas murni soal tampil-atau-tidak,
bukan soal boleh-atau-tidak. Tiket 02 juga menitipkan satu gate yang belum
dibentuk: **hak BPH menyunting Strukturnya sendiri** — sasarannya selalu
Struktur si Akun, jadi bentuknya beda dari dua gate di
`src/lib/auth/kestrukturan.ts` dan tiket ini yang memutuskannya.

**Panggil `/impeccable`** — ini tiket desain, dan hierarki visual, keadaan
field terkunci, serta a11y-nya adalah isi tiketnya, bukan hiasan. **Panggil
`/shadcn` dan `base-ui-docs`** begitu komponen disebut; repo ini memakai BaseUI
sebagai lapisan primitif Shadcn, bukan RadixUI.

Prototipenya dibuang setelah dipakai — yang disimpan keputusannya, dan
tautannya dicatat di jawaban tiket.

## Answer

Prototipenya berupa mockup ASCII yang dipakai langsung sebagai bahan reaksi di
sesi (empat keputusan, tiga sampai empat opsi masing-masing). Tidak ada kode
yang ditulis — peta ini tidak menyentuh kode, dan `shape` memang berhenti
sebelum kode.

### Temuan kode yang mengubah bentuk keputusannya

**Halaman ini nyaris gratis.** Sesi sudah membawa seluruh Struktur terhubung —
`id, name, slug, code, codeSlug, type, level, logo, parentId, isNonActive`
(`db/query/cte/user.ts:16-27`). Jadi seluruh blok identitas dan ketiga field
yang bisa disunting **nol query tambahan**. Yang berbayar hanya nama induk
(1 join). Itu memindahkan pertanyaan "apa lagi yang layak ada" dari soal ongkos
jadi soal disiplin.

**Nama Struktur sudah tampil di dropdown.** `userData.email` diisi
`connectedOrganization.name` (`app-sidebar.tsx:154`) dan dirender ber-`truncate`
di header dropdown (`nav-user.tsx:146-149`), di panel `min-w-56`.

### 1. Field beku → blok identitas, bukan field

`code`, Jenjang, dan induk **ditampilkan**, tapi **tidak sebagai kontrol form**.
Mereka naik jadi **blok identitas** di kepala halaman: logo, nama, lalu
`Jenjang · code` dan `di bawah <induk>`. `code` pakai mono, sesuai DESIGN.md
("Do use the Mono font for IDs, NIKs, and status codes").

Opsi "input disabled + gembok" **ditolak**: input mati terbaca sebagai "kamu
kurang izin", bukan "field ini beku selamanya untuk semua orang, Root termasuk"
— dan PRODUCT.md menyebut sebagian penggunanya gaptek. Opsi "sembunyikan total"
juga ditolak: `code` menurunkan Nomor Induk tiap Kader di bawahnya, dan
`/dashboard/branches` hanya menampilkan **anak**, tidak pernah dirinya sendiri —
jadi tanpa halaman ini BPH tidak punya satu pun tempat untuk melihat kodenya
sendiri.

Hasilnya: **form berisi tiga field, ketiganya hidup. Nol kontrol mati.**

### 2. Isi halaman → identitas + form, titik

Tanpa hitungan anak, tanpa hitungan Kader, tanpa daftar Akun terhubung.

Alasannya bukan ongkos (lihat di atas) melainkan peran: halaman ini
**administrasi diri sendiri**, bukan monitoring — dan dua tempat yang menampilkan
angka yang sama adalah dua tempat yang suatu hari menampilkan angka berbeda.
Daftar Akun terhubung ditolak dengan alasan tambahan: ia memancing pertanyaan
yang belum satu pun tiket jawab (boleh tidak BPH mengundang atau mencabut Akun?),
dan daftar yang hanya bisa dilihat adalah pajangan yang menimbulkan pertanyaan
tanpa menjawabnya.

Menambahkan angka nanti itu murah; mencabut angka yang sudah dilihat orang itu
mahal.

### 3. Nama → `Profil <nama Struktur>`, dinamis

Contoh: **"Profil PW KAMMI NTB"**.

Tiga kandidat statis gugur. **"Struktur Saya"** ditolak karena berdiri persis di
sebelah "Akun Saya" dengan pola nama identik, sementara `CONTEXT.md:24` justru
menegaskan Akun ≠ Struktur — pola "— Saya" yang kembar membuat dua benda beda
kelas terbaca sekeluarga. **"Kepengurusan"** ditolak oleh pengguna dengan alasan
yang menambah kosakata: **istilah itu dicadangkan untuk permukaan daftar
pengurus** yang belum dibangun. Itu fakta domain baru, bukan preferensi.

Label dinamis menang karena ia tidak bisa dikelirukan dengan apa pun: ia
menyebut Strukturnya dengan namanya sendiri.

**Panjangnya ditangani, bukan diabaikan.** Panel dropdown `min-w-56`, dan nama
seperti "Pengurus Komisariat Universitas Indonesia" pasti terpotong. Keputusannya
**satu baris, biarkan `truncate`**, dengan `title` berisi nama utuh — bukan item
dua baris. Sebabnya: nama utuhnya sudah terbaca dua baris di atas, di header
dropdown yang sudah ada. Pemotongan di sini **tidak menghilangkan informasi apa
pun**, dan keseragaman tinggi antar item dropdown terjaga. `truncate` juga sudah
jadi idiom komponen itu sendiri (`nav-user.tsx:146-149`).

Judul halamannya memakai bentuk utuh tanpa potong: **"Profil PW KAMMI NTB"**.

**Konsekuensi yang harus ikut dikerjakan:** menu itu sekarang campur bahasa —
"Account / Notifications / Log out" berbahasa Inggris sementara judul halamannya
"Pengaturan Akun". Entri baru ini berbahasa Indonesia, jadi tetangganya
**diseragamkan** jadi "Akun", "Notifikasi", "Keluar".

### 4. Rute → `/dashboard/organization`

`user/` gugur karena ia menyatakan kepemilikan yang keliru: Struktur dipegang
bersama sampai empat Akun, jadi ia bukan milik Akun mana pun.
`/dashboard/branches/saya` gugur atas dasar teknis — `branches/[[...slug]]` itu
catch-all opsional, dan menaruh segmen statis di sebelahnya menciptakan dua
aturan rute yang harus diingat bersamaan; lagi pula `branches` itu penjelajah
pohon sementara halaman ini editor satu baris. `/dashboard/kepengurusan` gugur
mengikuti keputusan nomor 3.

### 5. Gate — titipan tiket 02, sekarang berbentuk

Bentuknya **beda dari dua gate di `kestrukturan.ts`** karena ia **tidak menerima
sasaran**: sasarannya selalu Struktur si Akun sendiri. Jadi ia bukan
`canManage(target)` melainkan gate tanpa argumen yang **mengembalikan Struktur
itu** — satu panggilan melayani otorisasi sekaligus pembacaan data halaman, nol
pembacaan kedua.

Dinamai untuk hak yang diberikannya, sesuai AGENTS.md — bukan untuk tindakan
memeriksanya. Lolos hanya untuk **BPH**; Kewenangan lain tidak melihat menunya
dan tidak bisa membuka rutenya. Root tidak butuh jalan ini — ia sudah menyunting
Struktur mana pun lewat `branches`.

### 6. Keadaan Struktur tidak perlu ditampilkan sama sekali

Bukan sekadar "`isNonActive` tidak boleh disentuh" — ia **tidak pernah perlu
dilihat di sini**. Tiket 05 menetapkan Akun kepengurusan Struktur Non-Aktif
berhenti bisa dipakai, dan BPH adalah Akun kepengurusan. Jadi halaman ini
**hanya pernah dirender untuk Struktur Aktif**; sebuah badge Keadaan di sini akan
selamanya menampilkan satu nilai yang sama. Nol badge, nol toggle, nol
penjelasan.

### Keadaan dan galat yang dimiliki halaman ini

- **Slug bentrok saat disunting — jalur ketiga yang tiket 03 tidak hitung.**
  Tiket 03 memetakan dua momen tabrakan partial unique index: pembuatan (sah,
  tidak gagal) dan pemulihan (gagal di `UPDATE`, diserahkan ke tiket 08). BPH
  menyunting slug di halaman ini adalah **momen ketiga** — `UPDATE` yang bisa
  kena `23505` melawan slug Struktur hidup lain. Wajib mendarat sebagai
  **galat di field slug**, bukan toast, karena ia bisa diperbaiki di tempat.
- **Mengubah slug mematahkan URL publik yang lama.** Tidak diblokir — charting
  sudah membebaskan `slug` — tapi diberi peringatan tenang di `FieldDescription`,
  bukan dialog. Ini konsekuensi yang wajar, bukan kesalahan.
- **Akun tanpa Struktur terhubung.** Ada di data (`app-sidebar.tsx:154` punya
  cadangan `'No Organization'`). Gate menolaknya; menunya tidak muncul.
- **Sukses** memakai pola yang sudah ada di repo: toast (`sonner`), seperti
  `add-form`.
- **Logo** memakai `~/components/image-upload` apa adanya, termasuk pembersihan
  berkas yatim saat batal — pola itu sudah ada di `add-form.tsx:77-83`.

### Yang sengaja tidak diputuskan di sini

Permukaan **daftar pengurus** yang memesan nama "Kepengurusan". Ia muncul dari
sesi ini sebagai istilah yang dicadangkan, bukan sebagai pekerjaan — dan ia soal
**orang**, bukan soal CRUD Struktur. Dicatat di Out of scope peta.
