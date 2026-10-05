# Verifikasi Kader dengan Kunci Bersama, bukan profil yang dapat dicari

Nomor Induk Anggota berurutan dan profil Kader memuat data pribadi, sehingga
permukaan yang dapat dicari pihak ketiga akan menjadi alat enumerasi nasional.
Karena itu integrasi eksternal adalah **Verifikasi Kader** dengan **Kunci
Verifikasi** bersama: satu Nomor Induk Anggota menghasilkan identitas dan
keadaan organisasi yang telah diizinkan, bukan profil lengkap. Root dapat
membuat beberapa kunci, merotasi, dan mencabutnya; kunci dapat dibagikan kepada
siapa saja, aplikasi tidak mengenali pemegang maupun membatasi Cakupan. Secret
ditampilkan tepat sekali, disimpan dalam bentuk hash, dan tidak dapat dibaca
kembali. NIA tidak ditemukan dan Kader selain Aktif atau Alumni merespons
secara identik.

## Consequences

- Nomor telepon, alamat, tanggal lahir, dan seluruh riwayat Kader tidak pernah
  menjadi bagian dari kontrak verifikasi awal.
- Kader Non-Aktif, terkena Sanksi, dan Terhapus tidak dapat diverifikasi;
  Kader Aktif dan Alumni mengirim satu enum keadaan tanpa riwayatnya.
- Respons berhasil hanya memuat Nomor Induk Anggota, nama, Keadaan Kader,
  Jenjang Kaderisasi, serta nama dan Jenjang Struktur saat ini. Struktur selalu
  dibaca dari Member, tidak pernah diurai dari Nomor Induk Anggota.
- Setiap kunci dibatasi 60 permintaan per menit. Data selalu dibaca mutakhir;
  audit Root selama 90 hari mencatat waktu, hasil, dan alasan penolakan tanpa
  menyimpan Nomor Induk Anggota mentah.
- Batas ini melanjutkan risiko enumerasi yang telah dicatat ADR 0020 dan 0029;
  ia bukan halaman verifikasi anonim yang masih dibiarkan terbuka di ADR 0029.
