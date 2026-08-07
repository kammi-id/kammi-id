# 21 — Aksi nonaktifkan dan aktifkan kembali

**Type:** implementation
**Status:** open
**Blocked by:** 13, 18

Spec: [`../spec.md`](../spec.md) §1.5, §2.3, §6.4

## Pekerjaan

`organization.isNonActive` **tidak punya satu pun jalur tulis** hari ini. Tiket ini
membuat dua-duanya, simetris penuh.

### Nonaktifkan

Prasyarat, diperiksa **sesudah** gate:

1. **Sasaran bukan PP.** Jenjang PP tidak bisa dinonaktifkan oleh siapa pun, Root
   termasuk. Larangan dipasang pada **sasaran**, bukan sebagai pengecualian pada
   pelaku — alasannya bukan melindungi Akun `root`, melainkan bahwa "kepengurusan
   pusat sedang tidak berjalan" bukan keadaan yang punya arti di organisasi ini. PP
   tidak punya induk, jadi larangannya satu baris.
2. **Nol anak yang masih Aktif.** Anak yang sudah Non-Aktif **boleh ditinggal**.

Menulis `is_non_active = true` beserta jejak `non_active_at` / `non_active_by`.

### Aktifkan kembali

Prasyarat: **induknya wajib Aktif.**

Ini **cerminan persis** aturan penonaktifan — menonaktifkan induk menuntut anak yang
hidup pergi lebih dulu; menghidupkan anak menuntut induknya hidup lebih dulu. Satu
aturan, dua arah, tidak ada yang perlu dihafal terpisah.

Mengosongkan `is_non_active` beserta jejaknya.

> **"Mengaktifkan induk otomatis menghidupkan seluruh anaknya" DITOLAK.** Perubahan
> keadaan massal yang tidak diminta adalah cara tercepat membangunkan Struktur yang
> memang sengaja dimatikan.

### Kewenangannya simetris penuh

`nonaktifkan` dan `aktifkan kembali` adalah **satu aturan, bukan dua** — Keadaan
sasaran tidak mengubah Kewenangan. Yang boleh mengelola sebuah PK boleh mengelolanya
baik Aktif maupun Non-Aktif.

Kalau tidak begitu, sebuah Komisariat yang dinonaktifkan jadi tidak bisa diaktifkan
kembali oleh siapa pun kecuali PP — dan itu jebakan.

**Pembekuan ada di pelaku, bukan di sasaran:** kalau Struktur si Akun sendiri
Non-Aktif, Akun-akunnya mati (tiket 19) sehingga ia tidak bisa memakai satu pun sel
di barisnya. Pemulihannya datang dari Struktur di atasnya. Itu benar, dan datangnya
dari keputusan Keadaan Akun — bukan dari matriks.

### Penolakan wajib memuat jalan keluarnya

Bukan sekadar menyebutnya sebagai saran — lihat tiket 26:

| Penolakan | Jalan keluar yang wajib ditawarkan |
| --- | --- |
| masih ada anak Aktif | pintasan **"Pindahkan semua Komisariat Aktif ke PW"** + jalan ke pemindahan satuan |
| induknya Non-Aktif | jalan ke pemindahan satuan Struktur itu sendiri |

Aksinya sendiri (`action.ts`) mengembalikan galat yang cukup kaya untuk permukaan
membangun tawaran itu — jumlah anak Aktif, dan id-nya.

### Cache

`updateTag` di `action.ts`, berpasangan dengan `cacheTag` di `_data/`. Ikuti pola
yang sudah ada di repo.

## Selesai bila

- Menonaktifkan PP ditolak, siapa pun pelakunya
- Menonaktifkan induk yang punya anak Aktif ditolak, dengan hitungan dalam galatnya
- Menonaktifkan induk yang anaknya semua Non-Aktif berhasil
- Mengaktifkan anak yang induknya Non-Aktif ditolak
- Jejak `non_active_at` / `non_active_by` terisi dan terkosongkan dengan benar
