# 10 — Kartu bagikan gaya plakat: cabut scrim, pakai plakat opak

**What to build:** Kartu Bagikan berhenti menggelapkan foto demi judul.
Fotonya tampil apa adanya, dan keterbacaan dijamin oleh plakat putih opak —
chip identitas di kiri atas, plakat judul di bawah, pil merah tanggal.

**Blocked by:** None. Tiket 06–08 tidak menunggu tiket ini dan sebaliknya.

**Status:** ready-for-agent

**Mencabut keputusan visual tiket 04.** Tiket 04 memasang scrim gelap penuh
kanvas (75% di bawah menuju 35% di atas) dan membenarkannya panjang lebar:
`ImageResponse` tidak bisa mengukur kecerahan foto, jadi gradiennya dipatok
cukup gelap agar judul selamat dari foto paling terang, dengan konsekuensi
yang diterima sadar — foto yang sudah gelap menjadi tambah gelap.

Alasan itu benar **selama judulnya ditulis langsung di atas foto**. Begitu
judul duduk di dalam plakat opak, kontrasnya dijamin oleh plakat, bukan oleh
seberapa gelap fotonya — dan scrim berubah dari penjaga keterbacaan menjadi
pajak yang dibayar setiap foto tanpa imbalan. Karena itu scrim dicabut, bukan
dikendurkan. Tiket 04 tetap berstatus `done`: keputusannya benar untuk tata
letak yang ia bangun, dan catatannya sengaja dibiarkan utuh sebagai sejarah.

Yang **tidak** berubah: satu komponen, satu tata letak, dua mode; byte gambar
diambil sendiri saat render (ADR 0006/0007) dan setiap kegagalan jatuh ke mode
tanpa gambar tanpa melempar; font tetap dari CDN.

## Anatomi

Empat elemen, urutan dari atas:

- [ ] **Chip identitas, kiri atas.** Plakat putih membulat berisi logo
      Struktur dan **nama Struktur** sebagai teks. Struktur tanpa logo
      menampilkan **nama Struktur saja** — tidak pernah emblem PP dan tidak
      pernah wordmark "KAMMI.id". Emblem PP di sebelah nama PW adalah bug
      tiket 02 dalam bentuk gambar: atribusi yang salah alamat.
- [ ] **Plakat judul, bawah.** Putih opak, teks gelap, **tinggi mengikuti
      isi** — judul satu kata mendapat plakat pendek, bukan kotak besar
      berisi teks yang mengambang. Maksimal 3 baris.
- [ ] **Baris kedua di dalam plakat** untuk `subtitle`, teks abu, hanya pada
      kartu seksi (`/berita`, `/event`, `/tentang`). `subtitle` **tidak
      pernah** masuk ke pil.
- [ ] **Pil merah, di bawah plakat.** Isinya **hanya tanggal terbit**, jadi
      hanya kartu Berita yang punya pil. Pil menjawab satu pertanyaan —
      *kapan* — dan tidak dipakai menampung teks lain yang kebetulan tersisa.

## Mode tanpa gambar

- [ ] Tata letak **identik**, di atas gradien navy yang sudah ada. Gradiennya
      tidak diganti merah: pil merah butuh latar yang bukan merah untuk tetap
      terbaca sebagai aksen.

## Warna

- [ ] Merah pil diambil dari `--primary` (`oklch(0.52 0.2 17)` di
      `src/app/globals.css`). satori tidak membaca CSS custom property, jadi
      nilainya wajib jadi hex literal.
- [ ] Hex-nya hidup sebagai **konstanta bernama** di `src/components/og-image/`
      dengan komentar yang menyebut token asalnya. Navy `#0c2340` hari ini
      ditulis inline tanpa keterangan dan karena itu tidak ada yang tahu dari
      mana ia berasal — jangan diulang untuk warna baru, dan beri navy
      keterangan yang sama sekalian.

## Judul dan pemotongan

- [ ] `TITLE_MAX_CHARS_BY_FONT_SIZE` di `src/components/og-image/utils.ts`
      **dikalibrasi ulang**, tidak diwarisi mentah: teks gelap di dalam plakat
      dengan padding dalam punya lebar efektif yang berbeda dari teks putih
      selebar kanvas.
- [ ] `utils.test.ts` diperbarui mengikuti angka baru. `truncateTitle` tetap
      pagar terakhir terhadap luber — `-webkit-line-clamp` sudah dicoba dan
      ditolak di tiket 04 karena diterima tanpa error lalu tidak mengklip apa
      pun.

## Empat pemanggil, semuanya

- [ ] Permalink Berita — chip nama Struktur, plakat judul, pil tanggal, foto
      penuh bila ada Gambar Utama.
- [ ] `/berita`, `/event`, `/tentang` — chip nama Struktur, plakat judul,
      `subtitle` sebagai baris kedua, tanpa pil, mode tanpa gambar.
- [ ] Root `/` (`src/app/opengraph-image.tsx`) — chip "KAMMI.id", plakat
      **"Kesatuan Aksi Mahasiswa Muslim Indonesia"**, `subtitle` dibuang.
      Tanpa perubahan ini kartunya menulis "KAMMI.id" dua kali: sekali di chip,
      sekali di plakat. Rute ini hidup di luar `[strukturSlug]` dan memang
      tidak punya Struktur untuk diresolve — itu bukan kelalaian, catatan yang
      sudah ada di berkas dipertahankan.

## Verifikasi

- [ ] `check:types`, `check:lint`, `check:structure` hijau — **tetapi tidak
      dianggap cukup.** Ketiganya hijau sepenuhnya saat `-webkit-line-clamp`
      diam-diam tidak bekerja; properti CSS yang no-op lolos ketiganya.
- [ ] **Render manual** lewat `next dev`, screenshot untuk empat kasus,
      dilampirkan ke `## Comments` di berkas ini:
      1. judul satu kata,
      2. judul 140 karakter,
      3. Berita tanpa Gambar Utama (mode tanpa gambar),
      4. Struktur tanpa logo (chip teks saja).

## Bukan bagian tiket ini

- Tidak ada uji snapshot byte PNG — satu byte font berubah, snapshot merah.
- Tidak ada ADR. Keputusan ini murah dibatalkan (satu berkas); yang mahal
  hanya kalau alasannya hilang, dan itu dijaga oleh tiket ini.
- Tidak ada perubahan pada `OgImageInput` selain yang dituntut di atas.
