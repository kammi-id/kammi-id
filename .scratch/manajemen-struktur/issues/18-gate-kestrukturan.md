# 18 — `canManageKestrukturan` dan gate-gatenya

**Type:** implementation
**Status:** open
**Blocked by:** —

Spec: [`../spec.md`](../spec.md) §2 (seluruhnya), terutama §2.5 dan §2.6

## Pekerjaan

Rumahnya `src/lib/auth/kestrukturan.ts` — berkas itu **sudah ada** dan berisi
tambalan keamanan sempit yang harus **diganti**, bukan ditumpangi.

### 1. `canManageKestrukturan(role, jenjangAkun, jenjangSasaran): boolean`

**Murni, nol basis data.** Ini matriks spec §2.2 itu sendiri.

Alasan ia harus murni bukan performa: ini satu-satunya gate di repo yang isinya
cukup banyak untuk salah, dan isi sebanyak itu harus bisa dites sebagai **tabel
argumen-ke-hasil tanpa satu pun fixture**.

Yang wajib terbawa apa adanya dari spec §2.2 dan §2.3:

- **Root:** semua, **kecuali `nonaktifkan`/`aktifkan` atas PP** — Jenjang PP tidak
  bisa dinonaktifkan oleh siapa pun. Larangan pada **sasaran**, bukan pengecualian
  pada pelaku.
- **BPW PP:** `PW, PDLN, PD, PK` untuk seluruh aksi. Termasuk **menghapus sebuah PW
  utuh** — yang melindungi PW bukan Kewenangan tapi isinya (prasyarat). Ditulis
  terang supaya orang berikutnya tidak mengira ini celah lalu "menambalnya".
- **BPW PW:** nol hak kelola. Bukan kelalaian — pembuatan PD tersentralisasi di BPW
  PP, dan PK diurus PD.
- **BPW PD/PDLN:** `PK` saja, nol `pulihkan`.
- **BPH:** hanya `sunting` atas Strukturnya sendiri (gate nomor 4 di bawah).
- **BPK, Humas, Akun Kader:** nol di seluruh baris.
- **BPW PK tidak ada** — Kewenangan itu tidak pernah diterbitkan di Jenjang PK.

### 2. `requireKestrukturanReadAccess(targetOrgId)`

Hak membuka permukaan Struktur. Root/BPH/BPW, sasaran di dalam Cakupan.

### 3. `requireKestrukturanManageAccess(targetOrgId)`

Hak mengubah sebuah Struktur sasaran. Membungkus `readAccessScope` + Cakupan +
fungsi murni + aturan **"sasaran bukan Strukturnya sendiri"**.

> `isOrgInAccessScope` yang sudah ada **tidak cukup** untuk aturan terakhir: ia
> menghitung Struktur si Akun sendiri sebagai anggota Cakupan (lihat cabang `humas`
> di `src/db/query/organization.ts:71-73` yang mengembalikan `[connectedOrgId]`).
> BPW mengelola Struktur **di bawah** Cakupannya, tidak pernah Strukturnya sendiri —
> dan tanpa itu, Cakupan BPW PP yang seluruh Indonesia akan meninggalkan PP editable.

### 4. Gate BPH — tanpa argumen sasaran, mengembalikan Strukturnya

Bentuknya **beda dari tiga di atas**: sasarannya selalu Struktur si Akun, jadi ia
bukan `canManage(target)` melainkan gate tanpa argumen yang **mengembalikan Struktur
itu** — satu panggilan melayani otorisasi sekaligus pembacaan data halaman, nol
pembacaan kedua. Dipakai tiket 25.

Lolos hanya untuk **BPH**. Root tidak butuh jalan ini — ia sudah menyunting Struktur
mana pun lewat `branches`.

Dinamai untuk **hak yang diberikannya**, sesuai AGENTS.md — bukan untuk tindakan
memeriksanya.

### 5. Gate `pulihkan` — yang paling gampang salah

Berdiri sendiri. Ia **bukan** `role === 'root'` saja, dan **bukan**
`role === 'root' || role === 'bpw'`.

**Yang lolos hanya Root dan BPW yang Struktur terhubungnya PP.** BPW PD dan BPW PDLN
tetap nol, sama seperti seluruh baris lain milik mereka. Menyalin pola
`role === 'bpw'` dari tempat lain **membuka pemulihan untuk seluruh BPW
se-Indonesia**.

## Yang diganti, bukan ditumpangi

`requireCreateStrukturAccess` dan `requireEditStrukturAccess` di berkas itu adalah
**tambalan keamanan yang sengaja sempit** (commit `a9c535b`): Cakupan, Jenjang, dan
pembekuan `type`/`parentId`. Keduanya **digantikan** oleh gate di atas — jangan
tinggalkan lapis ketiga di sebelahnya.

**`isLegalChildType` tetap hidup.** Ia menjaga **bentuk pohon**, bukan kewenangan,
dan itu pertanyaan yang berbeda. Jangan ikut dibuang.

`kestrukturan.test.ts` yang sudah ada (17 tes) **dirombak bersamanya** — lihat tiket
29 untuk lapis tesnya.

## Prasyarat penghapusan TIDAK masuk gate mana pun

Ia invarian data, bukan kewenangan. Menaruhnya di dalam gate akan membuat orang
menyimpulkan bahwa Kewenangan yang cukup tinggi bisa menembusnya. Ia diperiksa di
jalur hapus, **terpisah dan sesudah gate** (tiket 22).

## UI memanggil fungsi murni yang sama

Tombol yang tampak dan tulisan yang lolos dijaga **satu sumber** — tidak akan ada
tombol yang menyala lalu ditolak saat dipencet. Ini yang membunuh opsi "satu gate per
aksi": grid 20 kartu × 3 tombol berarti 60 `await` hanya untuk memutuskan tombol mana
yang muncul.

## Selesai bila

- Matriks spec §2.2 terwakili penuh, nol sel kosong
- `bun run check:types` dan `check:lint` hijau
- Dua gerbang sempit lama tidak ada lagi; `isLegalChildType` masih ada
