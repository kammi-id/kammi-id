# 12 — Permukaan melihat dan memulihkan Struktur Terhapus

**Type:** prototype
**Status:** resolved
**Blocked by:** 01, 02, 08

## Question

Naik dari tiket 08, yang menyerahkan dua pertanyaannya ke sini karena keduanya
tidak berbagi apa pun dengan alur hapus. Butir kabut "Permukaan Root untuk
memulihkan" ikut lulus ke tiket ini.

Struktur Terhapus **hilang dari semua pembacaan biasa** (tiket 01) — jadi hari
ini tidak ada satu pun tempat Root bisa melihatnya, apalagi memulihkannya.
Pemulihan selalu berujung **Aktif**, tidak pernah Non-Aktif.

1. **Di mana Root melihatnya.** Filter di `/dashboard/branches` yang sama, atau
   permukaan tersendiri? Filter menumpang halaman yang sudah punya pencarian,
   urutan, dan paginasi — tapi permukaan tersendiri berarti satu rute lagi yang
   hanya satu Kewenangan yang pernah membukanya.

2. **Struktur Terhapus tampil bagaimana.** Tiket 08 sudah menetapkan Non-Aktif
   itu **redup + penanda + penelusuran berhenti**. Terhapus harus terbaca
   **berbeda dari itu**, bukan sekadar lebih redup — dua Keadaan yang beda arti
   tidak boleh dibedakan hanya oleh gradasi opasitas.

3. **Pemulihan yang gagal karena slug sudah dipakai.** Diserahkan ke sini oleh
   tiket 03 lewat tiket 08. `slug` unik hanya di antara baris yang belum
   Terhapus, jadi slug sebuah Struktur Terhapus bebas dipungut Struktur baru —
   dan saat Root memulihkan yang lama, `UPDATE`-nya gagal dengan `23505`. Ini
   **bukan** soal kewenangan (tiket 02) dan **bukan** prasyarat penghapusan; ia
   jenis kegagalan ketiga.

   Putuskan: form pemulihan meminta slug pengganti, sistem menempelkan sufiks
   otomatis, atau pemulihan ditolak dengan pesan yang menyebut siapa yang
   sekarang memakai slug itu.

   **Masukan dari tiket 07.** Ada momen tabrakan ketiga yang sudah diputuskan:
   BPH menyunting slug Strukturnya sendiri di `/dashboard/organization` bisa kena
   `23505` yang sama, dan di sana galatnya mendarat **di field slug, bukan
   toast**, karena bisa diperbaiki di tempat. Tiket ini memutuskan apakah
   pemulihan Root memakai **pola pesan yang sama** atau sengaja berbeda. Dua
   permukaan yang gagal karena sebab identik sebaiknya tidak menjelaskannya
   dengan dua cara.

4. **Pemulihan menuntut induk yang hidup?** Aturan cermin tiket 06 berbunyi
   "menghidupkan anak menuntut induknya hidup". Berlaku juga untuk pemulihan
   dari Terhapus — dan kalau induknya sendiri Terhapus, Root harus memulihkan
   dari atas ke bawah. Putuskan apakah permukaan ini menuntun urutan itu atau
   sekadar menolak dengan pesan.

Permukaan ini **hanya dilihat Root**, jadi ia boleh lebih mentah daripada
permukaan lain — tapi tidak boleh diam saat gagal.

**Panggil `/impeccable`** — ini tiket desain. **Panggil `/shadcn` dan
`base-ui-docs`** begitu komponen disebut; repo ini memakai BaseUI sebagai
lapisan primitif Shadcn, bukan RadixUI.

## Answer

> **Judul berkas ini sudah salah.** Ia berbunyi "Permukaan Root", padahal
> permukaannya sekarang milik **BPW PP dan Root**. Lihat bagian 2.

### 1. Anak Terhapus tidak menghitung — lubang yang belum pernah ditutup

Prasyarat penghapusan berbunyi "nol anak, nol Member, nol Daurah" (tiket 02),
tapi **tidak satu pun tiket pernah memutuskan apakah anak yang sudah Terhapus
ikut menghitung.** Untuk anak Non-Aktif jawabannya sudah ada (tiket 06: ia
menghitung, dan induknya jadi tak bisa dihapus selama anaknya ada). Untuk anak
Terhapus, kosong.

**Diputuskan di sini: anak Terhapus TIDAK menghitung.** Konsisten dengan tiket 01
— Terhapus diperlakukan seolah barisnya tidak pernah ada, jadi ia tidak boleh
menahan apa pun. Ia juga menghindari jebakan yang persis sama dengan yang tiket
10 tolak untuk Artikel: satu PK salah buat yang sudah dihapus akan mengunci
induknya **selamanya**, dan `code` yang beku (ADR 0004) membuat induk itu
nyangkut permanen.

**Harganya dibayar di sini: rantai jadi mungkin.**

```
PD Jakarta
 └─ PK Percobaan        ← dihapus lebih dulu

lalu PD Jakarta ikut dihapus (prasyarat melihat nol anak)

hasilnya:  PD Jakarta      (Terhapus)
            └─ PK Percobaan (Terhapus)
```

Itu yang membuat bagian 4 punya isi, bukan sekadar formalitas.

### 2. Permukaan sendiri, untuk **BPW PP dan Root**

Permukaannya berdiri sendiri, bukan filter di `/dashboard/branches`.

Alasannya bertumpu pada tiket 10, yang baru saja menetapkan invarian **tiap
pembacaan menyaring Terhapus**. Cara teraman menjaga invarian itu adalah punya
tepat **satu** fungsi baca yang sengaja melakukan kebalikannya, dipakai oleh
tepat satu permukaan. Filter berbasis peran di `/dashboard/branches` justru
melubangi invarian itu di halaman yang paling sering dibaca — dan lubang di
permukaan tersibuk adalah lubang yang paling mahal.

**Konsekuensi yang membubarkan pertanyaan nomor 2 di badan tiket:** kalau seluruh
isi permukaan ini Terhapus, maka **Keadaan itu sendiri adalah permukaannya**.
Terhapus dan Non-Aktif tidak pernah muncul bersebelahan, jadi tidak perlu ada
bahasa visual baru yang membedakan keduanya — dan kekhawatiran "dua Keadaan yang
dibedakan hanya oleh gradasi opasitas" tidak pernah terjadi.

Yang tetap wajib tampil di tiap baris: **nama, `code`, Jenjang, dan induk
lamanya** — induknya bukan hiasan, ia yang menentukan urutan pemulihan di bagian
4.

#### Pelakunya diperlebar, dan itu mengamandemen tiga tempat

Pengguna memilih **BPW PP ikut**, bukan Root saja. Itu bertabrakan dengan tiga
keputusan yang sudah tertulis, dan ketiganya diamandemen di sini — bukan
didiamkan:

| Tertulis | Di mana | Jadi |
| --- | --- | --- |
| "hanya Root yang bisa melihatnya" | `CONTEXT.md`, Struktur Terhapus | Root **dan** BPW PP |
| "Struktur Terhapus tidak bisa dialamati siapa pun kecuali Root" | tiket 02 poin 3 | idem |
| BPW PP × `pulihkan` = `—` | matriks tiket 02 | `PW, PDLN, PD, PK` |
| "`pulihkan` cukup `role === 'root'`" | tiket 02, catatan gate | tidak lagi cukup |

**Alasannya bukan pelonggaran, melainkan perbaikan asimetri.** Matriks tiket 02
sudah memberi BPW PP hak **hapus** atas `PW, PDLN, PD, PK`. Memberi hak menghapus
tanpa hak membatalkannya membuat **tiap salah hapus jadi eskalasi ke Root** —
padahal salah hapus persis peristiwa yang paling sering dilakukan orang yang
punya tombolnya. Yang memegang tombol seharusnya memegang pembatalannya.

Cakupannya tetap bersih: BPW PP mencakup seluruh Indonesia kecuali PP, dan PP
tidak akan pernah bisa Terhapus (prasyarat menolaknya, tiket 02). Jadi tidak ada
baris di permukaan ini yang berada di luar Cakupan BPW PP.

**Bentuk gate-nya berubah, dan ini yang paling gampang salah:** `pulihkan` tidak
boleh jadi `role === 'root' || role === 'bpw'`. Yang lolos hanya **BPW yang
Struktur terhubungnya PP** — BPW PD dan BPW PDLN tetap nol, sama seperti seluruh
baris lain milik mereka di matriks. Menyalin pola `role === 'bpw'` dari tempat
lain akan membuka pemulihan untuk seluruh BPW se-Indonesia.

### 3. Tabrakan slug: cek saat dibuka, eskalasi jadi form

Slug bebas → konfirmasi biasa, satu klik. Slug sudah dipungut → **dialog yang
sama berubah jadi form**: menyebut siapa yang sekarang memakainya, lalu
menyodorkan field slug terisi usulan.

Yang dibeli: pelakunya melihat masalahnya **sebelum** menekan, bukan sesudah.
Sufiks otomatis ditolak karena ia mengubah URL diam-diam tanpa ada yang
memutuskan — dan menyembunyikan justru informasi yang menjelaskan kenapa
Struktur ini dulu dihapus. "Selalu form" ditolak karena membebani jalur mulus
yang jauh lebih sering.

**Server tetap wajib menangani `23505`.** Ada jeda antara cek saat dialog dibuka
dan simpan saat tombol ditekan, dan slug bisa berpindah tangan di dalam jeda itu.
Galatnya mendarat **di field slug** — **pola yang sama persis dengan tiket 07**,
yang memutuskan hal itu untuk BPH menyunting slug Strukturnya sendiri.

Itu menjawab pertanyaan yang tiket ini titipkan pada dirinya sendiri: **ya, dua
permukaan itu memakai pola pesan yang sama.** Dua kegagalan dengan sebab identik
(`23505` atas partial unique index yang sama) tidak dijelaskan dengan dua cara
berbeda. Yang berbeda hanya salinannya — di sini ia menyebut pemilik baru
slugnya, karena di sini pemiliknya memang ada dan bisa dinamai.

### 4. Pemulihan menuntut induk yang hidup — ditolak dengan langkah berikutnya, bukan sekadar ditolak

Aturan cermin tiket 06 ("menghidupkan anak menuntut induknya hidup") berlaku
penuh di sini, sebab tiket 01 menetapkan pemulihan selalu berujung **Aktif**.
Memulihkan sebuah Struktur ke Aktif di bawah induk yang Non-Aktif atau Terhapus
melanggar aturan itu.

Karena bagian 1 membuat rantai mungkin, ada dua bentuk penolakan:

- **Induknya Non-Aktif** → jalan keluarnya sudah ada: aktifkan induknya, atau
  pindahkan Struktur ini ke induk yang hidup (tiket 11).
- **Induknya juga Terhapus** → induk itu ada di permukaan **yang sama ini**.
  Penolakannya menyebut namanya dan **menautkannya ke barisnya**, supaya urutan
  pemulihan terbaca tanpa harus dicari.

**Pemulihan berantai otomatis ditolak.** Memulihkan induk sekaligus seluruh
keturunannya adalah perubahan keadaan massal yang tidak diminta — persis yang
tiket 06 tolak untuk pengaktifan ("cara tercepat membangunkan Struktur yang
sengaja ditidurkan"). Root dan BPW PP memulihkan dari atas ke bawah, satu per
satu, dengan permukaan yang menunjukkan urutannya.

### Keadaan kosong

Nol Struktur Terhapus adalah keadaan **normal dan sehat**, bukan kegagalan —
penghapusan memang untuk salah catat, dan salah catat memang jarang. Keadaan
kosongnya harus berbunyi begitu, bukan "tidak ada data ditemukan".

### Gerbangnya

Tiket 08 dan tiket 11 menyeragamkan seluruh aksi di sheet jadi **ketik `code`**.
Pemulihan **tidak** ikut pola itu: ia bukan aksi di sheet Struktur, ia satu-satunya
aksi di permukaan yang seluruh isinya sudah Terhapus, dan ia **memulihkan** alih-alih
menghilangkan. Konfirmasi biasa sudah cukup — kecuali saat ia tereskalasi jadi form
slug (bagian 3), yang gesekannya datang dari kebutuhan nyata, bukan dari gerbang.
