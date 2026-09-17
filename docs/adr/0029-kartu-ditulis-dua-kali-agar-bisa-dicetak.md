# Kartu Tanda Anggota ditulis dua kali agar bisa dicetak — dan tidak membuktikan apa pun

Seorang Kader meminta kartunya dalam dua bentuk sekaligus: di layar, dan sebagai
berkas yang bisa ia cetak. Bentuk kedua itulah yang mahal, sebab tidak ada satu
pun pustaka di repositori ini yang mengubah DOM menjadi gambar, dan pilihan yang
paling jelas justru yang paling tidak cocok di sini.

`html2canvas` — jawaban refleks untuk soal semacam ini — tidak bisa mengurai
`oklch`, dan seluruh warna proyek ini adalah `oklch` sejak Tailwind v4. Ia tidak
gagal dengan berisik; ia merender hitam. Menambahkan Playwright ke kontainer
production untuk memotret kartu yang sungguhan menyelesaikan soalnya dengan
sempurna dan membawa satu peramban penuh ke dalam citra yang hari ini tidak
punya satu pun.

## Decision

**Kartu diekspor lewat rute server: `satori` merender SVG, `sharp` mengubahnya
menjadi JPEG, dan PDF-nya adalah gambar itu di atas halaman seukuran kartu.**
`sharp` sudah menjadi dependensi. Ukurannya 85,6 × 54 mm — 1011 × 638 piksel
pada 300 dpi, resolusi cetak yang wajar untuk kartu di dompet.

**Konsekuensinya kartu ditulis dua kali**: sekali sebagai komponen React yang
dilihat Kader di dasbornya, sekali lagi sebagai templat `satori`. `satori` hanya
memahami sebagian CSS dan tidak memahami `oklch`, jadi versi keduanya memakai
warna heksadesimal dan tata letak flex yang sederhana. Duplikasi ini adalah
harga yang dibayar sadar, bukan kelalaian yang menunggu dirapikan: ia satu-satunya
jalan yang menghasilkan kedua format secara deterministik, pada resolusi cetak,
tanpa peramban di dalam kontainer.

**Dan kartu ini menampilkan, tidak membuktikan.** Tidak ada QR, tidak ada
halaman verifikasi, tidak ada tanda tangan. Apa yang tertera dibaca dari data
Kader pada saat kartunya dibuat, dan tidak ada pihak ketiga yang memeriksanya.
Yang tampil: foto, nama, **Nomor Induk Anggota**, Struktur, **Jenjang
Kaderisasi**, dan tahun masuk — ditambah **Keadaan Kader hanya ketika ia bukan
Aktif**, supaya seorang Alumni atau Kader yang sedang kena Sanksi tidak memegang
kartu yang terbaca sama dengan kartu Kader Aktif. Yang mengunduh hanya
pemegangnya sendiri.

**Tata letaknya tidak menyediakan ruang kosong untuk QR yang belum diputuskan.**
Kotak kosong yang menunggu adalah janji kepada pengguna yang belum tentu ditepati;
menata ulang kartu kelak lebih murah daripada menjelaskan kotak itu sekarang.

## Considered Options

**`html2canvas` + `jspdf` di sisi klien.** Dua dependensi, nol kode server, dan
gugur pada `oklch` — kartunya harus ditulis ulang warnanya agar selamat, yakni
duplikasi yang sama dengan yang dihindari, ditambah dua pustaka.

**Playwright memotret kartu yang sungguhan.** Satu sumber kebenaran, hasil
pixel-exact, sudah ada sebagai devDependency. Ditolak karena harga penempatannya:
sebuah peramban di dalam citra production, dan `docker-entrypoint.sh` beserta
`Dockerfile` ikut berubah untuk fitur yang menghasilkan satu gambar.

**Stylesheet cetak dan "Save as PDF" milik peramban.** Nol dependensi, nol kode,
dan jawaban yang benar seandainya PDF saja cukup. Ditolak hanya karena JPEG
diminta. Jika kelak ternyata tak seorang pun memakai JPEG-nya, opsi ini menjadi
lebih baik daripada yang dipilih, dan keputusan ini layak dibalik.

## Consequences

- **Dua berkas berubah setiap kali desain kartu berubah.** Templat `satori`
  akan tertinggal dari komponennya cepat atau lambat. Uji petik yang membandingkan
  bidang-bidang yang tampil di kedua versi lebih berguna di sini daripada
  perbandingan piksel.
- **Verifikasi lewat QR masih terbuka dan sengaja belum diputuskan**, menunggu
  pembicaraan dengan pemangku kepentingan. Empat bentuk sudah dipetakan dan
  disimpan di `.scratch/kartu-tanda-anggota/issues/07-qr-verifikasi.md`; yang
  penting dicatat di sini adalah bahwa QR bukan penambahan hiasan melainkan
  permukaan baca **anonim pertama** atas data Kader di sistem ini, dan bahwa
  bentuk paling sederhana — QR berisi NIA yang mengarah ke halaman publik —
  menjadikan seluruh daftar Kader nasional dapat ditelusuri, sebab NIA berurutan
  di dalam satu Daerah (ADR 0020).
- Halaman verifikasi apa pun kelak wajib `noindex`. Itu pengecualian terhadap
  ADR 0023, yang membuka seluruh perayap; pengecualiannya harus ditulis di ADR
  itu, bukan dibiarkan sebagai kontradiksi diam.
