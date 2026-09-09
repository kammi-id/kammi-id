# 26 — Sheet Struktur: bendera kemampuan, tiga tier, dialog konfirmasi

**Type:** implementation
**Status:** resolved
**Blocked by:** 18, 21, 22, 23

Spec: [`../spec.md`](../spec.md) §8, §8.2

**Panggil `/impeccable`, `/shadcn`, dan `base-ui-docs`.** Repo ini memakai **BaseUI**
sebagai lapisan primitif Shadcn, **bukan RadixUI**.

## Pekerjaan

Seluruh aksi atas satu Struktur tinggal di `BranchManagementSheet` yang **sudah
ada**. **Kartu tidak berubah sama sekali — nol tombol baru.**

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

**Kenapa sheet, bukan kartu.** Kartunya sudah memuat badge, pensil, nama, chevron,
kode, dan sub-struktur (`branch-card.tsx`) — tiga ikon aksi berdempet akan menaruh
aksi paling destruktif sebagai **sasaran sentuh terkecil**. Prasyaratnya juga muat
sebagai **kalimat utuh** di sheet ("Tidak bisa dihapus: masih ada 847 Kader dan 3
Komisariat") alih-alih diperas jadi tooltip pada item disabled, yang **sulit
dijangkau keyboard maupun sentuhan**. Dan ongkos datanya bubar: hitungan Kader dan
Daurah dibaca **saat sheet dibuka untuk satu Struktur**, bukan untuk 12 kartu
sekaligus (`childrenCount` malah sudah dibaca hari ini, `branch-card.tsx:82-89`).

Sejalan dengan DESIGN.md: _"prefer inline rows or slide-over sheets."_

**Hapus vs Nonaktifkan dibedakan lewat urutan dan penjelasan, bukan warna.**
Nonaktifkan lebih dulu (lebih sering dipakai), Hapus di bawahnya, masing-masing
dengan **satu kalimat akibat** di sebelah tombolnya.

**Pemindahan duduk di tier sendiri, di atas Zona Berbahaya** — ia tidak merusak apa
pun dan dibalik dengan aksi yang sama persis.

### Form Sunting BUKAN form Tambah

Tambah punya kotak `type` dan `parentId`. **Sunting tidak punya keduanya sama sekali
— bukan `disabled`, tapi tidak ada.** Itu menutup celah `add-form/action.ts` **secara
konstruksi**, bukan lewat pemeriksaan tambahan yang bisa lupa dipasang.

### Gerbang: ketik `code`, untuk ketiganya

Idiom repo: **AlertDialog + ketik-untuk-konfirmasi**
(`delete-member-button.tsx:83-101`). Yang diketik `code`, **mono**.

> **Pilihan pengguna, dua kali, menolak usulan agen.** Untuk **Hapus** agen
> mengusulkan gerbang lebih ringan; untuk **Pindah induk** agen mengusulkan kelas
> ketiga tanpa ketik-konfirmasi. Yang menang dua-duanya: **satu bentuk gerbang untuk
> seluruh aksi di sheet** — tidak menuntut siapa pun menilai sendiri mana yang lebih
> berbahaya. **Jangan dibuka ulang.**

#### Dialog Nonaktifkan — tiga hal, wajib terbaca sebelum tombolnya bisa ditekan

1. **Empat Akun kepengurusan berhenti bisa dipakai. Akun Kader tetap hidup.**
2. **Situs publiknya mati — artikelnya ikut 404**, bukan sekadar hilang dari daftar.
3. **Sistem tidak memberi tahu mereka.** Login yang ditolak berbunyi "Username atau
   password salah", sama persis dengan password yang salah. **Yang menonaktifkan
   wajib memberi tahu orangnya di luar sistem.**

#### Dialog Pindahkan induk

- **PW sebagai konteks mati di kepala dialog, bukan pilihan**: "Dalam PW DKI
  Jakarta". PW sepenuhnya ditentukan oleh Struktur yang dipindahkan (tiket 23) —
  menawarkan pilihan yang jawabannya hanya satu bukan keluwesan, itu kebingungan.
- **Akibat NIA, yang tidak akan ditebak siapa pun:**

  > Kader yang didaftarkan **sesudah** ini mendapat Nomor Induk dengan kode induk
  > yang baru. Kader yang sudah terdaftar **tidak berubah sama sekali** — nomornya
  > permanen.

- Satu baris bahwa pemindahan **dapat dibalik kapan saja**. Itu satu-satunya kalimat
  yang membedakan dialog ini dari dua tetangganya, dan ia memikul seluruh beban
  pembedaan setelah gerbangnya diseragamkan.

**Keadaan kosong — ada tepat satu, dan ia nyata.** Untuk PK di bawah PD daftar calon
**tidak pernah kosong** (PW-nya sendiri selalu sah). Yang bisa benar-benar kosong
hanya **PK di bawah PDLN ketika PDLN itu satu-satunya**. Keadaan kosongnya **harus
mengatakan sebabnya apa adanya**, bukan menampilkan pemilih kosong: _tidak ada
Struktur lain yang bisa menerimanya tanpa mengubah Nomor Induk Kader-nya._

### Penolakan wajib memuat jalan keluarnya — bukan sekadar menyebutnya

| Penolakan | Jalan keluar yang wajib ditawarkan |
| --- | --- |
| **Penonaktifan ditolak** karena masih ada anak Aktif | **pintasan "Pindahkan semua Komisariat Aktif ke PW"** + jalan ke pemindahan satuan |
| **Pengaktifan kembali ditolak** karena induknya Non-Aktif | jalan ke pemindahan satuan Struktur itu sendiri |

**Yang menemui jalan buntu harus menemukan pintunya di layar yang sama, bukan
mencarinya.**

**Pintasan massal = satu aksi = satu gerbang.** Yang diketik `code` **PD sumbernya
sekali**, bukan lima kode anak. Melipatgandakan gesekan lima kali mengembalikan
persis rasa hukuman yang pintasan itu ada untuk menghapusnya.

### Bendera kemampuan — menutup kebocoran yang ada hari ini

`canManage` (`branches-grid.tsx:34`) hari ini berbunyi
`userRole === 'bpw' || userRole === 'root'` — **peran saja, nol Cakupan, nol cek
Jenjang** — dan ia hanya menyembunyikan tombol Tambah. Pensil Edit
(`branch-card.tsx:46-57`) dan tombol aksi di tabel (`columns.tsx:104-133`) **tidak
di-gate sama sekali**.

Aturannya: **kemampuan dihitung sekali di server per baris, lalu diturunkan sebagai
bendera.** Kartu, kolom tabel, dan item sheet merender afordansi dari bendera itu dan
**tidak pernah menurunkannya sendiri dari `role`**. Sumbernya `canManageKestrukturan`
(tiket 18), yang murni sehingga bisa dipanggil per baris tanpa I/O.

`columns.tsx` yang menerima `onEdit` opsional tanpa gate apa pun ikut memakai bendera
yang sama — grid dan tabel tidak boleh punya dua aturan berbeda.

## Selesai bila

- Ketiga aksi ada di sheet, nol tombol baru di kartu
- Tombol yang menyala tidak pernah ditolak saat dipencet (satu sumber kebenaran)
- Prasyarat terbaca sebagai kalimat utuh sebelum tombol disentuh
- Kedua penolakan memuat tautan jalan keluarnya
- Form Sunting nol kotak `type`/`parentId`
- a11y dialog: fokus, `aria`, keyboard — diperiksa, bukan diasumsikan

## Answer

Sheet-nya **pindah rumah tapi tidak berganti nama**:
`branches/_components/branch-management-sheet/`, folder sendiri dengan barrel,
sebab grid **dan** tabel sekarang merender sheet yang sama. Sebelumnya keduanya
punya `Sheet` sendiri-sendiri dengan salinan salinan teks yang sama — dua tempat
yang suatu hari punya dua aturan.

### Bendera kemampuan: satu fungsi murni, dihitung per baris di server

`src/lib/struktur/kemampuan.ts` (`strukturKemampuan`) membungkus
`canManageKestrukturan` dengan tiga aturan yang tidak boleh diulang di tiap
permukaan: **bukan Strukturnya sendiri** (Root dikecualikan), **Keadaan memilih
arah** (nonaktifkan hanya untuk Aktif, aktifkan hanya untuk Non-Aktif), dan
**`pindah` adalah konjungsi yang `requireStrukturMoveAccess` hitung** —
`sunting` atas yang dipindah **dan** `buat` atas Jenjang itu. Konjungsi terakhir
yang membuat BPD tidak dapat tombol pindah yang selalu ditolak.

Ia murni, jadi dua belas baris berbiaya dua belas lookup tabel dan **nol query**.
`page.tsx` menghitungnya sekali per baris dan menurunkannya sebagai
`StrukturRow.kemampuan`; kartu, kolom tabel, dan sheet membacanya dan **tidak
pernah menyentuh `role`**. Tombol Tambah ikut: `canAdd` diturunkan dari sel
`buat` atas Jenjang anak yang sah, bukan dari `userRole === 'bpw' || 'root'`.

**Cakupan ditutup di jalan masuknya, bukan per baris.** `page.tsx` sekarang
memanggil `requireKestrukturanReadAccess(currentOrg.id)` — gate tiket 18 yang
sampai kini nol call-site — jadi slug di luar Cakupan dijawab persis seperti
slug yang tidak pernah ada. Setelah gate itu lolos, tiap baris di halaman pasti
anak dari Struktur yang di dalam Cakupan, sehingga fungsi murni di atas tidak
perlu menelusuri apa pun. `AccessGuard` yang lama dibiarkan di tempatnya:
mencabutnya akan mengubah siapa yang bisa membuka halaman ini, dan itu bukan
pekerjaan tiket ini.

### Ongkos data dibayar sekali, saat sheet dibuka

`branch-management-sheet/action.ts` (`readStrukturSheetInfoAction`) membaca
prasyarat ketiga aksi **dan** daftar calon induk dalam satu perjalanan, untuk
**satu** Struktur, di balik `requireKestrukturanReadAccess`. Jadi penolakan sudah
berupa kalimat utuh sebelum ada yang menyentuh tombol, dan tombol yang menyala
tidak pernah ditolak saat dipencet.

**Kumpulan calon induk = kakek + anak-anak kakek**, satu baris untuk semua
Jenjang, lalu disaring `filterMoveCandidates` dan Cakupan. Komisariat dapat PD
sesaudara plus PW-nya sendiri (penitipan); Daerah dapat seluruh PW/PDLN yang
lalu ditolak `pwCode` — §6.3 menjawab sendiri, tanpa aturan khusus ditulis di
sini; PW tidak punya kakek, jadi daftarnya kosong dan itu jawaban yang benar.

### Yang ikut terangkat: `code` ternyata masih bisa disunting

Form Sunting sudah nol kotak `type`/`parentId` sejak tiket 18, tapi **`code`
masih kotak input hidup** dan `orgUpdateSchema` masih menerimanya — padahal spec
§2.4 membekukannya untuk semua Kewenangan, Root termasuk, dan ia terbawa ke
Nomor Induk yang permanen (ADR 0004). Diperbaiki di dua sisi: `code` di-`omit`
dari skema pembaruan (nilai yang dikirim diabaikan, bukan dipercaya), dan di
form ia jadi keterangan identitas mono — bukan input `disabled`, dengan alasan
yang sama yang tiket 25 pakai.

### Dialog

Satu komponen gerbang (`struktur-confirm-dialog.tsx`) untuk keempat aksi:
AlertDialog + ketik `code`, mono, mengikuti `delete-member-button`. Satu
penyimpangan sadar dari idiom itu: tombol konfirmasinya **bukan**
`AlertDialogAction`, sebab `AlertDialogAction` adalah `Close` — ia menutup dialog
sebelum jawabannya datang. Penolakan server mendarat di dalam dialog, tempat
orangnya masih melihat, bukan sebagai toast yang terbang lewat.

Penolakan membawa pintunya: penonaktifan yang ditolak menyodorkan pintasan
massal **dan** tautan ke daftar anaknya untuk pemindahan satuan; pengaktifan yang
ditolak menyodorkan dialog Pindah Induk untuk Struktur itu sendiri.

## Comments

**18 Agustus 2026 — pintasan massal dulu menyala di tempat ia pasti gagal. Diperbaiki.**

`/code-review` menemukan bahwa pintasan "Pindahkan semua X Aktif ke Y" dirender
untuk **Jenjang apa pun** selama `info.parentName` ada. Menonaktifkan sebuah PW
yang masih punya PD Aktif menawarkan "…ke PP", dan
`moveActiveChildrenToParentAction` menolak **tiap** anaknya —
`checkMoveCandidate(PD, PW, PP)` berbunyi `CHANGES_NIA` sebab PP tidak
menurunkan Nomor Induk sama sekali. Itu melanggar "tombol yang menyala tidak
pernah ditolak saat dipencet" dan melanggar dasar pemilihan pintasannya di spec
§8.2: *"ia tidak pernah bisa gagal"*.

Sebabnya: **janji "tidak pernah bisa gagal" itu klaim tentang PD, bukan aturan
umum**, dan permukaan memperlakukannya sebagai aturan umum.

Perbaikannya bukan menuliskan "kalau PD" — melainkan **menghitung legalitasnya
di server, per anak**: `readStrukturSheetInfoAction` kini mengembalikan
`bulkMoveTo`, yang berisi nama induk hanya kalau `checkMoveCandidate` meloloskan
**setiap** anak Aktif. `parentName` dicabut dari payload, sebab yang tersisa
membacanya cuma pintasan itu. Premisnya sekarang dijaga tes murni di
`pindah-induk.test.ts` — berlaku untuk PD, **tidak** untuk PW maupun PDLN.

Dua rapian lain dari review yang sama:

- **`StrukturRow`, `Organization`, dan `isNonAktif` pindah ke folder sendiri**
  (`_components/struktur-row/`). Sebelumnya mereka tinggal di
  `branches-table/columns.tsx` dan diambil lewat `'../branches-table/columns'`
  dari lima berkas — menembus barrel folder tetangga. Pola eslint-nya kebetulan
  tidak menangkap ejaan relatif itu, jadi ia lolos `check:lint` sambil tetap
  melanggar AGENTS.md.
- **`MoveCandidate.type` dicabut, `code` mulai dirender** di pemilih induk —
  komentarnya sudah menjanjikan `code` tampil, kodenya belum.
