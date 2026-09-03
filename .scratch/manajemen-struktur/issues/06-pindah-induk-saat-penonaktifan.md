# 06 — Pindah induk saat penonaktifan: apa yang ikut pindah

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Aturan penonaktifan mensyaratkan Struktur anak **dipindahkan** lebih dulu,
kecuali anak itu sudah Non-Aktif. Pemindahan itu tidak ada di kode: `parentId`
di form adalah hidden input yang selalu berisi Struktur yang sedang dibuka
(`branches/_components/add-form/add-form.tsx:98`), jadi tidak ada cara
memindahkan apa pun hari ini.

Charting menarik pemindahan ini masuk cakupan **hanya dalam bentuk terbatas**:
pemindahan yang dipicu penonaktifan induk. Bentuk umumnya — pemekaran daerah,
koreksi salah tempat — tetap di luar cakupan. Tiket ini harus menjaga batas
itu tetap tegak, karena godaannya besar untuk melebar.

Yang harus terjawab:

1. **Apa yang ikut pindah.** Member yang terdaftar di Komisariat itu ikut
   berpindah ke PD baru, atau tetap tercatat di Komisariatnya (yang memang
   tidak berubah — yang berubah induknya)? Kemungkinan besar yang kedua, dan
   kalau begitu pertanyaannya jadi jauh lebih ringan dari yang terlihat.

2. **Nomor Induk Anggota yang sudah terbit.** Nomor Induk tersusun dari
   Struktur tempat Kader terdaftar (`CONTEXT.md:51`) — Komisariatnya, bukan
   induknya. Kalau benar begitu, memindahkan induk tidak menyentuh satu pun
   Nomor Induk, dan itu harus dinyatakan terang supaya tidak dikhawatirkan
   ulang tiap sesi. **Periksa ke kode, jangan simpulkan dari glosarium.**

3. **Daurah lampau.** Daurah dicatat menempel ke Struktur penyelenggara
   (`db/schema/training.sql.ts:21`, tanpa cascade). Riwayatnya ikut terbaca di
   bawah induk baru — itu benar secara historis, atau menyesatkan?

4. **Batas pemindahan.** Sasaran induk baru harus se-Jenjang dengan induk lama
   (PK hanya pindah ke PD/PDLN lain), dan harus dalam Cakupan siapa? BPW PP
   memindahkan lintas wilayah, atau BPKom PD hanya di dalam daerahnya sendiri
   — padahal PD tujuan justru bukan Cakupannya.

5. **Alurnya seperti apa.** Pemindahan sebagai langkah wajib **di dalam** alur
   penonaktifan, atau aksi berdiri sendiri yang kebetulan jadi prasyarat?
   Pilihan pertama menjaga batas cakupan tetap sempit; pilihan kedua lebih
   jujur tapi praktis melahirkan fitur pindah-induk umum lewat pintu belakang.

Kalau sesi ini menyimpulkan bentuk terbatasnya tidak masuk akal tanpa bentuk
umumnya, **katakan** — itu temuan yang sah, dan konsekuensinya peta ini harus
menunggu peta pindah-induk, bukan menyelundupkannya.

## Answer

> **Judul berkas ini sudah lebih sempit dari isinya.** Tiket ditutup dengan
> pemindahan sebagai **aksi berdiri sendiri**, bukan langkah di dalam alur
> penonaktifan. Batas peta ikut digeser — lihat poin 5.

### 1. Nol baris ikut pindah

Yang berubah **hanya `organization.parentId` milik Struktur yang dipindahkan** —
satu kolom, satu baris. `member.organizationId`
(`db/schema/member.sql.ts:25-28`) dan `training.organizationId`
(`db/schema/training.sql.ts:18-21`) dua-duanya menunjuk Komisariat, bukan
induknya, jadi Member dan Daurah tidak ke mana-mana.

Daurah lampau **tidak** menyesatkan setelah pindah: ia tetap tercatat
diselenggarakan oleh Komisariat itu, dan pernyataan itu tetap benar. Yang
berubah cuma di bawah Daerah mana ia terbaca hari ini — cerminan keadaan
sekarang, bukan klaim tentang masa lalu.

### 2. Riset ulang mekanisme NIA — dan invarian yang tidak pernah ditulis

Diminta eksplisit oleh pengguna, dan hasilnya membalik premis pertanyaan nomor 2
di badan tiket.

**Bentuknya 11 karakter:** `[PW 2][PD 2][tahun 4][urut 3]` → `19012024001`.

`resolveOrgCodes` (`lib/utils/member.ts:15-42`) mengurai string `code` dengan
regex, bercabang per Jenjang:

| Jenjang   | Yang diurai                             | Hasil                        |
| --------- | --------------------------------------- | ---------------------------- |
| `pw`      | `PW\s*(\d+)` dari kodenya sendiri       | PW dari kode, **PD = `00`**  |
| `pdln`    | `-\s*(\d+)` dari kodenya sendiri        | **PW = `99`**, PD dari kode  |
| `pd`      | `(\d+)\s*\.?\s*PD[\s.-]*(\d+)`          | PW dan PD dari kodenya sendiri |
| `pk`      | **pola yang sama persis dengan `pd`**   | PW dan PD dari kode PK       |

Baris terakhir itu intinya. **Ada invarian tersembunyi yang tidak pernah ditulis
di mana pun: kode sebuah PK wajib memuat kode PD induknya.** Komentar di kodenya
sendiri membocorkannya (`'1.PD-1.USK'`). Karena `code` beku selamanya (ADR 0004),
memindahkan sebuah PK **memecahkan invarian itu secara permanen**.

**Komisariat tidak muncul di NIA sama sekali.** Dua PK di bawah PD yang sama
berbagi satu kolam nomor. `CONTEXT.md` sudah diperbaiki: definisi lamanya
menyebut "Struktur tempatnya terdaftar" dan "nomor urutnya di sana" — dua-duanya
meleset.

**Tiga temuan yang tidak dicari tapi ketemu:**

1. **Ada dua salinan logika ini.** `bulk-upload/action.ts:110-145` menyalin ulang
   seluruh mekanisme (versi tx-aware) alih-alih memanggil
   `generateRegisterNumber`. **Perubahan poin 3 wajib menyentuh dua-duanya**, dan
   yang lupa melahirkan dua sistem penomoran yang berbeda.
2. **Tembok keras di anggota ke-1000** per PW+PD+tahun. Nomor urut
   `padStart(3)`, dan urutan dicari `orderBy(desc(registerNumber))` pada kolom
   **teks**. Begitu tembus `1000`, teks `'999'` masih lebih besar dari `'1000'`,
   jadi `nextSeq` mengulang 1000 terus. Ditangkap `user.name` yang unique, jadi
   ia gagal berisik — tapi ia tetap tembok. **Di luar cakupan peta ini**, dicatat
   di **Out of scope**.
3. **Penjaga keunikan NIA bukan tabel `member`.** `member.registerNumber`
   tidak punya unique constraint sama sekali; yang menjaga adalah `user.name`
   yang `.unique()` (`db/schema/user.sql.ts:9`), diisi NIA saat Akun Kader
   dibuat. Ia bekerja hanya karena tiap Member selalu dibuatkan Akun.

**Nol tes** untuk seluruh mekanisme ini.

### 3. NIA diturunkan dari leluhur terdekat yang dinamainya — khusus PK

NIA menamai level **PW/PD**, jadi aturannya tidak bisa seragam:

- **PK** → yang menamai adalah **induknya**. Turunkan dari induk.
- **PD, PDLN, PW** → merekalah yang dinamai. Turunkan dari **kodenya sendiri**.
  Menurunkan PD dari induknya justru membuat nomor PD-nya jadi `00`.

Urutannya **dibalik, cadangannya dipertahankan** — khusus PK: coba kode induk
dulu → gagal, mundur ke kode PK sendiri → gagal, `throw` seperti sekarang.
PD/PDLN/PW tidak disentuh.

Alasan memilih bentuk ini di atas "gagal keras": ini jalur yang dilewati **tiap
Kader baru** di produksi, dan **nol pendaftaran yang hari ini berhasil boleh jadi
gagal**. Yang berubah cuma siapa yang ditanya lebih dulu — dan hari ini kedua
arah memberi jawaban identik, karena kode PK memang memuat kode PD-nya. Bedanya
baru muncul setelah pindah, dan di situ arah induk yang benar.

Kasus terdegradasi yang diterima sadar: PK yang sudah pindah tapi kode induk
barunya tidak terurai akan mundur ke kodenya sendiri dan salah lagi.

Opsi "PD ikut menurunkan nomor PW dari induknya" ditolak karena ia memperbaiki
masalah yang poin 4 justru meniadakan.

### 4. Batas pemindahan

> **DIAMANDEMEN oleh tiket 11.** Rumusan "dalam PW yang sama" di bawah ini
> ternyata sebuah **proxy** untuk invarian yang sebenarnya: **`pwCode` hasil
> penurunan NIA tidak boleh berubah.** Keduanya identik untuk PK di bawah PD,
> tapi rumusan lama tidak terdefinisi untuk **PK di bawah PDLN** — yang
> `pwCode`-nya `99` dan tidak punya PW sama sekali. Rumusan baru menjawabnya
> (calonnya: PDLN lain) sekaligus menolak penyeberangan terselubung PDLN → PW
> yang rumusan lama lolos begitu saja. Baca sisa poin ini dengan penggantian itu
> terpasang.

**Jenjang dan Cakupan — harus tetap dalam satu Wilayah.** Sebuah PK boleh pindah
ke PD lain **di dalam PW yang sama**, atau menginduk **langsung ke PW** itu.
Tidak ada pemindahan yang menyeberangi PW.

**PD tidak pindah antar-PW.** Secara mekanis bisa — satu kolom — tapi riset poin
2 menunjukkan **tidak ada versi pemindahan langsung yang menjaga NIA tetap
jujur**, karena nomor PW ikut terkunci di `code` yang beku:

- membiarkan NIA menyebut PW lama = bohong permanen di tiap identitas baru;
- menurunkan nomor PW dari induk baru = `pdCode` tetap dari kode sendiri,
  sehingga dua PD berbeda bisa berbagi kolam nomor dan NIA berhenti menunjuk PD
  mana pun secara pasti.

Maka **pemekaran ditangani tanpa pemindahan**: PD lama dinonaktifkan, PD baru
dibuat di PW baru **dengan kode yang benar sejak awal**, lalu Kader terkait
dipindahkan ke sana. Itu satu-satunya jalan yang membuat NIA Kader baru tetap
benar. Untuk kasus yang memang jarang, menukar kemudahan sekali dengan kesalahan
permanen di tiap identitas sesudahnya adalah tukar yang buruk.

**Pelakunya hanya BPW PP dan Root** — pelaku wajib mencakup PK yang dipindah
**dan** induk tujuan, dan konstitusi organisasi memang mengaturnya begitu.
Konsekuensi yang menyenangkan: **pemindahan tidak butuh satu pun sel baru di
matriks tiket 02.** Ia cuma "kelola PK" **dan** "kelola induk tujuan" — dua hak
yang BPW PP sudah punya.

**Hanya anak yang masih Aktif yang wajib dipindah.** Anak yang sudah Non-Aktif
boleh ditinggal, dan itu **diverifikasi tidak merusak apa pun**: penelusuran
Cakupan berjalan murni lewat `parent_id` tanpa saringan Keadaan
(`db/query/organization.ts:77-83`), jadi menonaktifkan induk tidak memutus
pohon; daftar di halaman tetap tampil; NIA tidak tersentuh karena PK Non-Aktif
memang tidak mendaftarkan Kader. Satu-satunya yang mengeras: induk itu jadi
tidak akan pernah bisa dihapus selama anaknya masih ada — dan itu tidak apa-apa,
penghapusan memang untuk salah catat.

### 5. Aksi berdiri sendiri — dan batas peta ikut bergeser

Pemindahan adalah **aksi berdiri sendiri**, bukan langkah wajib di dalam alur
penonaktifan. Alurnya dua langkah: pindahkan dulu, baru nonaktifkan.

**Ini menggeser batas peta, dan pengguna memilihnya sadar setelah diperingatkan.**
Entri **Out of scope** yang berbunyi "Pindah induk secara umum … bentuk umumnya
layak petanya sendiri" **dicabut** — tombol berdiri sendiri _adalah_ fitur itu.
Peta ini sekarang ikut memutuskan pindah-induk umum, dalam batas poin 4:
selalu di dalam satu PW, selalu oleh BPW PP atau Root.

Permukaannya lahir sebagai tiket baru: **11 — Permukaan pindah induk**.

### 6. Menghidupkan kembali menuntut induk yang hidup

Sebuah Struktur **tidak bisa diaktifkan kembali selama induknya masih
Non-Aktif**. Kalau induknya mati, ia harus dipindah dulu ke induk yang hidup.

Ini **cerminan persis** aturan di poin 4: menonaktifkan induk menuntut anak yang
hidup pergi lebih dulu; menghidupkan anak menuntut induknya hidup lebih dulu.
Satu aturan, dua arah, tidak ada yang perlu dihafal terpisah.

Opsi "mengaktifkan induk otomatis menghidupkan seluruh anaknya" ditolak:
perubahan keadaan massal yang tidak diminta adalah cara tercepat membangunkan
Struktur yang memang sengaja dimatikan.

### 7. Yang sengaja dikeluarkan

**Memindahkan Kader antar-Struktur** — muncul dari poin 4 sebagai satu-satunya
jalan menuntaskan pemekaran, tapi ia operasi atas **Kader**, bukan atas Struktur.
Ia menyeret pertanyaan yang tidak satu pun tiket di sini menyentuh: apakah NIA
ikut berubah, apakah riwayat Daurahnya ikut, siapa yang berwenang. Menariknya
masuk berarti peta ini tidak akan pernah selesai. **Petanya sendiri**, dicatat di
Out of scope.
