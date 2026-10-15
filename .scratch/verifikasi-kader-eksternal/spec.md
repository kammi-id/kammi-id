# Verifikasi Kader Eksternal

## Tujuan

Menyediakan verifikasi satu Kader melalui Nomor Induk Anggota untuk pemegang
Kunci Verifikasi, tanpa menjadikan profil Kader dapat dicari atau dibaca penuh.

## Kontrak

- `GET /api/v1/members/{nia}` menerima Kunci Verifikasi pada header
  `Authorization: Bearer <secret>`.
- Respons `200` hanya memuat `nia`, `nama`, `keadaanKader`,
  `jenjangKaderisasi`, serta `struktur.nama` dan `struktur.jenjang`.
- Hanya Kader Aktif dan Alumni yang dapat ditemukan. NIA tidak ada, Kader
  Non-Aktif, terkena Sanksi, Terhapus, atau di luar kontrak semuanya `404`.
- Kunci salah atau dicabut memberi `401`; lebih dari 60 permintaan dalam satu
  menit per kunci memberi `429`.

## Pengelolaan dan audit

- Root dapat membuat beberapa Kunci Verifikasi, mencabutnya, dan melihat
  metadata tanpa secret. Secret hanya tampil sekali dan disimpan sebagai hash.
- Setiap permintaan dicatat selama 90 hari dengan kunci, waktu, hasil, dan
  alasan penolakan; NIA mentah tidak dicatat.
- Respons selalu membaca data terbaru dan tidak menyimpan cache lintas
  permintaan.

## Non-goals

- Tidak ada data atau pendaftaran Mitra, pembatasan Cakupan, maupun profil
  lengkap, kontak, alamat, tanggal lahir, atau riwayat Kader.
- Tidak ada halaman verifikasi anonim atau mekanisme verifikasi lanjutan di
  luar KAMMI.id.
