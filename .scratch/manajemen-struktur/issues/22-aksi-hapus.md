# 22 — Aksi hapus

**Type:** implementation
**Status:** resolved
**Blocked by:** 13, 18, 20

Spec: [`../spec.md`](../spec.md) §3, §1.3, §1.5

## Pekerjaan

**Penghapusan selalu soft.** Tidak ada hard delete, selamanya (ADR 0004), dan setelah
tiket 13 basis data sendiri yang menjaminnya.

Menulis `deleted_at` beserta `deleted_by`. **`is_non_active` tidak disapu** —
Terhapus mendominasi Non-Aktif, tapi mendominasi bukan berarti menghapus. Struktur
yang Non-Aktif lalu dihapus tetap menyala `is_non_active`, dan itu sah.

### Prasyarat — berbunyi lengkap

**Nol Struktur anak, nol Member, nol Daurah.**

Tiga klausa yang diputus di tiket berbeda dan gampang hilang saat dirakit. Tulis
ketiganya:

1. **Anak Non-Aktif MENGHITUNG.** Induk dengan anak Non-Aktif tidak bisa dihapus
   selama anak itu masih ada. Itu tidak apa-apa — penghapusan memang untuk salah
   catat.
2. **Anak Terhapus TIDAK menghitung.** Terhapus diperlakukan seolah barisnya tidak
   pernah ada, jadi ia tidak boleh menahan apa pun. Konsekuensi yang dibayar sadar:
   **rantai Terhapus-di-bawah-Terhapus jadi mungkin** — tiket 28 yang menanganinya.
3. **Publikasi BUKAN prasyarat.** Artikel, Kategori Artikel, dan Pengaturan Situs
   boleh menggantung.

### Prasyarat berlaku untuk SEMUA, Root termasuk

**Cakupan membatasi jangkauan; prasyarat menjaga konsistensi. Root menembus yang
pertama, tidak pernah yang kedua.**

Prasyarat **tidak masuk gate mana pun** (tiket 18). Ia diperiksa di jalur ini,
**terpisah dan sesudah gate**. Menaruhnya di dalam gate akan membuat orang
menyimpulkan bahwa Kewenangan yang cukup tinggi bisa menembusnya.

### Keadaan asal tidak dilihat

Struktur Non-Aktif boleh langsung dihapus. Prasyarat nol-isi adalah **satu-satunya**
penjaga. Mengharuskan Struktur diaktifkan dulu sebelum dihapus itu ritual tanpa
perlindungan tambahan — orang tinggal klik Aktifkan lalu Hapus, dan Struktur
Non-Aktif yang kosong melompong justru persis kasus "dibuat lalu tidak jadi berjalan"
yang penghapusan ada untuknya.

### Galatnya harus cukup kaya untuk kalimat

Permukaan (tiket 26) menulis "Tidak bisa dihapus: masih ada 847 Kader dan 3
Komisariat" sebagai **kalimat utuh**, bukan tooltip. Aksinya mengembalikan hitungan
per prasyarat, bukan boolean.

### Cache

`updateTag` di `action.ts`, berpasangan dengan `cacheTag` di `_data/`.

## Selesai bila

- Menghapus Struktur yang punya Member hidup ditolak — **Root juga**
- Menghapus Struktur yang punya anak Non-Aktif ditolak
- Menghapus Struktur yang anaknya cuma Terhapus **berhasil**
- Menghapus Struktur yang punya Artikel menggantung **berhasil**
- `is_non_active` tidak berubah saat penghapusan
- Nol `db.delete` atas `organization` di mana pun

## Answer

`deleteStrukturAction` di `branches/_components/delete-struktur/`, dengan
prasyaratnya sebagai fungsi murni `checkDeletion` di
`src/lib/struktur/keadaan.ts`.

### Prasyaratnya berbunyi lengkap, dan satu klausa datang gratis

Ketiga hitungan dikumpulkan di aksi lalu diadili `checkDeletion`, yang menulis
ketiga klausanya di satu docblock alih-alih menyebarkannya ke pemanggil.

**Klausa "anak Terhapus tidak menghitung" tidak ditulis di sini sama sekali** —
ia datang dari `readOrganization`, yang `withOrganizationCTE`-nya sudah
menyaring Terhapus sejak tiket 20. Jadi anak Non-Aktif menghitung dan anak
Terhapus tidak, tanpa satu baris pun di jalur ini yang menyebut Keadaan. Itu
persis bentuk yang tiket 20 dibuat untuk menghasilkan.

### Prasyarat sesudah gate, di luar gate, mengikat semua

Gate ditanya lebih dulu, prasyarat sesudahnya, dan prasyaratnya **tidak ada di
gate mana pun**. Root menembus Cakupan, tidak pernah menembus prasyarat — dan
itu diuji dengan sesi Root, bukan diasumsikan.

### Galat yang cukup untuk satu kalimat

`DeleteStrukturState.counts` membawa ketiga angka, dan `checkDeletion` merangkai
kalimatnya: `"Tidak bisa dihapus: masih ada 847 Kader dan 3 Komisariat."` —
koma di antara, satu `dan` di akhir, dan **kata domain yang benar per Jenjang**
(`describeChildJenjang`: anak PD adalah Komisariat, anak PW adalah Daerah). Yang
nol tidak disebut.

### Keadaan asal tidak dilihat

Struktur Non-Aktif dihapus langsung. Tesnya membuktikan `is_non_active` tetap
menyala sesudahnya — mendominasi bukan menghapus.

### Nol hard delete

`softDeleteOrganization` cuma menyentuh `deleted_at` dan `deleted_by`.
Penjaganya `tests/no-hard-delete-struktur.test.ts`: ia memindai sumber, bukan
menjalankannya, sebab yang dijaga adalah **ketiadaan** sebuah jalur. Ia juga
menguji dirinya sendiri — bahwa daftar berkasnya tidak kosong dan polanya
benar-benar menangkap yang dicarinya — sebab penjaga yang lolos karena tidak
memindai apa pun bukan penjaga.

### Keputusan yang spec tidak buat

**Kader yang sudah dihapus lunak tidak dihitung.** §3 berbunyi "nol Member"
tanpa kualifikasi, dan §1.3 justru berargumen sebaliknya ("yang sudah punya
sejarah tidak keliru"). Yang mengalahkannya adalah argumen §3 sendiri, satu
paragraf di bawahnya, soal kenapa Publikasi bukan prasyarat: **"Struktur salah
buat yang sempat dicoba dengan satu draft artikel akan jadi tak bisa dihapus
selamanya"**, dan `code` yang beku membuatnya nyangkut permanen. Persis sama
bentuknya untuk satu Kader salah input yang sudah dihapus. Kalau pengguna mau
arah sebaliknya, tambalannya satu baris di
`countLiveMembersByOrganization`. **Dilaporkan, bukan diselundupkan.**

### Tes

`branches/_components/delete-struktur/action.test.ts` — 13 kasus, satu per butir
Selesai-bila plus gerbang kode, sesi, dan Kewenangan. Fixture bersufiks, nol
`TRUNCATE` (alasannya di §Answer tiket 21).

`bun test`: 502 lolos, 0 gagal, dua run penuh berturut-turut.
