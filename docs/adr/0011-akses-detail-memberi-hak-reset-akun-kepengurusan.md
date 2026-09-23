# Akses detail memberi hak reset Akun Kepengurusan turunan

Root, BPH, dan BPW yang dapat membuka detail sebuah Struktur boleh mereset Akun
Kepengurusan aktual milik Struktur tersebut. Hak ini hanya berjalan ke Struktur
turunan, tidak mencakup Struktur pelaku sendiri, dan tidak mencakup Akun Kader.
Kami menerima perluasan kewenangan ini agar pemulihan akses dapat dilakukan oleh
setiap pengurus yang memang diberi visibilitas kestrukturan, tanpa memperluas hak
kelola Kader atau matriks aksi kestrukturan yang sudah ada.

## Consequences

Reset memakai gate tersendiri yang mengulang pemeriksaan Cakupan dan hubungan
Akun–Struktur pada saat mutasi. Pelaku wajib memverifikasi ulang passwordnya;
penggantian hash, pencabutan seluruh sesi sasaran, dan pencatatan audit permanen
harus berhasil atau gagal bersama dalam satu transaksi. Struktur Non-Aktif tetap
dapat menjadi sasaran, tetapi Akun Kepengurusannya tetap tidak dapat login sampai
Struktur diaktifkan kembali. Struktur Terhapus dan Struktur pelaku sendiri tetap
tidak dapat menjadi sasaran dari permukaan ini.
