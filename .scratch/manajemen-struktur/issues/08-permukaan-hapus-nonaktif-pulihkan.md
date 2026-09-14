# 08 — Permukaan hapus, nonaktifkan, dan pulihkan

**Type:** prototype
**Status:** resolved
**Blocked by:** 01, 02

## Question

Tidak ada satu pun tombol untuk ini hari ini — `deleteOrganization` nol
call-site, `isNonActive` nol jalur tulis. Tiket ini memutuskan bagaimana
ketiganya terasa, di `/dashboard/branches` dan di kartu Struktur.

Yang paling menentukan dan paling mudah dibikin buruk: **prasyarat yang belum
terpenuhi**. Penghapusan ditolak selama masih ada anak, Member, atau Daurah;
penonaktifan ditolak selama masih ada anak yang belum Non-Aktif atau
dipindahkan. Pengguna tidak boleh menemukan itu lewat toast merah setelah
menekan tombol.

1. **Kapan prasyaratnya diberitahukan.** Tombolnya mati dengan alasan yang
   terbaca sebelum disentuh ("tidak bisa dihapus — masih ada 12 Kader dan 3
   Komisariat"), atau hidup lalu menjelaskan di dialog? Yang pertama butuh
   hitungan itu ikut dibaca di halaman — konsekuensi data, bukan sekadar
   tampilan, jadi putuskan sadar.
2. **Konfirmasinya seberapa berat.** Menonaktifkan sebuah PD mematikan
   Akun-akunnya dan mematikan situs publiknya sampai artikelnya 404. Itu
   akibat yang harus terbaca **di dialog konfirmasinya**, bukan ditemukan
   sesudahnya.
   **Masukan dari tiket 05:** dialog ini memikul satu kewajiban tambahan.
   Sistem sengaja **tidak** memberi tahu Akun kepengurusan kenapa mereka tiba-tiba
   tidak bisa masuk — login yang ditolak berbunyi "Username atau password salah",
   sama persis dengan password yang salah. Jadi yang menonaktifkan wajib memberi
   tahu orangnya **di luar sistem**, dan dialog konfirmasi ini tempat kewajiban
   itu dinyatakan. Sebutkan juga bahwa Akun Kader di Struktur itu **tetap
   hidup** — cuma empat Akun kepengurusan yang mati.

3. **Dua aksi yang mudah tertukar.** Hapus dan Nonaktifkan berbeda arti tapi
   akan duduk berdampingan. Bedakan lewat apa — penempatan, warna, salinan,
   atau memisahkan Hapus ke tempat yang lebih dalam.
4. **Struktur Non-Aktif tampil bagaimana** di grid dan tabel, dan apakah ia
   tetap bisa ditelusuri ke anak-anaknya.
5. **Permukaan Root untuk memulihkan.** Struktur Terhapus hilang dari semua
   pembacaan biasa — jadi Root butuh cara melihatnya. Filter di halaman yang
   sama, atau tempat tersendiri? Ini bisa jadi bagian tiket ini atau tumbuh
   jadi tiketnya sendiri; putuskan dan catat di jawaban.
6. **Tombol Edit yang bocor sekarang.** `canManage`
   (`branches-grid/branches-grid.tsx:33`) hanya menyembunyikan tombol Tambah;
   pensil Edit tetap tampil untuk BPH. Aksi baru jangan mengulangi itu —
   tetapkan satu pola gate untuk seluruh aksi di kartu.

7. **Pemulihan yang gagal karena slug sudah dipakai.** Diserahkan ke sini oleh
   tiket 03. `slug` unik hanya di antara baris yang belum Terhapus, jadi slug
   sebuah Struktur Terhapus bebas dipungut Struktur baru — dan saat Root
   memulihkan yang lama, `UPDATE`-nya gagal dengan `23505`. Ini **bukan** soal
   kewenangan (tiket 02) dan **bukan** prasyarat penghapusan; ia jenis
   kegagalan ketiga yang belum punya rumah. Putuskan: form pemulihan meminta
   slug pengganti, sistem menempelkan sufiks otomatis, atau pemulihan ditolak
   dengan pesan yang menyebut siapa yang sekarang memakai slug itu. Ingat
   permukaan ini hanya dilihat Root, jadi ia boleh lebih mentah daripada
   permukaan lain — tapi tidak boleh diam.

   **Masukan dari tiket 07: ada momen tabrakan ketiga.** Tiket 03 memetakan dua
   (pembuatan yang sah, dan pemulihan yang gagal). Tiket 07 menemukan yang
   ketiga: **BPH menyunting slug Strukturnya sendiri** di
   `/dashboard/organization` bisa kena `23505` melawan Struktur hidup lain. Di
   sana keputusannya sudah diambil — galat mendarat di field slug, bukan toast,
   karena bisa diperbaiki di tempat. Yang perlu tiket ini putuskan: apakah
   pemulihan Root memakai **pola pesan yang sama** atau sengaja berbeda. Dua
   permukaan yang gagal karena sebab identik sebaiknya tidak menjelaskannya
   dengan dua cara.

**Panggil `/impeccable`** — alur destruktif, keadaan tombol mati, salinan
peringatan, dan a11y dialog adalah isi tiketnya. **Panggil `/shadcn` dan
`base-ui-docs`** begitu komponen disebut; repo ini memakai BaseUI sebagai
lapisan primitif Shadcn, bukan RadixUI.

## Answer

### 0. Preseden yang dipakai, bukan pola baru

Repo sudah punya idiom destruktifnya: **AlertDialog + ketik-untuk-konfirmasi**
(`delete-member-button.tsx:83-101`), dan Member sudah soft delete lewat
`member.deleted_at`. Struktur mengikuti idiom itu apa adanya; yang diketik
adalah **`code`** (mono, seperti `registerNumber` di sana).

### 1 & 3. Aksinya tinggal di sheet, bukan di kartu

`BranchManagementSheet` sudah ada dan sudah menampung Edit. Kedua aksi destruktif
masuk ke sana, di bawah pemisah, sebagai **Zona Berbahaya**. Kartu **tidak
berubah sama sekali** — nol tombol baru.

Tiga hal beres sekaligus:

- **Kartunya tidak jadi sesak.** Ia sudah memuat badge, pensil, nama, chevron,
  kode, dan sub-struktur (`branch-card.tsx`). Tiga ikon aksi berdempet di sana
  akan menaruh aksi paling destruktif sebagai sasaran sentuh terkecil.
- **Prasyaratnya muat sebagai kalimat.** "Tidak bisa dihapus: masih ada 847
  Kader dan 3 Komisariat" ditulis utuh di sheet, bukan diperas jadi tooltip di
  item menu yang mati — tooltip pada item disabled sulit dijangkau keyboard
  maupun sentuhan.
- **Ongkos datanya bubar.** Hitungan Kader dan Daurah dibaca **saat sheet dibuka
  untuk satu Struktur**, bukan untuk 12 kartu sekaligus. `childrenCount` malah
  sudah dibaca hari ini (`branch-card.tsx:82-89`), jadi yang benar-benar baru
  cuma dua agregat untuk satu baris, on demand.

Hapus dan Nonaktifkan dibedakan lewat **urutan dan penjelasan**, bukan warna:
Nonaktifkan lebih dulu (yang lebih sering dipakai), Hapus di bawahnya, masing-
masing dengan satu kalimat akibat di sebelah tombolnya.

### 2. Konfirmasi berat untuk **dua-duanya**

Ketik `code` untuk Hapus maupun Nonaktifkan.

Pilihan pengguna, dan ia menolak usulan agen yang membuat Hapus lebih ringan.
Alasan agen: Hapus hanya boleh saat Struktur kosong total, jadi ia menghancurkan
nol hal dan bisa dipulihkan Root — sementara Nonaktifkan menghantam Struktur
yang hidup. Alasan yang menang: **konsistensi dengan preseden repo**, dan
menghindari beban menjelaskan kepada pengguna kenapa satu aksi lebih ringan dari
yang lain. Dua gerbang yang sama bentuknya tidak menuntut siapa pun memahami
asimetri yang halus.

Isi dialog **Nonaktifkan** memikul kewajiban titipan tiket 05, dan ketiganya
wajib terbaca sebelum tombolnya bisa ditekan:

1. Empat Akun kepengurusan berhenti bisa dipakai. **Akun Kader tetap hidup.**
2. Situs publiknya mati — **artikelnya ikut 404**, bukan sekadar hilang dari
   daftar.
3. **Sistem tidak memberi tahu mereka.** Login yang ditolak berbunyi "Username
   atau password salah", sama persis dengan password yang salah. Yang
   menonaktifkan wajib memberi tahu orangnya **di luar sistem**.

### 4. Struktur Non-Aktif: redup, dan **penelusuran berhenti padanya**

Kartunya diredupkan dan badge Jenjang-nya didampingi penanda Non-Aktif. Chevron
dan tautan ke anaknya **mati**.

Ini sempat terlihat menabrak `CONTEXT.md` — "ia dan seluruh isinya tetap terlihat
dari dalam dasbor" — yang penanya ditutup tiket 01. **Diperiksa di kode, dan
tidak menabrak.** `readDescendantMembers` (`db/query/member.ts:459-463`) dan
`readMemberAggregates` (`:118`) sama-sama memakai `WITH RECURSIVE org_tree` yang
menelusuri `parent_id` **tanpa satu pun filter Keadaan**. Jadi Kader di bawah
sebuah PD Non-Aktif **tetap terbaca dari daftar Kader PW induknya**, teragregasi
ke atas. Janji "seluruh isinya tetap terlihat" ditepati oleh permukaan Kader; ia
tidak pernah merupakan janji tentang pohon `branches`.

Dua fakta lain membuat penelusuran nyaris tidak berguna:

- **Di bawah Struktur Non-Aktif tidak pernah ada Struktur Aktif.** Tiket 06
  mewajibkan seluruh anak Aktif dipindah atau dinonaktifkan lebih dulu.
- **Menghidupkan anak menuntut induknya hidup** (aturan cermin tiket 06). Jadi
  tidak ada alur perbaikan yang menuntut masuk ke dalam Struktur Non-Aktif —
  induknya harus dihidupkan lebih dulu, dan saat itu jalurnya terbuka sendiri.

Nol suntingan `CONTEXT.md`, tiket 01 tidak dibuka ulang.

### 5 & 7. Pemulihan naik jadi tiketnya sendiri

Tiket ini sudah memikul enam pertanyaan dan tiga titipan. Pemulihan membawa
masalah yang tidak berbagi apa pun dengan alur hapus — tabrakan slug `23505`,
dan permukaan yang hanya Root yang melihat sehingga aturan tampilannya berbeda.

Jadi pertanyaan 5 **dan** pertanyaan 7 pindah ke **tiket 12 — Permukaan Root:
melihat dan memulihkan Struktur Terhapus**. Butir kabut "Permukaan Root untuk
memulihkan" lulus ke sana dan dihapus dari kabut peta.

### 6. Satu pola gate untuk seluruh aksi di kartu

Kebocoran hari ini: `canManage` (`branches-grid.tsx:34`) berbunyi
`userRole === 'bpw' || userRole === 'root'` — **peran saja**, nol Cakupan, nol
cek Jenjang — dan ia hanya menyembunyikan tombol Tambah. Pensil Edit
(`branch-card.tsx:46-57`) dan tombol aksi di tabel (`columns.tsx:104-133`) tidak
di-gate sama sekali.

Aturannya: **kemampuan dihitung sekali di server per baris, lalu diturunkan
sebagai bendera** — kartu dan kolom tabel merender afordansi dari bendera itu dan
**tidak pernah menurunkannya sendiri dari `role`**. Sumbernya
`canManageKestrukturan` dari tiket 02, yang memang fungsi murni sehingga bisa
dipanggil per baris tanpa I/O.

Konsekuensi yang harus ikut: `columns.tsx` sekarang menerima `onEdit` opsional
tanpa gate apa pun; ia ikut memakai bendera yang sama, supaya grid dan tabel
tidak punya dua aturan berbeda.

### Temuan yang tidak diminta tiket ini, tapi wajib masuk spec

**Dua CTE rekursif itu tidak menyaring Keadaan sama sekali.** Hari ini itu benar,
karena `organization` belum punya `deleted_at`. Begitu migrasi peta ini mendarat,
keduanya membocorkan Struktur Terhapus — padahal tiket 01 menetapkan Struktur
Terhapus diperlakukan seolah barisnya tidak pernah ada.

> **DIKOREKSI oleh tiket 10.** Rumusan asli di sini berbunyi kedua CTE akan
> "menyedot Kader milik Struktur Terhapus". Diperiksa lebih teliti dan itu benar
> hanya untuk salah satunya, dengan sebab yang berbeda:
>
> - **`readDescendantMembers` tidak bocor.** Ia menyaring `m.deleted_at IS NULL`
>   (`member.ts:523`) dan prasyarat penghapusan menjamin Struktur Terhapus punya
>   nol Member hidup, jadi ia tidak menghasilkan satu baris pun.
> - **`readMemberAggregates` bocor betulan**, tapi bukan karena Kader tersedot —
>   melainkan karena ia memancarkan **satu baris per organisasi di subtree**
>   (`member.ts:145-147`), sehingga Struktur Terhapus muncul sebagai entri
>   berhitungan nol.
>
> Tambalan yang dipasang di `readDescendantMembers` tidak menutup apa pun. Tiket
> 10 juga menaikkan ini dari temuan jadi **invarian menyeluruh** atas ketujuh
> referensi ke `organization`.

Perhatikan asimetrinya: **Non-Aktif harus tetap lolos** kedua CTE itu (justru itu
yang membuat keputusan nomor 4 sah), sementara **Terhapus harus disaring**. Satu
filter, bukan dua — dan bukan filter yang sama.

### Catatan jujur soal jalan keluar yang belum ada

Pengguna menyebut Kader bisa dipindahkan lebih dulu sebelum penonaktifan. Itu
benar sebagai gagasan, tapi **memindahkan Kader antar-Struktur ada di Out of
scope peta ini** — permukaannya belum ada dan tidak akan lahir dari peta ini.
Jadi jaring pengaman itu belum bisa diandalkan. Yang menahan keputusan nomor 4
tetap berdiri adalah agregasi ke induk yang sudah diverifikasi di atas, bukan
pemindahan Kader.
