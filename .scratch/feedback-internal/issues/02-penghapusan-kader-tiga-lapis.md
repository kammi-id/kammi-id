# 02 — Penghapusan Kader tiga lapis

Status: ready-for-agent
Blocked by: 01
ADR: [0021](../../../docs/adr/0021-hapus-selamanya-kader.md)

Poin 4 dari feedback. Diblokir oleh tiket 01 karena Hapus Selamanya baru aman
setelah high-water mark memastikan nomor NIA tidak kembali.

## Lapis 1 — Soft delete (perbaikan)

`deleteMember` (`src/db/query/member.ts:430`) me-soft-delete `member` tapi
**menghapus permanen** baris `user`-nya. Pemulihan jadi setengah: orangnya
kembali, loginnya tidak.

- Akun Kader ikut **di-soft-delete**, bukan dibuang.
- Wewenang tidak berubah: BPK (dan Root) atas Kader di dalam Cakupannya,
  konfirmasi ketik NIA.
- Sisir kode yang mengandaikan baris `user` sudah hilang setelah penghapusan
  Member.

## Lapis 2 — Kader Terhapus, mengikuti Cakupan

- Rute baru `/dashboard/kader/terhapus`, bukan tab di halaman Data Kader.
- **Mengikuti Cakupan** — BPK PD melihat dan memulihkan Kader Terhapus miliknya
  sendiri. Sengaja **berbeda** dari Struktur Terhapus yang terpusat; alasannya
  di ADR 0021 (penghapusan Kader terdesentralisasi, jadi pemulihannya juga).
- Memulihkan mengembalikan Kader beserta Akun-nya.

## Lapis 3 — Hapus Selamanya

- Wewenang **Root dan BPK PP saja**.
- Dua gerbang konfirmasi; gerbang kedua mengetik NIA.
- `checkHardDeletionMember` memblokir **dengan pesan** — bukan ikut menghapus —
  bila ada baris menggantung di `training_attendants`, `training_instructors`,
  `member_academic`, `member_career`, `member_organization_history`,
  `member_mutation`. Kelimanya `NO ACTION` ke `member.id`.
- `user.connected_member_id` adalah pengecualian: `ON DELETE CASCADE`, Akun
  ikut terhapus, dan itu disengaja.

Rujukan bentuk: `branches/terhapus/_components/hard-delete-struktur/`. Rujukan
**bentuk**, bukan alasan — gerbang ADR 0019 bertumpu pada `code` yang tidak
pernah tercetak, dan pembuktian itu tidak berlaku untuk Kader.

## Selesai bila

- Soft delete lalu pulihkan mengembalikan Kader **dan** Akun-nya (tes).
- BPK PD melihat hanya Kader Terhapus dalam Cakupannya (tes).
- Hapus Selamanya ditolak untuk Kader yang punya satu baris riwayat mana pun,
  dengan pesan yang menyebut penghalangnya (tes).
- BPK non-PP ditolak dari Hapus Selamanya; Root dan BPK PP diterima (tes).
- Setelah Hapus Selamanya, pendaftar berikutnya **tidak** menerima NIA yang
  baru saja hangus (tes — bergantung tiket 01).
- Ketiga `check:*` hijau.
