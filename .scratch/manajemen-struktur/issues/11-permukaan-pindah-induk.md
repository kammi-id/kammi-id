# 11 — Permukaan pindah induk

**Type:** prototype
**Status:** resolved
**Blocked by:** —

## Question

Lahir dari tiket 06, yang memutuskan pemindahan sebagai **aksi berdiri sendiri**
— bukan langkah di dalam alur penonaktifan. Batas peta ikut digeser lewat
keputusan itu: entri Out of scope "Pindah induk secara umum" dicabut.

Tidak ada permukaan apa pun untuk ini hari ini. `parentId` di form adalah hidden
input yang selalu berisi Struktur yang sedang dibuka
(`branches/_components/add-form/add-form.tsx:98`).

**Aturannya sudah tetap dan bukan bahan diskusi di sini** (semua dari tiket 06):
sasaran harus di dalam **PW yang sama** — PD lain di PW itu, atau menginduk
langsung ke PW-nya; pelakunya hanya **BPW PP dan Root**; yang berubah cuma
`organization.parentId`, nol baris lain; PD **tidak** pindah antar-PW.

1. **Memilih induk baru.** Daftar calon induk itu "seluruh PD di dalam PW yang
   sama, ditambah PW itu sendiri". Untuk BPW PP yang Cakupannya seluruh
   Indonesia, pemilihnya harus lebih dulu tahu PW mana — putuskan apakah PW
   ditentukan otomatis dari induk lama (dan tidak bisa diubah), atau dipilih.
2. **Memindahkan banyak sekaligus.** Alur penonaktifan sebuah PD dengan lima PK
   aktif menuntut kelimanya pindah lebih dulu. Lima kali buka-tutup dialog, atau
   satu permukaan yang menampung semuanya? Ini yang paling menentukan apakah
   aturan "pindahkan dulu" terasa masuk akal atau terasa hukuman.
3. **Di mana tombolnya duduk.** Di kartu Struktur bersama Hapus dan
   Nonaktifkan (tiket 08), atau terpisah karena ia bukan aksi destruktif?
   Pemindahan tidak merusak apa pun dan bisa dibalik — beda kelas dengan dua
   tetangganya.
4. **Apa yang diberitahukan sebelum menekan.** Pemindahan mengubah Nomor Induk
   Anggota **Kader yang didaftarkan sesudahnya** — Kader lama tidak tersentuh.
   Itu akibat yang tidak akan ditebak siapa pun; putuskan apakah ia muncul di
   dialog, dan dengan kalimat apa. Lihat tiket 06 poin 2 dan 3.
5. **Struktur yang induknya Non-Aktif.** Tiket 06 menetapkan sebuah Struktur
   tidak bisa diaktifkan kembali selama induknya Non-Aktif — jalan keluarnya
   pindah dulu. Permukaan ini yang memikul jalan keluar itu, jadi ia harus bisa
   ditemukan dari tempat orang menemui penolakan tersebut.

**Panggil `/impeccable`** — pemilihan induk, keadaan kosong (PW tanpa PD lain),
dan salinan peringatan NIA adalah isi tiketnya. **Panggil `/shadcn` dan
`base-ui-docs`** begitu komponen disebut; repo ini memakai BaseUI sebagai
lapisan primitif Shadcn, bukan RadixUI.

Prototipenya dibuang setelah dipakai — yang disimpan keputusannya.

## Answer

Prototipenya berupa mockup ASCII yang dipakai langsung sebagai bahan reaksi.
Nol kode ditulis.

### 1. Tidak ada PW yang dipilih — dan aturannya diganti

Pertanyaan nomor 1 gugur sendiri: pemindahan tidak pernah menyeberangi PW, jadi
PW **sepenuhnya ditentukan** oleh Struktur yang dipindahkan. Menawarkan pilihan
yang jawabannya hanya satu bukan keluwesan, itu kebingungan. PW tampil sebagai
**konteks mati** di kepala dialog ("Dalam PW DKI Jakarta"), supaya pemilih paham
kenapa daftarnya berisi itu saja.

Tapi menelusuri kenapa, tiket ini menemukan aturan tiket 06 sebenarnya sebuah
**proxy**, dan proxy-nya bocor.

> **Amandemen terhadap tiket 06.** Rumusan "sasaran harus di dalam **PW yang
> sama**" diganti menjadi: **calon induk sah bila `pwCode` hasil penurunan NIA
> tidak berubah.**

Kedua rumusan identik untuk PK di bawah PD. Bedanya muncul di **PK di bawah
PDLN**, yang tidak punya PW sama sekali — `resolveOrgCodes` memberinya
`pwCode = '99'` (`lib/utils/member.ts:26-30`). Di bawah rumusan lama, kasus itu
tidak terdefinisi. Di bawah rumusan baru ia terjawab sendiri:

| Yang dipindah | Calon induk sah | `pwCode` |
| --- | --- | --- |
| PK di bawah PD | PD lain di PW itu, atau PW itu sendiri | tetap, mis. `19` |
| PK di bawah PDLN | **PDLN lain** | tetap `99` |

Dan ia sekaligus **menutup penyeberangan terselubung**: memindahkan PK dari PDLN
ke sebuah PW mengubah `pwCode` dari `99` ke `19`, dan itu persis kebohongan
permanen yang tiket 06 tolak saat melarang PD pindah antar-PW. Rumusan lama tidak
menangkapnya; rumusan baru menolaknya tanpa aturan khusus.

Satu invarian, dua kasus, nol hafalan terpisah.

### 2. Pindah satuan, dengan satu pintasan di tempat sakitnya

Aksi dasarnya tetap **satu Struktur satu kali** — itu yang dipakai hampir selalu,
dan menjaga permukaannya sederhana.

Yang ditambahkan: penolakan penonaktifan (tiket 08) menawarkan **"Pindahkan semua
Komisariat Aktif ke PW"**. Pintasan itu dipilih bukan karena paling canggih, tapi
karena **ia tidak pernah bisa gagal**: tiap anak sebuah PD berada di PW itu, dan
PW selalu calon induk yang sah untuk semuanya. Nol kasus gagal, nol validasi per
baris.

Sifatnya **penitipan, bukan penempatan**. Ia memindahkan lima PK ke PW supaya PD
yang bubar bisa dinonaktifkan hari ini, lalu siapa pun menempatkan ulang satu per
satu kemudian. Itu sebabnya "permukaan pindah massal penuh dengan satu pemilih
tujuan" ditolak: lima PK sebuah PD yang bubar biasanya tersebar geografis, dan
satu tujuan untuk semua adalah jawaban yang salah yang terasa efisien.

### 3. Tempatnya di sheet, tapi bukan di Zona Berbahaya

Tiga tingkat di `BranchManagementSheet`, dari atas ke bawah:

1. **Form** — nama, slug, logo.
2. **Pemindahan** — netral, satu tombol "Pindahkan induk".
3. **Zona Berbahaya** — Nonaktifkan, lalu Hapus (tiket 08).

Pemindahan tidak merusak apa pun dan dibalik dengan aksi yang sama persis. Ia
bukan tetangga sekelas Hapus dan Nonaktifkan, jadi ia tidak duduk di kotak yang
sama — meskipun (lihat nomor 4) gerbangnya sama berat.

### 4. Gerbangnya sama berat — ketik `code`

Pengguna menolak usulan agen yang membuat pemindahan jadi kelas ketiga tanpa
ketik-untuk-konfirmasi. Alasan agen: gesekan seharusnya menandai **tak
terpulihkan**, bukan sekadar **penting**. Alasan yang menang: **satu bentuk
gerbang untuk seluruh aksi di sheet**, sama seperti keputusan tiket 08 — tidak
menuntut siapa pun menilai sendiri mana yang lebih berbahaya.

Konsekuensi yang lahir dari menggabungkan nomor 2 dan nomor 4, dan diputuskan di
sini: **pintasan massal adalah satu aksi, jadi satu gerbang.** Yang diketik
adalah `code` **PD sumbernya**, sekali — bukan lima kode anak, satu per satu.
Melipatgandakan gesekan lima kali akan mengembalikan persis rasa hukuman yang
pintasan itu ada untuk menghapusnya.

Isi dialognya wajib memuat akibat NIA, yang tidak akan ditebak siapa pun:

> Kader yang didaftarkan **sesudah** ini mendapat Nomor Induk dengan kode induk
> yang baru. Kader yang sudah terdaftar **tidak berubah sama sekali** — nomornya
> permanen.

Ditambah satu baris bahwa pemindahan **dapat dibalik kapan saja**. Itu satu-satunya
kalimat yang membedakan dialog ini dari dua tetangganya di Zona Berbahaya, dan ia
memikul seluruh beban pembedaan setelah gerbangnya diseragamkan.

### 5. Ditemukan dari tempat orang menemui penolakan

Dua penolakan menuntun ke permukaan ini, dan keduanya wajib memuat tautannya —
bukan sekadar menyebut pemindahan sebagai saran:

- **Penonaktifan ditolak** karena masih ada anak Aktif (tiket 08) → pintasan
  massal di nomor 2, plus jalan ke pemindahan satuan.
- **Pengaktifan kembali ditolak** karena induknya Non-Aktif (tiket 06 poin 6) →
  jalan ke pemindahan satuan Struktur itu sendiri.

Aturan cermin tiket 06 berarti kedua penolakan itu diselesaikan oleh satu
permukaan yang sama. Yang menemui jalan buntu harus menemukan pintunya di layar
yang sama, bukan mencarinya.

### Keadaan kosong — ada tepat satu, dan ia nyata

Untuk PK di bawah PD, daftar calon induk **tidak pernah kosong**: PW-nya sendiri
selalu sah, bahkan ketika ia satu-satunya PD di wilayah itu.

Yang bisa benar-benar kosong hanya **PK di bawah PDLN ketika PDLN itu satu-satunya
yang ada**. Naik ke PP tidak tersedia — PP bukan induk yang sah untuk PK, dan
`pwCode` akan pecah. Keadaan kosongnya harus mengatakan sebabnya apa adanya,
bukan menampilkan pemilih kosong: tidak ada Struktur lain yang bisa menerimanya
tanpa mengubah Nomor Induk Kader-nya.

### Yang tidak berubah, dan perlu ditegaskan

**Nol sel baru di matriks tiket 02.** Pemindahan tetap sekadar "kelola Struktur
yang dipindah" **dan** "kelola induk tujuan" — dua hak yang BPW PP dan Root sudah
punya. Rumusan `pwCode` tidak menyentuh kewenangan sama sekali; ia membatasi
**daftar calon**, bukan **siapa yang boleh**.
