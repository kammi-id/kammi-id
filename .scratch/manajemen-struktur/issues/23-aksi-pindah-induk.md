# 23 — Aksi pindah induk

**Type:** implementation
**Status:** open
**Blocked by:** 18, 24

Spec: [`../spec.md`](../spec.md) §6.1, §6.2, §6.3

## Pekerjaan

**Aksi berdiri sendiri**, bukan langkah di dalam alur penonaktifan. Alurnya dua
langkah: pindahkan dulu, baru nonaktifkan.

Yang berubah **hanya `organization.parentId` milik Struktur yang dipindahkan** — satu
kolom, satu baris. `member.organizationId` dan `training.organizationId` dua-duanya
menunjuk Komisariat, bukan induknya, jadi **Member dan Daurah tidak ke mana-mana**.

### Batas calon induk: `pwCode` tidak boleh berubah

**Ini rumusan yang dipakai. Bukan "dalam PW yang sama".**

Rumusan lama adalah **proxy yang bocor**: ia tidak terdefinisi untuk PK di bawah PDLN
(`pwCode = '99'`, nol PW) dan **meloloskan penyeberangan terselubung** PDLN → PW —
yang persis kebohongan permanen yang ditolak untuk PD antar-PW.

**Calon induk sah bila `pwCode` hasil penurunan NIA tidak berubah.**

| Yang dipindah | Calon induk sah | `pwCode` |
| --- | --- | --- |
| PK di bawah PD | PD lain di PW itu, atau **PW itu sendiri** | tetap, mis. `19` |
| PK di bawah PDLN | **PDLN lain** | tetap `99` |

Satu invarian, dua kasus, nol hafalan terpisah. Hitung lewat `resolveOrgCodes`
(`src/lib/utils/member.ts:15-42`), jangan menuliskan ulang aturannya.

### PD tidak pindah antar-PW

Secara mekanis bisa — satu kolom — tapi **tidak ada versi pemindahan langsung yang
menjaga NIA tetap jujur**, karena nomor PW ikut terkunci di `code` yang beku:
membiarkan NIA menyebut PW lama = bohong permanen; menurunkan nomor PW dari induk
baru = `pdCode` tetap dari kode sendiri, sehingga dua PD berbeda berbagi kolam nomor.

Rumusan `pwCode` di atas sudah menolaknya tanpa aturan khusus.

### Pelakunya hanya BPW PP dan Root — nol sel baru di matriks

Pemindahan cuma "kelola Struktur yang dipindah" **dan** "kelola induk tujuan" — dua
hak yang keduanya sudah punya (tiket 18). **Jangan tambahkan sel baru ke matriks.**
Rumusan `pwCode` membatasi **daftar calon**, bukan **siapa yang boleh**.

### Pintasan massal

Satu aksi terpisah: **"Pindahkan semua Komisariat Aktif ke PW"**, dipanggil dari
penolakan penonaktifan (tiket 21 → tiket 26).

Ia dipilih karena **tidak pernah bisa gagal**: tiap anak sebuah PD berada di PW itu,
dan PW selalu calon induk yang sah untuk semuanya. Nol kasus gagal, nol validasi per
baris.

Sifatnya **penitipan, bukan penempatan** — memindahkan lima PK ke PW supaya PD yang
bubar bisa dinonaktifkan hari ini, lalu ditempatkan ulang satu per satu kemudian.

**Satu aksi = satu gerbang**: yang diketik `code` **PD sumbernya sekali**, bukan lima
kode anak (tiket 26).

### Cache

`updateTag` di `action.ts`, berpasangan dengan `cacheTag` di `_data/`.

## Selesai bila

- Memindahkan PK ke PD lain di PW yang sama berhasil
- Memindahkan PK langsung ke PW-nya berhasil
- Memindahkan PK dari PDLN ke sebuah PW **ditolak** (`pwCode` berubah `99` → `19`)
- Memindahkan PK dari PDLN ke PDLN lain berhasil
- Memindahkan PD **ditolak**
- Nol baris selain `parentId` berubah
- Nol sel baru di matriks tiket 18
