---
status: accepted
---

# Waktu terbit adalah instan; zona input mengikuti Humas

`article.published_at` memakai `timestamptz`, menyimpan satu instan yang sama
untuk seluruh pembaca. Humas mengisi jam dalam zona WIB, WITA, atau WIT yang
terlihat eksplisit; pilihan awal mengikuti zona perangkat yang setara.
Perangkat di luar ketiga offset itu jatuh ke WIB yang tetap ditampilkan.
Mengganti zona menampilkan waktu setara tanpa mengubah instan. Pilihan
**Terbitkan sekarang** memakai waktu server pada saat penyimpanan, bukan
jam perangkat.

Keputusan ini menggantikan asumsi penyimpanan tanpa zona pada ADR 0014.
Aturan identitasnya tetap berlaku: tanggal publik serta tahun/bulan Permalink
diturunkan dalam `Asia/Jakarta`. Zona asal input tidak perlu disimpan karena
bukan bagian dari identitas Berita. Event tetap memiliki zona kegiatannya
sendiri, terpisah dari zona input jadwal publikasi.

Mengganti kolom saja ditolak: input tanpa zona masih dapat salah ditafsirkan.
Mempertahankan digit WIB pada kolom tanpa zona juga ditolak karena memerlukan
konversi semu di setiap pembaca dan membuat instan UTC tampak berbeda tujuh jam.

Migrasi menafsirkan setiap nilai lama sebagai jam dinding `Asia/Jakarta`,
bukan zona sesi Postgres. Tanggal publik, urutan, kelayakan Terbit, presisi,
NULL, dan Permalink lama harus tetap sama. Kesalahan input zona masa lalu
memerlukan koreksi editorial tersendiri; migrasi tidak menebak maksud Humas.
Aplikasi lama dan baru tidak boleh berjalan bersamaan terhadap skema ini.
Lihat [prosedur rilis dan rollback](../operations/publication-timezones.md).
