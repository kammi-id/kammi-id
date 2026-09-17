# Galeri: kolom baru, bukan pengganti Gambar Utama

Sebuah **Artikel** boleh membawa **Galeri** — nol atau lebih gambar tambahan —
lewat kolom baru `gallery_images text[]`. Kolom `featured_image` yang sudah
ada **tidak** ikut diubah menjadi array dan tetap satu-satunya sumber Gambar
Utama. Kedua kolom hidup berdampingan, bukan satu menggantikan yang lain.

Gambar Utama tidak pernah disimpulkan dari urutan `gallery_images` —
menghapus, menambah, atau mengurutkan ulang Galeri tidak pernah mengubah
Gambar Utama secara diam-diam. Keduanya dua keputusan terpisah yang kebetulan
disunting di kotak unggah yang sama.

## Considered Options

**Menyatukan keduanya jadi satu `images text[]`**, dengan elemen pertama
sebagai Gambar Utama, adalah bentuk yang paling ringkas secara skema — satu
kolom, bukan dua. Ditolak karena ia justru menciptakan tepat kerusakan yang
ingin dihindari: mengurutkan ulang Galeri (operasi yang seharusnya kosmetik)
bisa diam-diam memindahkan Gambar Utama begitu elemen pertama array berubah.
`ImageUpload` — komponen bernilai-tunggal yang dipakai 13 pemanggil lain di
luar Artikel — juga tidak punya cara menyatakan "elemen array yang mana" tanpa
kontraknya sendiri berubah.

**Mengubah `featured_image` menjadi array berkapasitas satu** demi keseragaman
tipe kolom ditolak karena tidak menyelesaikan masalah apa pun: constraint
"tepat satu elemen" tetap harus ditegakkan di level aplikasi persis seperti
kolom `text` biasa, hanya dengan indirection tambahan setiap baca dan tulis.

## Consequences

`ImageUpload` (kontrak `value`/`onChange` bernilai tunggal) tetap tidak
disentuh. Kotak unggah Galeri di form Artikel adalah komponen baru yang
menulis ke dua field berbeda (`featuredImage` sebagai string, `galleryImages`
sebagai array) dari satu widget thumbnail — bukan menyunting `ImageUpload`
agar mendukung banyak nilai.

Karena Gambar Utama adalah field independen, sebuah Artikel bisa punya Galeri
tanpa Gambar Utama (untuk Halaman, yang mana Gambar Utama opsional) atau
Gambar Utama tanpa Galeri. Halaman publik yang merender Galeri harus
menganggap keduanya sebagai dua pertanyaan terpisah, bukan "apakah array
kosong".
