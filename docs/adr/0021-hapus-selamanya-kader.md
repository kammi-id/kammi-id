# Hapus Selamanya berlaku juga untuk Kader, tapi yang menjaganya bukan gerbangnya

ADR 0019 memberi Struktur sebuah pintu Hapus Selamanya, dan seluruh
keamanannya bertumpu pada satu pembuktian: `code` Struktur itu **tidak pernah**
tersusun ke dalam Nomor Induk siapa pun. Kalau tidak pernah tercetak, ia boleh
dipungut ulang tanpa risiko Nomor Induk kembar.

Pembuktian itu **tidak bisa dipinjam** untuk Kader. NIA seorang Kader tercetak
pada saat barisnya dibuat, bukan pada saat ia dipakai. Tidak ada Kader yang
NIA-nya "belum pernah terbit". Menyalin bentuk gerbang ADR 0019 ke sini akan
menghasilkan pintu yang terlihat sama amannya padahal alasannya sudah hilang.

Sementara itu kebutuhannya nyata: salah input terjadi, dan sebuah baris yang
lahir dari salah ketik tidak seharusnya menetap selamanya di basis data.

## Decision

**Penghapusan Kader berjalan tiga lapis, dan yang menjaga lapis ketiga bukan
gerbangnya melainkan high-water mark NIA (ADR 0020).**

**Lapis 1 — Soft delete.** Seperti sekarang: BPK (dan Root) atas Kader di
dalam Cakupannya, dikonfirmasi dengan mengetik NIA. Berubah satu hal: Akun
Kader ikut **di-soft-delete**, tidak lagi dibuang permanen seperti
`deleteMember` hari ini. Menghapus baris `user` membuat pemulihan menjadi
setengah — orangnya kembali, loginnya tidak.

**Lapis 2 — Kader Terhapus, mengikuti Cakupan.** Permukaan
`/dashboard/kader/terhapus` tempat melihat dan memulihkan. **Berbeda dari
Struktur Terhapus yang terpusat**, dan perbedaannya punya alasan: penghapusan
Struktur memang tersentralisasi sejak awal (`CONTEXT.md`: "membuat dan
menghapus Struktur tersentralisasi, bukan tersebar mengikuti jangkauan"),
sehingga tong sampah terpusat adalah kelanjutan yang wajar. Penghapusan Kader
**terdesentralisasi** — BPK PD boleh melakukannya. Mengunci pemulihannya ke
pusat berarti memaksa eskalasi nasional untuk membatalkan salah ketik harian.
Pemulihan harus semurah kesalahannya.

**Lapis 3 — Hapus Selamanya, Root dan BPK PP saja.** Dua gerbang konfirmasi,
gerbang kedua mengetik NIA. Ini satu-satunya aksi di seluruh aplikasi yang
menghapus manusia dari basis data untuk selamanya.

Prasyaratnya — `checkHardDeletionMember` — memblokir dengan pesan, bukan ikut
menghapus, ketika Kader itu menggantungkan baris di mana pun:
`training_attendants`, `training_instructors`, `member_academic`,
`member_career`, `member_organization_history`, `member_mutation`. Kelimanya
`NO ACTION` ke `member.id`; membiarkannya berarti `23503` mentah, membereskannya
diam-diam berarti mengulang persis kesalahan yang membuat cascade lama dicabut
(ADR 0004, consequences).

`user.connected_member_id` adalah pengecualian: ia `ON DELETE CASCADE`, jadi
Akun Kader ikut terhapus. Itu diterima, karena Akun Kader tidak punya arti
tanpa Member-nya — berbeda dari Akun Kepengurusan yang terikat pada Struktur.

**Garis pemisahnya, dalam satu kalimat:** Kader yang punya riwayat bukan salah
input — ia orang sungguhan yang berhenti, dan itu soft delete. Hapus Selamanya
hanya untuk baris yang belum sempat mengumpulkan apa pun.

## Considered Options

**Menyalin `checkHardDeletion` ADR 0019 apa adanya**, yakni menuntut bukti
bahwa NIA-nya tidak pernah tercetak. Ditolak karena mustahil dipenuhi: NIA
tercetak pada penciptaan baris. Syarat yang tidak pernah bisa benar bukan
gerbang, ia larangan yang menyamar.

**Berhenti di dua lapis**, tanpa Hapus Selamanya. Ditolak oleh keputusan
produk: salah input perlu jalan keluar yang tuntas.

**Ikut menghapus riwayat Daurah dan akademiknya** di dalam transaksi yang
sama. Ditolak dengan alasan ADR 0019 klausa 3, yang berlaku identik di sini.

**Tong sampah Kader terpusat**, meniru Struktur Terhapus. Ditolak: premis
sentralisasinya tidak berlaku, lihat Decision.

**Membiarkan `deleteMember` tetap membuang baris `user`.** Ditolak: itu
membuat lapis 2 berbohong. Sebuah tong sampah yang mengembalikan orang tanpa
loginnya bukan pemulihan.

## Consequences

- **Hapus Selamanya tidak mengembalikan nomor urut NIA-nya** (ADR 0020). Yang
  ia berikan hanyalah hilangnya baris dari basis data. Siapa pun yang
  mengharapkan nomornya kembali akan kecewa, dan itu memang keputusannya.
- **Kader yang pernah ikut satu Daurah saja tidak akan pernah bisa dihapus
  selamanya.** Diterima: itu tepat definisi "bukan salah input".
- Lapis 1 berubah perilaku: Akun Kader yang tadinya hilang permanen kini
  ikut soft delete. Kode mana pun yang mengandaikan `user` sudah tidak ada
  setelah penghapusan Member harus disesuaikan.
- `CONTEXT.md` diamandemen: istilah **Kader Terhapus** ditambahkan, dengan
  garis tegas antara soft delete dan Hapus Selamanya.
