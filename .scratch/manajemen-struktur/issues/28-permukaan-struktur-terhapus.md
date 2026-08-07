# 28 — Permukaan Struktur Terhapus dan pemulihannya

**Type:** implementation
**Status:** open
**Blocked by:** 13, 15, 18, 20

Spec: [`../spec.md`](../spec.md) §8.4, §1.4, §1.5, §4.3

**Panggil `/impeccable`, `/shadcn`, dan `base-ui-docs`.** Repo ini memakai **BaseUI**
sebagai lapisan primitif Shadcn, **bukan RadixUI**.

## Pekerjaan

**Permukaan berdiri sendiri**, bukan filter di `/dashboard/branches`. Untuk **Root
dan BPW PP**.

### Gate — yang paling gampang salah

`pulihkan` **bukan** `role === 'root'`, dan **bukan**
`role === 'root' || role === 'bpw'`. **Yang lolos hanya Root dan BPW yang Struktur
terhubungnya PP.** BPW PD dan BPW PDLN tetap nol. Menyalin pola `role === 'bpw'` dari
tempat lain **membuka pemulihan untuk seluruh BPW se-Indonesia**. Gate-nya sudah ada
di tiket 18 — pakai, jangan tulis ulang.

> Kenapa BPW PP ikut, bukan Root saja: matriks sudah memberi BPW PP hak **hapus** atas
> `PW, PDLN, PD, PK`. Hak menghapus tanpa hak membatalkan membuat **tiap salah hapus
> jadi eskalasi ke Root** — padahal salah hapus persis peristiwa yang paling sering
> dilakukan orang yang punya tombolnya. Cakupannya tetap bersih: BPW PP mencakup
> seluruh Indonesia kecuali PP, dan PP tidak akan pernah bisa Terhapus.

### Kenapa berdiri sendiri, bukan filter

Ia bertumpu pada invarian tiket 20: tiap pembacaan menyaring Terhapus. Cara teraman
menjaga invarian itu adalah punya **tepat satu** fungsi baca yang **sengaja melakukan
kebalikannya**, dipakai oleh **tepat satu** permukaan. Filter berbasis peran di
`/dashboard/branches` justru melubangi invarian di halaman yang paling sering dibaca
— dan lubang di permukaan tersibuk adalah lubang yang paling mahal.

**Konsekuensi menyenangkan: Keadaan itu sendiri adalah permukaannya.** Seluruh isi
halaman ini Terhapus, jadi Terhapus dan Non-Aktif **tidak pernah muncul
bersebelahan** — **nol bahasa visual baru** untuk membedakan keduanya.

**Tiap baris wajib menampilkan:** nama, `code` (mono), Jenjang, dan **induk lamanya**.
Induk bukan hiasan — ia yang menentukan urutan pemulihan.

### Pemulihan

Mengosongkan **`deleted_at` DAN `is_non_active`** — Struktur yang Non-Aktif → dihapus
→ dipulihkan kembali sebagai **Aktif**, bukan Non-Aktif. Terhapus → Non-Aktif tidak
pernah mungkin; pemulihan selalu berujung Aktif.

**Gerbangnya konfirmasi biasa, bukan ketik-`code`.** Ia tidak ikut pola sheet: bukan
aksi di sheet Struktur, satu-satunya aksi di permukaan yang seluruh isinya sudah
Terhapus, dan ia **memulihkan** alih-alih menghilangkan.

#### Tabrakan slug: cek saat dibuka, eskalasi jadi form

| Keadaan slug | Perlakuan |
| --- | --- |
| bebas | konfirmasi biasa, satu klik |
| sudah dipungut | **dialog yang sama berubah jadi form** — menyebut siapa yang sekarang memakainya, lalu menyodorkan field slug terisi usulan |

Yang dibeli: pelakunya melihat masalahnya **sebelum** menekan, bukan sesudah.

- **Sufiks otomatis ditolak** — mengubah URL diam-diam tanpa ada yang memutuskan, dan
  menyembunyikan justru informasi yang menjelaskan kenapa Struktur ini dulu dihapus.
- **"Selalu form" ditolak** — membebani jalur mulus yang jauh lebih sering.

**Server tetap wajib menangani `23505`.** Ada jeda antara cek saat dialog dibuka dan
simpan saat tombol ditekan, dan slug bisa berpindah tangan di dalam jeda itu.
Galatnya mendarat **di field slug** — **pola yang sama persis dengan tiket 25**. Dua
kegagalan dengan sebab identik tidak dijelaskan dengan dua cara berbeda; yang berbeda
hanya salinannya, sebab di sini pemilik barunya ada dan bisa dinamai.

#### Pemulihan menuntut induk yang hidup — ditolak **dengan langkah berikutnya**

Aturan cermin berlaku penuh, sebab pemulihan selalu berujung Aktif.

| Keadaan induk | Penolakannya berbunyi |
| --- | --- |
| **Non-Aktif** | aktifkan induknya, atau pindahkan Struktur ini ke induk yang hidup (tiket 26) |
| **juga Terhapus** | induk itu ada di **permukaan yang sama ini** — **sebut namanya dan tautkan ke barisnya**, supaya urutan pemulihan terbaca tanpa harus dicari |

Kasus kedua nyata karena **anak Terhapus tidak menghitung untuk prasyarat hapus**
(tiket 22), sehingga rantai Terhapus-di-bawah-Terhapus mungkin terjadi:

```
PD Jakarta      (Terhapus)
 └─ PK Percobaan (Terhapus)
```

**Pemulihan berantai otomatis DITOLAK.** Memulihkan induk sekaligus seluruh
keturunannya adalah perubahan keadaan massal yang tidak diminta. Pulihkan **dari atas
ke bawah, satu per satu**, dengan permukaan yang menunjukkan urutannya.

### Keadaan kosong

**Nol Struktur Terhapus adalah keadaan normal dan sehat, bukan kegagalan** —
penghapusan memang untuk salah catat, dan salah catat memang jarang. Keadaan
kosongnya **harus berbunyi begitu**, bukan "tidak ada data ditemukan".

## Selesai bila

- BPW PD dan BPW PDLN **tidak** bisa membuka rutenya — uji langsung, ini gate yang
  paling gampang salah
- Pemulihan mengosongkan dua kolom, berujung Aktif
- Slug bentrok: dialog jadi form saat dibuka, **dan** `23505` server mendarat di field
- Induk Terhapus → penolakan menyebut nama dan menautkan barisnya
- Keadaan kosong berbunyi sehat, bukan seperti kegagalan
- Struktur Terhapus nol muncul di permukaan lain mana pun
