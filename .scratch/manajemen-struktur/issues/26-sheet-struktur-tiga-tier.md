# 26 — Sheet Struktur: bendera kemampuan, tiga tier, dialog konfirmasi

**Type:** implementation
**Status:** open
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
