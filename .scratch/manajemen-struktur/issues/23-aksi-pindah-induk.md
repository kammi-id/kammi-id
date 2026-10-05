# 23 — Aksi pindah induk

**Type:** implementation
**Status:** resolved
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

## Answer

Empat berkas baru, nol permukaan — tiket 26 yang memasang dialognya. Aksinya
sudah bisa dipanggil dan sudah dijaga.

### Aturannya pindah ke satu berkas murni

`src/lib/struktur/pindah-induk.ts` — `checkMoveCandidate` mengembalikan pesan
penolakan atau `null`, seidiom gate-gate di `lib/auth/`, plus
`filterMoveCandidates` untuk daftar calon. Nol basis data, jadi ia diuji sebagai
tabel argumen ke hasil: 23 kasus, seluruh sel DoD di antaranya.

**Ada satu hal yang spec klaim tapi tidak benar; `spec.md` §6.2 sudah
diamandemen di tempat.** §6.3 bilang rumusan `pwCode` "sudah menolak" pemindahan
PD "tanpa aturan khusus". Ia menolak PD **antar-PW** — pwCode tujuannya beda.
Yang tidak ia tolak: PD ke PD lain di PW yang sama (pwCode dua-duanya `01`),
yang secara bentuk pohon omong kosong. Hal yang sama berlaku PK ke PK. Jadi ada
**dua aturan, bukan satu**:

1. **`pwCode` tidak berubah** — rumusan spec, dihitung lewat
   `resolveRegisterNumberCodes`, bukan ditulis ulang.
2. **Bentuk pohon**, dengan klausa penitipan: calon sah bila ia boleh menampung
   Struktur itu (`isLegalChildType`) **atau** boleh menampung induknya yang
   sekarang. Klausa kedua itulah seluruh isi "naik satu tingkat ke PW" — PK di
   bawah PW bukan bentuk yang boleh **dibuat**, tapi bentuk yang boleh
   **dicapai** oleh pemindahan.

Urutannya **penting untuk pesannya, bukan untuk hasilnya**: `pwCode` ditanya
lebih dulu, sebab PK di bawah PDLN yang ditawari PW gagal di dua-duanya, dan
hanya satu yang bisa menjelaskan diri. "PK tidak dapat berada di bawah PW"
dibuat bohong oleh klausa penitipan; "Nomor Induk berubah" tetap benar.

### Gerbangnya nol sel baru, dan konjungsinya yang menyempitkan

`requireStrukturMoveAccess` di `lib/auth/kestrukturan.ts` = `sunting` atas
Struktur yang dipindah (lewat gate yang sudah ada, Cakupan dan aturan
bukan-Struktur-sendiri ikut) **dan** `buat` atas induk tujuan di dalam Cakupan.

**Tujuannya ditanya dengan `buat`, bukan `sunting`, dan itu yang menentukan
hasilnya.** "Kelola induk tujuan" adalah hak membuat Struktur muncul di
bawahnya. Kalau ditanya `sunting`, BPD lolos — ia memang punya `sunting` atas PD
dan PK. Dengan `buat`, BPD nol, dan BPKOM tersaring Cakupan tujuan. Yang tersisa
persis **BPW PP dan Root**, tanpa nama siapa pun ditulis di kode.

### Aksinya

`branches/_components/move-parent/` — `moveStrukturParentAction` (satuan) dan
`moveActiveChildrenToParentAction` (pintasan massal ke induk sumbernya). Ketik
`code` diverifikasi di server. Kewenangan pada pintasan massal dicek **per
anak**; yang tunggal adalah gerbang ketiknya, bukan pemeriksaannya.

Penulisannya lewat `moveOrganizationParent(ids, parentId)` di
`db/query/organization.ts` — satu kolom, satu statement, dan sengaja bukan
`updateOrganization({ parentId })` supaya tidak ada tempat bagi kolom kedua untuk
menyelinap. Diuji dengan membandingkan seluruh baris sebelum dan sesudah:
**hanya `parentId` yang berbeda**, dan Kader beserta Nomor Induknya tidak
bergerak.

### Keadaan induk tujuan — di aturannya, bukan di daftarnya

**Satu keputusan yang spec tidak buat**: induk tujuan wajib **Aktif**. Terhapus
dijawab persis seperti slug yang tidak pernah ada (§1.4 — nol permukaan boleh
bilang "sudah dihapus"); Non-Aktif ditolak atas dasar yang lebih sempit — aturan
cermin §6.4 membuat Struktur yang diparkir di bawah induk mati tidak bisa
dihidupkan sampai ia dipindahkan lagi, jadi menerimanya sama dengan menerima
jalan buntu.

Letaknya di `checkMoveCandidate`, **bukan** di query daftar calon. Versi pertama
menaruhnya di pembaca daftar, dan review menemukan lubangnya: aksinya sendiri
tetap menerima induk Terhapus, sebab jalur tulis tidak pernah lewat daftar itu.
Aturan yang cuma menyaring pilihan bukan aturan.

**Pembaca daftar calonnya sendiri dibuang.** Ia nol konsumen — permukaannya
tiket 26 — dan versi yang ditulis membaca seluruh Struktur **tanpa Cakupan**,
sesuatu yang hanya bisa diputuskan benar oleh permukaan yang tahu sesinya.
`filterMoveCandidates` tetap ada sebagai aturannya; tiket 26 memanggilnya dengan
kolam yang sudah ia batasi sendiri.

### Satu tabrakan dengan penjaga tiket 24

Tes `member.test.ts` melarang berkas mana pun selain `lib/utils/member.ts`
memanggil `resolveOrgCodes` — penjaga yang dipasang setelah cabang per-Jenjang
pernah tersalin. Berkas ini awalnya melanggarnya. Perbaikannya bukan
memperlonggar penjaganya melainkan lewat pintu yang benar:
`resolveRegisterNumberCodes(candidate, null)`. Untuk calon induk, pertanyaannya
"PW mana yang ia namai", dan tanpa induk untuk ditanya itulah yang dijawab tiap
Jenjang.
