# 02 — Matriks kewenangan Struktur

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Charting menetapkan hak per Kewenangan dalam kalimat. Tiket ini mengubahnya
jadi **tabel keputusan tanpa sel kosong** — sumbunya (Kewenangan × Jenjang
Akun) melawan (aksi × Jenjang sasaran), dan tiap sel berisi boleh atau tidak,
bukan "belum kepikiran".

Aksinya: **baca**, **buat**, **sunting**, **nonaktifkan**, **aktifkan
kembali**, **hapus**, **pulihkan**. Perhatikan aktifkan-kembali dan pulihkan
belum pernah dibahas terpisah dari pasangannya.

Yang kalimat charting **tidak** jawab, dan tiket ini harus:

1. **Kewenangan yang tidak disebut sama sekali.** BPK, Humas, dan Akun Kader
   tidak muncul di spec hak akses. Diam berarti tidak boleh apa-apa, atau
   berarti boleh membaca? Ingat Humas satu-satunya Kewenangan yang Cakupannya
   tidak turun ke bawah (`CONTEXT.md:100`, ADR 0002).

2. **Sel yang tidak simetris.** BPW PP boleh CRUD seluruh Struktur kecuali PP
   — apakah itu termasuk **menghapus sebuah PW utuh**? Secara harfiah ya, dan
   syarat "nol anak, nol Member, nol Daurah" praktis membuatnya mustahil untuk
   PW yang hidup — tapi itu perlindungan yang tidak disengaja, bukan
   kebijakan. Nyatakan.

3. **Sasaran yang sudah Non-Aktif atau Terhapus.** BPKom PD boleh CRUD
   Komisariat dalam Cakupannya — masih berlaku untuk Komisariat yang sudah
   Non-Aktif? Kalau tidak, sebuah Komisariat yang dinonaktifkan jadi tidak
   bisa diaktifkan kembali oleh siapa pun kecuali PP, dan itu jebakan.

4. **Root.** Root menembus Cakupan, tapi apakah ia menembus **prasyarat**?
   Boleh menghapus Struktur yang masih punya Member? Ada preseden di repo ini:
   Masa Penetapan Kelulusan hanya bisa ditembus Root (`CONTEXT.md:186`).

5. **Bentuk gate-nya.** `AccessGuard` sekarang cuma tahu daftar peran dan
   Jenjang minimum (`lib/access-control.ts`) — tidak cukup untuk matriks yang
   bergantung pada Jenjang **sasaran**. `AGENTS.md` mensyaratkan gate bersama
   tinggal di `src/lib/auth/`, dinamai menurut **hak yang diberikan**, bukan
   menurut aksi memeriksa; `requireSiteSettingsAccess` dan
   `requireKekaderanAccess` adalah polanya. Putuskan berapa gate dan namanya
   apa — jangan tinggalkan itu ke sesi implementasi.

Keluarannya satu tabel yang bisa disalin apa adanya ke spec akhir, dan cukup
tegas untuk jadi daftar kasus tes di tiket implementasi nanti.

## Answer

### Enam aturan baca — berlaku untuk seluruh tabel

Tabelnya dikolapskan. Bentuk utuh (Kewenangan × Jenjang Akun × aksi × Jenjang
sasaran) itu 6 × 4 × 7 × 5 sel yang tidak akan pernah dibaca orang, dan tabel
yang tidak kebaca sama saja dengan sel kosong. Enam aturan di bawah ini
mengangkat sumbu-sumbu yang berlaku universal keluar dari tabel, dan bentuk
utuhnya bisa dihasilkan kembali dari yang kolaps ini — tidak sebaliknya.

1. **Tiap sel dibaca sebagai konjungsi.** Sel berisi Jenjang sasaran yang
   boleh; hak itu berlaku **hanya** kalau sasaran juga ada di **Cakupan** Akun.
   Sumbu Cakupan tidak muncul di tabel karena tidak pernah punya pengecualian.
2. **Matriks ini mengatur permukaan Struktur saja** — siapa yang boleh membuka
   dan mengubah permukaan itu. Nama Struktur yang muncul di halaman Kader,
   Daurah, atau Artikel diatur gate permukaan masing-masing
   (`requireKekaderanAccess` dan kawan-kawan), bukan oleh tabel ini. Kalau
   tabel ini ikut mengatur "boleh baca Struktur", ada dua tempat yang menjawab
   pertanyaan sama dan mereka akan berselisih.
3. **Struktur Terhapus tidak bisa dialamati siapa pun kecuali Root.**
   **DIAMANDEMEN oleh tiket 12 — yang benar: Root _dan_ BPW PP.** Seluruh
   aksi selain `pulihkan` otomatis "tidak" — bukan karena dilarang, tapi karena
   barisnya tidak terlihat (tiket 01). Tidak perlu kolom sendiri.
4. **Keadaan sasaran tidak mengubah Kewenangan.** Yang boleh mengelola sebuah
   PK boleh mengelolanya baik Aktif maupun Non-Aktif. `nonaktifkan` dan
   `aktifkan kembali` simetris penuh — satu aturan, bukan dua.
5. **Prasyarat penghapusan bukan kewenangan.** Nol Struktur anak, nol Member,
   nol Daurah berlaku untuk **semua**, Root termasuk. Cakupan membatasi
   jangkauan; prasyarat menjaga konsistensi. Root menembus yang pertama, tidak
   pernah yang kedua.
6. **BPW tidak pernah mengelola Strukturnya sendiri.** Gate-nya "**di bawah**
   Cakupan", bukan "di dalam Cakupan" — dan itu berarti `isOrgInAccessScope`
   yang sudah ada **tidak cukup**, karena ia menghitung Struktur si Akun
   sendiri sebagai anggota Cakupan (lihat cabang `humas` di
   `db/query/organization.ts:71-73` yang mengembalikan `[connectedOrgId]`).

### Matriks

| Kewenangan            | baca    | buat            | sunting             | nonaktifkan / aktifkan | hapus           | pulihkan |
| --------------------- | ------- | --------------- | ------------------- | ---------------------- | --------------- | -------- |
| **Root**              | semua   | semua           | semua               | semua                  | semua           | semua    |
| **BPH** (tiap Jenjang) | Cakupan | —               | Strukturnya sendiri | —                      | —               | —        |
| **BPW PP**            | semua   | PW, PDLN, PD, PK | PW, PDLN, PD, PK     | PW, PDLN, PD, PK        | PW, PDLN, PD, PK | PW, PDLN, PD, PK <sup>(12)</sup> |
| **BPW PW**            | Cakupan | —               | PD, PK <sup>(A)</sup> | —                      | —               | —        |
| **BPW PD/PDLN**       | Cakupan | PK              | PK                  | PK                     | PK              | —        |
| **BPK**               | —       | —               | —                   | —                      | —               | —        |
| **Humas**             | —       | —               | —                   | —                      | —               | —        |
| **Akun Kader**        | —       | —               | —                   | —                      | —               | —        |

**BPW PK tidak ada barisnya** — Kewenangan itu tidak pernah diterbitkan di
Jenjang PK, dan kode sudah melewatinya (`db/query/organization.ts:148-161`).

Catatan per sel yang perlu dinyatakan, bukan disimpulkan:

- **BPW PP boleh menghapus sebuah PW utuh.** Yang melindungi PW bukan
  Kewenangan, tapi **isinya**: PW yang hidup pasti punya anak, Member, atau
  Daurah, jadi prasyarat menolaknya. PW yang baru dibuat lima menit lalu dengan
  Jenjang salah memang harus bisa dihapus — itu persis definisi "tercatat
  keliru" dari tiket 01. Ditulis terang supaya orang berikutnya tidak mengira
  ini celah lalu "menambalnya".
- **BPW PW membaca dan menyunting.** <sup>(A)</sup> ~~Nol hak kelola.~~
  **Diamandemen 7 Agustus 2026** oleh putusan pengguna saat tiket 18 dikerjakan:
  BPD memegang `sunting` atas **PD dan PK** dalam Cakupannya, dan tetap nol
  `buat`, `hapus`, `nonaktifkan`/`aktifkan`, dan `pulihkan`. Sebab aslinya tetap
  berdiri untuk separuhnya — pembuatan PD tersentralisasi di BPW PP (konsekuensi
  konstitusi organisasi) dan aksi merusak ikut tinggal di sana — tapi melarang
  BPD membetulkan nama Daerah yang sudah ia baca memaksa eskalasi untuk kerja
  tanpa risiko. Rumusan barunya: **baca dan sunting satu pasang, buat dan hapus
  pasangan lain.** PW tidak masuk selnya; satu-satunya PW dalam Cakupan BPD
  adalah miliknya sendiri, dan itu sudah ditutup aturan baca nomor 6.
- **BPK, Humas, dan Akun Kader nol di seluruh baris.** Diam berarti tidak
  boleh. Ini juga yang berlaku hari ini — sidebar sudah membelah dasbor jadi
  tiga dunia (`app-sidebar.tsx:68-75`), dan pembelahan itu konsisten di seluruh
  `AccessGuard`. Memberi Humas hak baca rekursif akan membatalkan ADR 0002
  lewat pintu belakang.
- **Kalau Struktur si Akun sendiri Non-Aktif**, Akun-akunnya mati (tiket 01),
  jadi ia tidak bisa login dan tidak bisa memakai satu pun sel di barisnya.
  Pemulihannya harus datang dari Struktur di atasnya. Itu benar, dan datangnya
  dari keputusan Keadaan Akun — bukan dari matriks ini. Pembekuan ada di
  **pelaku**, bukan di **sasaran**.

### Amandemen dari tiket 05

Baris **Root**, kolom **nonaktifkan / aktifkan**, tidak lagi berbunyi "semua"
melainkan **"semua kecuali PP"**. Jenjang PP tidak bisa dinonaktifkan oleh siapa
pun — larangan dipasang pada **sasaran**, bukan sebagai pengecualian pada
pelaku. Alasannya bukan melindungi Akun `root` yang terhubung ke PP, melainkan
bahwa "kepengurusan pusat sedang tidak berjalan" bukan keadaan yang punya arti
di organisasi ini. Rinciannya di **tiket 05**.

Penghapusan PP **tidak** ikut diputuskan di sana — prasyarat sudah menolaknya
dalam praktik karena PP selalu punya anak, tapi itu perlindungan yang kebetulan
dan belum jadi kebijakan tertulis.

### Bidang mana yang boleh disunting

| Bidang           | Root                     | BPW (atas sasaran)       | BPH (atas Strukturnya sendiri) |
| ---------------- | ------------------------ | ------------------------ | ------------------------------ |
| `name`           | ubah                     | ubah                     | ubah                           |
| `slug`           | ubah                     | ubah                     | ubah                           |
| `logo`           | ubah                     | ubah                     | ubah                           |
| `code`           | tetap sejak dibuat       | tetap sejak dibuat       | —                              |
| `type`           | tetap sejak dibuat       | tetap sejak dibuat       | —                              |
| `parentId`       | tetap sejak dibuat       | tetap sejak dibuat       | —                              |
| Keadaan Struktur | lewat aksi, bukan bidang | lewat aksi, bukan bidang | —                              |

**`type` dan `parentId` beku setelah pembuatan, untuk semua Kewenangan
termasuk Root.** Ini keputusan, bukan kelalaian, dan dia yang **menjelaskan
kenapa aksi hapus ada**: kalau Jenjang yang salah tinggal disunting,
penghapusan kehilangan alasan hidupnya. Salah Jenjang saat membuat → hapus lalu
buat ulang. Perpindahan induk hanya lewat jalur tiket 06 yang dipicu
penonaktifan; bentuk umumnya sudah **Out of scope**, dan membolehkan
penyuntingan `parentId` akan menghidupkannya kembali lewat pintu belakang
bernama "sunting".

**Konsekuensi yang wajib dibawa ke tiket 07 dan 08:** form Tambah dan form
Sunting **bukan form yang sama**. Tambah punya kotak `type` dan `parentId`;
Sunting **tidak punya keduanya sama sekali** — bukan `disabled`, tapi tidak
ada. Ini sekaligus menutup celah produksi di `add-form/action.ts` **secara
konstruksi**, bukan lewat pemeriksaan tambahan yang bisa lupa dipasang.

### Bentuk gate: satu fungsi murni + dua gate async

Rumahnya `src/lib/auth/kestrukturan.ts`, sejajar `kekaderan.ts` dan memakai
kata yang sudah dipakai `CONTEXT.md` untuk hal ini ("BPW: mengelola
kestrukturan").

1. **`canManageKestrukturan(role, jenjangAkun, jenjangSasaran): boolean`** —
   **murni, nol basis data.** Ini matriksnya sendiri. Alasan utamanya bukan
   performa: ini satu-satunya gate di repo yang isinya cukup banyak untuk
   salah, dan isi sebanyak itu harus bisa dites sebagai **tabel argumen ke
   hasil** tanpa satu pun fixture — bukan sebagai delapan tes integrasi.
2. **`requireKestrukturanReadAccess(targetOrgId)`** — hak membuka permukaan
   Struktur. Root/BPH/BPW, sasaran di dalam Cakupan.
3. **`requireKestrukturanManageAccess(targetOrgId)`** — hak mengubah sebuah
   Struktur sasaran. Membungkus `readAccessScope` + Cakupan + fungsi murni di
   atas + aturan "sasaran bukan Strukturnya sendiri".

**UI memanggil fungsi murni yang sama** dengan yang dipakai gate, sehingga
tombol yang tampak dan tulisan yang lolos dijaga satu sumber — tidak akan ada
tombol yang menyala lalu ditolak saat dipencet. Ini yang membunuh opsi "satu
gate per aksi": grid 20 kartu × 3 tombol berarti 60 `await` hanya untuk
memutuskan tombol mana yang muncul.

**Dua hal sengaja tidak dijadikan gate:**

- ~~**`pulihkan`** cukup `role === 'root'`. Tidak ada Cakupan yang perlu
  dihitung — Root menembus semuanya.~~ **DIAMANDEMEN oleh tiket 12.** BPW PP ikut
  memulihkan, memperbaiki asimetri yang tertinggal di sini: BPW PP sudah boleh
  **menghapus** `PW, PDLN, PD, PK` (baris matriks di atas), jadi memberinya hak
  hapus tanpa hak batal membuat tiap salah hapus jadi eskalasi ke Root.
  Gate-nya **bukan** `role === 'root' || role === 'bpw'` — yang lolos hanya
  **BPW yang Struktur terhubungnya PP**. BPW PD dan BPW PDLN tetap nol, sama
  seperti seluruh baris lain milik mereka. Menyalin pola `role === 'bpw'` dari
  tempat lain membuka pemulihan untuk seluruh BPW se-Indonesia.
- **Prasyarat penghapusan** tidak masuk gate mana pun. Ia invarian data, bukan
  kewenangan, dan menaruhnya di dalam gate akan membuat orang menyimpulkan
  bahwa Kewenangan yang cukup tinggi bisa menembusnya. Ia diperiksa di jalur
  hapus, terpisah dan sesudah gate.
- **Sunting identitas Struktur sendiri milik BPH** belum dapat gate di sini.
  Sasarannya selalu Struktur si Akun, jadi bentuknya beda dari dua di atas.
  Diserahkan ke **tiket 07**, yang memang menggarap permukaan itu.
