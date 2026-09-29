# 07 — Verifikasi Kartu Tanda Anggota lewat QR

**What to build:** belum diputuskan. Tiket ini menyimpan pilihannya, bukan
jawabannya.

**Blocked by:** keputusan pemangku kepentingan — bukan tiket lain.

**Status:** needs-info

## Duduk perkaranya

Permintaan awalnya: kartu bisa diketuk untuk memunculkan QR yang dapat dipakai
memverifikasi keanggotaan. Pengambil keputusan menunda ini pada 9 September 2026
untuk dibicarakan lebih dulu dengan pemangku kepentingan. Kartunya tayang tanpa
QR (tiket 04), dan **tanpa ruang kosong yang menunggunya**.

Yang membuat ini bukan penambahan hiasan: **halaman verifikasi adalah permukaan
baca anonim pertama atas data Kader di sistem ini.** Segala sesuatu hari ini
berada di balik sesi. Pertanyaannya bukan "QR-nya berisi apa" melainkan "siapa
yang boleh membaca data Kader tanpa masuk, dan sebanyak apa".

## Empat bentuk yang sudah dipetakan

**(a) QR berisi NIA, menunjuk halaman publik `/kta/<NIA>`.** Paling sederhana.
Ditolak sementara dengan alasan kuat: NIA berurutan di dalam satu Daerah
(ADR 0020), jadi seluruh daftar Kader nasional dapat ditelusuri dengan skrip
sepuluh baris.

**(b) QR berisi token HMAC dari id Member terhadap rahasia server.** Tidak dapat
ditelusuri, tanpa kolom baru, dan dapat dicabut serentak dengan memutar
rahasianya. Ini yang direkomendasikan dalam sesi.

**(c) QR berisi muatan bertanda tangan yang diverifikasi tanpa membaca basis
data.** Bekerja luring. Menjadi basi: Kader yang kemudian kena Sanksi tetap
memegang QR yang terbaca sah sampai masa berlakunya habis.

**(d) Halaman verifikasi menuntut login.** Meja pendaftaran Daurah yang dijaga
Pemandu ber-Akun bisa memverifikasi; kantor kampus atau masjid tidak bisa.

## Pertanyaan yang perlu dijawab pemangku kepentingan

1. **Siapa yang memindai?** Jawaban ini yang menentukan (b) atau (d), dan
   jawaban itu bukan keputusan teknis.
2. **Apa yang boleh dilihat pemindai?** Rekomendasi sesi: foto, nama, NIA,
   Struktur, Jenjang Kaderisasi, dan satu putusan keabsahan. **Tanpa telepon,
   alamat, tanggal lahir, atau riwayat** — halaman verifikasi yang menampilkan
   nomor telepon adalah kebocoran data yang menyamar sebagai fitur.
3. **Apa yang terbaca untuk Kader yang tidak sah?** Rekomendasi: "tidak berlaku",
   bukan 404 — perbedaan itu berarti bagi orang yang sedang memegang pemindainya.
4. **Apakah kartu berubah menjadi bukti?** Kalau iya, ADR 0027 perlu ditinjau
   ulang: `member.name` hari ini boleh disunting pemegangnya sendiri, dan itu
   keputusan yang diambil justru karena kartunya **menampilkan, tidak
   membuktikan** (ADR 0029). Kartu yang bisa diverifikasi mengubah taruhannya.

## Bila kelak dikerjakan

Halaman verifikasinya wajib `noindex`. Itu pengecualian terhadap ADR 0023, yang
membuka seluruh perayap AI; pengecualiannya ditulis di ADR 0023, bukan
dibiarkan sebagai kontradiksi diam.
