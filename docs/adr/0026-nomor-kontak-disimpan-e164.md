# Nomor kontak disimpan E.164 dalam satu kolom, dengan pengecualian nomor asing

`member.phone` selama ini `text` bebas tanpa validasi. Yang tersimpan di
production campur aduk — `08…`, `62…`, `+62 816-4697-6710`, dan sejumlah baris
yang sekadar `-`. Setiap permukaan yang ingin memakainya menebak formatnya
sendiri, dan tebakan itu sudah tersalin ke `profile-info.tsx`. Tanpa kode
negara, nomor Kader PDLN tidak punya bentuk yang benar.

## Decision

**Satu kolom, isinya E.164** (`+` diikuti kode negara dan nomor, tanpa
pemisah). Yang menentukan kode negaranya adalah karakter pertama yang diketik:

- diawali `+` atau `00` → kode negaranya dipercaya apa adanya
- selain itu → Indonesia, dinormalisasi jadi `+62…`

Sehingga `08123456789`, `8123456789`, dan `628123456789` sama-sama tersimpan
sebagai `+628123456789`, sementara `+971501234567` tersimpan utuh.

**Validasinya tidak sama rata.** Nomor Indonesia diperiksa sungguh-sungguh:
sesudah `+62` harus mulai `8`, panjang 9–13 digit. Nomor asing hanya diperiksa
bentuk E.164 umum, total 8–15 digit. Salah ketik nomor Indonesia yang sering
terjadi dan paling merugikan — tombol WhatsApp mati diam-diam. Nomor asing
sedikit, dan orang yang punya nomor asing tahu nomornya.

**Normalisasi tinggal di server**, di skema Zod yang dipakai kelima pintu
masuk termasuk impor XLSX. Aturan yang hanya hidup di klien akan diselundupi
impor besok pagi.

**Baris lama yang cacat dibiarkan utuh.** Yang dikonversi hanya yang tidak
kehilangan apa pun. Sisanya menunggu manusia — nomor cacat masih menjadi
petunjuk bagi yang membetulkannya, dan menebak isinya membuang informasi yang
tidak bisa dikembalikan.

## Considered Options

**Dua kolom: kode negara dan nomor lokal.** Ditolak. Setiap query, setiap
form, dan setiap baris impor jadi menanggung dua kolom, dan pertanyaan "nomor
siapa ini" tetap dijawab dengan menggabungkan keduanya lebih dulu.

**`libphonenumber-js`.** Ia memvalidasi per negara dengan benar dan akan
menangkap nomor Uni Emirat Arab yang panjangnya salah. Ditolak untuk sekarang:
~145 KB untuk satu kolom, sementara data staging tidak memuat satu pun nomor
berkode negara selain 62. Kalau kelak PDLN benar-benar mengisi nomor asing
dalam jumlah berarti, keputusan ini murah dibalik — yang berubah hanya isi satu
fungsi validasi.

**Membiarkan teks bebas dan menormalisasi saat dibaca.** Ini yang berjalan
sekarang secara tak sengaja. Ditolak: normalisasi saat baca berarti setiap
pembaca menyimpan tebakannya sendiri, dan tebakan itu sudah mulai bercabang.

## Consequences

- Backfill menyentuh data production. Ia berdiri sebagai migrasi tersendiri
  supaya bisa dibatalkan tanpa menyeret perubahan lain.
- Nomor yang tampil di layar berubah bentuk bagi hampir semua Kader: `081…`
  jadi `+62 81…`. Penyajiannya boleh dipercantik, tapi yang tersimpan tetap
  E.164.
- Tombol WhatsApp (`.scratch/daurah-cakupan-kontak-label/issues/05`) bergantung
  pada keputusan ini; `wa.me` meminta persis E.164 tanpa `+`.
- Baris cacat yang tidak ikut dikonversi akan tetap ada sesudah migrasi. Setiap
  pemakai nomor harus tahan menghadapinya, bukan mengandaikan seluruh kolom
  sudah bersih.
