# 21 — Aksi nonaktifkan dan aktifkan kembali

**Type:** implementation
**Status:** resolved
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

## Answer

Aturan murninya di `src/lib/struktur/keadaan.ts`, sebelah `pindah-induk.ts`, dan
aksinya di `branches/_components/struktur-keadaan/` — pola tiket 23 apa adanya.

**Satu folder untuk dua arah, karena ia satu aturan.** `strukturKeadaanSchema`
melayani keduanya: masukannya identik, dan memecahnya jadi dua akan menyatakan
perbedaan yang tidak ada.

### Penolakan PP mengeluarkan alasan yang benar, dan itu perlu urutan terbalik

`canManageKestrukturan` sudah menolak PP untuk `nonaktifkan`/`aktifkan` sejak
tiket 18. Kalau gate ditanya lebih dulu, PP dijawab **"Antum tidak memiliki hak
akses atas struktur ini."** — jawaban kewenangan atas pertanyaan yang §2.3
tegaskan **bukan** soal kewenangan. Prasyarat nomor 1 di tiket ini jadi kode
mati, dan tesnya lolos tanpa menyentuh masalahnya.

Jadi **klausa PP saja** ditanya sebelum gate, dengan alasannya ditulis di
tempatnya. Ia tidak melubangi apa pun: matriks tetap menolak PP secara
independen, jadi mencabut baris itu tidak membuka apa-apa — yang dibelinya cuma
kalimat yang benar. **Prasyarat lainnya tetap sesudah gate**, di tempat §3
menaruhnya. Tesnya sekarang menuntut bunyi pesannya, bukan cuma `success` yang
`false`.

### Penolakan yang bisa dijadikan tawaran

`StrukturKeadaanState.activeChildren` membawa id **dan** nama tiap anak Aktif,
jadi permukaan tiket 26 bisa merakit pintasan "Pindahkan semua Komisariat Aktif
ke PW" sekaligus jalan ke pemindahan satuan.
`moveActiveChildrenToParentAction` dari tiket 23 cuma butuh id Struktur yang
sama, jadi tautannya sudah terpasang tanpa argumen tambahan.

**Satu jebakan yang diwariskan ke tiket 26:** untuk **PW yang punya anak PD
Aktif**, pintasan massal itu akan ditolak `checkMoveCandidate` (PD naik ke PP
memecah `pwCode`, §6.3). `StrukturKeadaanState` nol bendera untuk
membedakannya. Membuat benderanya sekarang berarti mengarang bentuk yang tiket
26 belum putuskan; dicatat di sini supaya tidak ditemukan lagi dari nol.

### Cerminnya

`checkReactivation` menolak induk yang Non-Aktif **dan** induk yang tidak
terbaca sama sekali dengan satu baris. Yang kedua bukan kasus yang kelewat: itu
bentuk kedatangan induk Terhapus, sebab lapisan baca tiket 20 menyaringnya. Dan
pesannya tidak pernah menyebut kata "hapus" — kalimat itu sendiri membocorkan
bahwa barisnya ada (§1.4).

Mengaktifkan induk **tidak** menghidupkan anaknya, dan itu satu kasus tes
tersendiri.

### Jalur tulisnya sempit

`deactivateOrganization`, `reactivateOrganization` — masing-masing menulis
kolom yang disebut namanya dan tidak lebih, mengikuti preseden
`moveOrganizationParent`.

### Yang ikut dirapikan

Gerbang ketik-`code` ditulis empat kali sebelum ditulis sekali. Ia sekarang di
`src/lib/struktur/konfirmasi.ts`, dipakai kelima aksi termasuk `move-parent`
yang jadi sumbernya. Alasannya bukan estetika: gerbang yang case-sensitive di
satu aksi dan tidak di aksi lain bukan gerbang. `readParent` yang identik di dua
folder naik jadi `readParentOrganization` di lapisan kueri.

### Tes

- `src/lib/struktur/keadaan.test.ts` — 20 kasus, tabel murni, nol fixture.
- `branches/_components/struktur-keadaan/action.test.ts` — 15 kasus rakitan.

**Fixture-nya bersufiks dan membereskan dirinya, tanpa `TRUNCATE`.** Empat belas
berkas tes di repo ini sudah berebut menyapu tabel yang sama, dan versi pertama
berkas ini ikut menyapu — hasilnya satu kegagalan di run penuh pertama, lalu
hijau di tiga run berikutnya. Flaky yang gue buat sendiri, jadi gue cabut
lagi. Konsekuensinya Struktur di-`insert` mentah: `createOrganization` mencetak
Akun bernama persis `root` untuk tiap PP dan `user.name` unik, jadi memakainya
**mengharuskan** menyapu lebih dulu.

`bun test`: 502 lolos, 0 gagal, dua run penuh berturut-turut.
