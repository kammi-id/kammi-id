# Keadaan Struktur satu sumbu, walau disimpan dua kolom

Sebuah Struktur berada pada **tepat satu** Keadaan dalam satu waktu: Aktif,
Non-Aktif, atau Terhapus. Penyimpanannya tidak mencerminkan itu — Keadaan
tersebar di dua kolom yang secara teknis bisa menyala bersamaan,
`organization.is_non_active` dan `organization.deleted_at`. Kami memutuskan
model tetap satu sumbu, dan menetapkan **Terhapus mendominasi Non-Aktif**:
selama `deleted_at` terisi, Struktur itu Terhapus, apa pun isi
`is_non_active`.

Derivasi itu tidak boleh dihitung ulang di tiap pemanggil. Ia hidup sebagai
satu kolom turunan (`generatedAlwaysAs`) di tabel `organization`, mengikuti pola
yang sudah dipakai `level` dan `code_slug` di tabel yang sama, sehingga skema
menyuarakan modelnya sendiri.

## Considered Options

Bentuk yang paling jujur adalah **satu kolom enum** (`aktif` | `non_aktif` |
`terhapus`) menggantikan `is_non_active`. Model dan penyimpanan jadi satu benda,
dan kombinasi yang tidak sah menjadi mustahil, bukan sekadar terlarang.

Opsi itu dibatalkan karena harganya migrasi di basis data production:
`is_non_active` sudah berisi data nyata dan sudah punya call-site baca yang
menyaring dengannya. Menukarnya dengan kolom enum berarti memindahkan data hidup
demi kerapian yang sepenuhnya bisa dicapai lewat kolom turunan — dan kolom
turunan tidak butuh backfill sama sekali.

**Dua sumbu betulan** — Terhapus dan Non-Aktif ditampilkan berdampingan — juga
dipertimbangkan dan ditolak. Charting sudah menetapkan pemulihan mengembalikan
Struktur langsung ke Aktif; di bawah model dua sumbu, pemulihan jadi harus
diam-diam ikut membersihkan sumbu yang bukan urusannya, dan aturan diam-diam
seperti itu yang justru ingin dihindari.

## Consequences

Skema tidak menegakkan aturan ini pada kolom mentahnya — `is_non_active` dan
`deleted_at` tetap bisa menyala bersamaan, dan itu sah. Baris seperti itu berarti
Struktur yang dulu Non-Aktif lalu dihapus, dan Keadaannya **Terhapus**. Jangan
"membetulkan" data dengan mengosongkan `is_non_active` saat penghapusan:
mendominasi bukan berarti menghapus, dan kolom turunannya sudah membaca
urutannya dengan benar.

Pemulihan mengosongkan **dua-duanya**. Sebuah Struktur yang Non-Aktif, lalu
dihapus, lalu dipulihkan, kembali sebagai **Struktur Aktif** — bukan sebagai
Non-Aktif seperti sebelum dihapus. Ini konsekuensi sadar dari pemulihan yang
selalu berujung Aktif, bukan kelalaian.

Ini masalah yang sama dengan yang dicatat ADR 0001 untuk Keadaan Kader, dengan
penyelesaian yang lebih baik: di sana aturannya hanya hidup di UI, di sini
setidaknya pembacaannya hidup di skema. Yang masih sama adalah bahaya jalur
tulisnya — siapa pun yang menambah jalur tulis baru ke Keadaan Struktur wajib
menjaga urutan dominasi ini sendiri.
