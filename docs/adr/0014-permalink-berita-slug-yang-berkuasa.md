# Permalink Berita: slug yang berkuasa, tanggal yang mengikut

**Permalink** sebuah **Berita** berbentuk `/berita/<tahun>/<bulan>/<slug>`,
tetapi yang menentukan Berita mana yang dilayani hanyalah **slug**-nya. Tahun
dan bulan diturunkan dari tanggal terbit dan tidak ikut menjadi kunci. Alamat
yang membawa tahun atau bulan yang tidak cocok tetap menemukan Beritanya, lalu
dijawab dengan **pengalihan permanen** ke bentuk kanoniknya.

Penurunan tahun dan bulan dilakukan dalam **Asia/Jakarta**, di satu tempat, dan
tidak pernah dihitung ulang di pemanggil.

## Considered Options

**Menjadikan tanggal ikut berkuasa** — keunikan slug diperlebar menjadi per
tahun-bulan — adalah bentuk yang membuat URL menyuarakan strukturnya sendiri.
Slug yang sama boleh dipakai lagi di bulan lain, dan setiap segmen di dalam
alamat benar-benar berarti sesuatu.

Opsi itu ditolak karena harganya migrasi keunikan pada tabel yang sudah berisi
data produksi, demi kemampuan yang belum dibutuhkan siapa pun: tidak ada
permintaan untuk memakai ulang slug lintas bulan. Ia juga memindahkan biaya ke
tempat yang salah — mengubah tanggal terbit sebuah Berita menjadi operasi yang
bisa bertabrakan dengan Berita lain, padahal hari ini ia sekadar menggeser
alamat.

**Membiarkan tahun dan bulan murni kosmetik**, melayani 200 untuk alamat apa pun
yang slug-nya cocok, adalah opsi termurah dan ditolak paling cepat: ia
menciptakan alamat tak terbatas untuk satu Berita, dan mesin pencari membacanya
sebagai konten duplikat.

## Consequences

Mengubah tanggal terbit sebuah Berita **memindahkan Permalink**-nya. Itu bukan
efek samping, itu definisi — tanggal terbit bagian dari identitas Berita. Yang
menahan kerusakannya adalah riwayat alamat: alamat yang pernah sah tetap
mengantar ke bentuk kanonik yang baru.

Riwayat itu disimpan untuk Berita, **tidak** untuk slug Struktur. Asimetrinya
disengaja dan berdasarkan bagaimana keduanya berubah: slug Berita diketik
manusia, sering salah, dan sering dibetulkan setelah tautannya telanjur
disebar; slug Struktur nyaris tidak pernah berubah, dan ketika berubah biasanya
karena Struktur itu memang berganti identitas. Untuk slug Struktur, pilihannya
mencegah — memperingatkan keras saat slug Struktur yang Situsnya sudah aktif
hendak diubah — bukan memulihkan.

Zona waktu bukan detail kenyamanan. Kolom tanggal terbit disimpan tanpa zona
waktu, sehingga penurunan yang lalai memakai UTC akan menempatkan Berita yang
terbit pukul 06.00 WIB tanggal 1 Januari ke dalam alamat bulan Desember tahun
sebelumnya. Kesalahan ini tidak pernah muncul di pengujian yang memakai tanggal
tengah hari, dan selalu muncul pada berita pagi.

Karena tahun dan bulan tidak menyaring apa pun, pencarian Berita dari sebuah
alamat tidak menjadi lebih murah dengan adanya keduanya. Siapa pun yang kelak
menambahkan penyaringan berdasarkan tahun atau bulan ke jalur ini sedang diam-
diam memindahkan keputusan ini ke opsi yang sudah ditolak di atas.
