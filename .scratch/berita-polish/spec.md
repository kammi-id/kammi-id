# Poles Berita: copy, tipografi, unggah gambar, dan form artikel

**Status:** ready-for-agent

Keputusan domain yang berlaku: `CONTEXT.md` mendefinisikan **Berita KAMMI
se-Indonesia** (dulu "Berita Jaringan"), **Gambar Utama**, dan **Galeri**.
ADR 0008 menetapkan migrasi production tetap dijalankan manusia. ADR 0012 dan
0013 menyebut nama lama dan sengaja tidak ditulis ulang. ADR 0014 menetapkan
Permalink sebagai alamat yang berkuasa. ADR 0016 dan 0017 lahir dari spec ini.

## Problem Statement

Enam keluhan dari Candidate Production, yang setelah ditelusuri ternyata
berasal dari empat sebab yang sama sekali berbeda ukurannya.

Dua keluhan pertama murni copy: judul section beranda menyebut "Berita
Terbaru" dan "Berita Jaringan", padahal yang dimaksud adalah Berita milik
Struktur yang sedang dilihat dan Berita dari seluruh Indonesia. Permintaan
"sembunyikan kalau kosong" sudah terpenuhi sejak awal — kedua section memang
sudah mengembalikan `null` saat tak ada Berita.

Keluhan ketiga — badan tulisan tanpa jarak antar paragraf — punya sebab
tunggal yang tidak terlihat dari kode: `@tailwindcss/typography` tidak pernah
terpasang, sehingga kelas `prose` di perender publik **dan** di editor dasbor
adalah kelas mati sejak hari pertama.

Keluhan keempat dilaporkan sebagai "gambar di tengah artikel tidak dirender",
dan itu bukan yang terjadi. Perender, sanitizer, dan perintah `setImage`
editor semuanya terbukti benar lewat uji headless; badan artikel yang
dikeluhkan memang tidak pernah memuat node gambar. Yang gagal adalah langkah
unggahnya: server hanya menerima JPG/PNG/WebP sementara input file menyatakan
`accept="image/*"`, dan kegagalannya ditelan `console.error` tanpa satu pun
pesan ke pengguna. Foto HEIC dari iPhone — default kamera Apple — masuk ke
lubang ini, dan begitu pula seluruh unggahan di 13 pemanggil `ImageUpload`
lain: Kader, logo Struktur, hero halaman.

Keluhan kelima dan keenam adalah pekerjaan sesungguhnya: form artikel satu
kolom panjang yang memperlakukan judul sebagai field biasa, `Select` yang
menampilkan VALUE alih-alih LABEL di 20 tempat di seluruh dasbor, dan Gambar
Utama yang hanya sanggup menampung satu gambar.

## Solution

Empat tiket berurutan, dari yang paling murah ke yang paling mahal, supaya
perbaikan yang kelihatan cepat sampai ke Candidate Production lebih dulu
sementara yang menyentuh skema basis data masuk terakhir.

Istilah domain **Berita Jaringan** menjadi **Berita KAMMI se-Indonesia** dan
alamat publiknya pindah ke `/berita/seindonesia` dengan redirect permanen.
Rename berhenti di situ: cache tag, nama index basis data, nama berkas
komponen, dan prosa ADR lama tidak ikut — ADR adalah catatan bertanggal, dan
cara benar mencatat rename adalah ADR baru.

**Gambar Utama** tetap tepat satu dan selalu ditunjuk eksplisit, karena ia
yang mewakili Artikel di kartu arsip dan saat Permalink dibagikan — ketiganya
hanya sanggup memuat satu gambar. **Galeri** menempati kolom baru di
sampingnya, bukan menggantikannya.

Konversi HEIC dipasang di lapisan penyimpanan, bukan di jalur artikel, karena
bug yang sama menganga di 13 tempat lain.

## Non-Goals

- **Dukungan AVIF.** Build `sharp` yang ada punya decoder HEIF tapi
  `avif.input = false`. Mengejarnya berarti mengganti build `sharp` di image
  production demi format yang praktis tidak pernah dipakai orang mengunggah.
  AVIF ditolak dengan pesan jelas, bukan diam-diam.
- **Menjalankan migrasi ke basis data production.** ADR 0008 menyatakan
  production tetap manual dan itu bukan kelalaian. Tiket 04 menghasilkan
  berkas migrasi dan wizard langkahnya; eksekusinya milik manusia.
- **Caption per gambar Galeri.** Kalau sebuah gambar perlu diterangkan,
  tempatnya di badan tulisan lewat sisip-gambar yang sudah ada.
- **Kartu Berita KAMMI se-Indonesia yang menaut ke host production.** Di
  Candidate Production kartu-kartu itu menaut ke `https://kammi.id/...`, bukan
  ke host candidate. Nyata, tapi di luar cakupan spec ini.
