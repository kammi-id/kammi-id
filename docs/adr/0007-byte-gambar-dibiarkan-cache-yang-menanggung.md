# Byte gambar dibiarkan apa adanya, cache yang menanggung

Gambar unggahan tidak pernah dikompres ulang — tidak di gerbang unggah, tidak
pula secara surut atas 44 berkas yang sudah ada. Sumbernya memang besar: potret
Pengurus di `site-settings/leadership/` berupa PNG **4–10 MB**, yang terbesar
3421 × 3980 piksel, dan hero halaman depan JPEG 1,8 MB. Sebagai gantinya
ongkosnya dipindahkan ke sisi penyajian: hasil optimasi `next/image` disimpan di
volume yang selamat dari redeploy, dan `minimumCacheTTL` dinaikkan ke **31
hari**. Sharp tetap harus membongkar PNG 10 MB, tetapi hanya sekali per ukuran
per deploy, bukan pada setiap pengunjung.

Ini keputusan menahan gejala, bukan menyembuhkan penyakit, dan diambil dengan
sadar demikian.

## Considered Options

**Re-encode di gerbang unggah** — `storage.ts` mengubah setiap unggahan ke WebP
dan membatasi dimensi maksimum. Inilah satu-satunya opsi yang menutup kran:
setelahnya berkas sebesar ini tidak bisa lahir lagi. Opsi ini **tidak ditolak
karena salah, melainkan sengaja dikeluarkan dari lingkup** perbaikan ini agar
perubahannya tetap kecil. Siapa pun yang kelak mengerjakannya tidak sedang
membatalkan keputusan ini — ia sedang menyelesaikan apa yang ditunda di sini.

**Kompres ulang 44 berkas yang sudah ada** — ditolak untuk sekarang karena ia
menulis ke volume production, dan ADR 0006 menyatakan kunci lama tidak disentuh.
Menimpa di tempat berarti mengubah isi di balik kunci yang menurut ADR itu
bersifat tetap; menulis kunci baru berarti menyunting baris DB yang sengaja
dibiarkan utuh. Keduanya keputusan tersendiri, bukan efek samping perbaikan
performa.

**Menambahkan AVIF ke `formats`** — ditolak, dan jangan ditambahkan nanti.
Dokumentasi Next menyebut AVIF ~50% lebih lama di-encode. Encode dingin persis
ongkos yang sedang ditekan di sini; menambah AVIF memperbesarnya sambil
menggandakan isi cache.

## Consequences

**`minimumCacheTTL: 2678400` bertentangan dengan anjuran dokumentasi Next**,
yang menyarankan TTL rendah. Anjuran itu berlaku karena tidak ada mekanisme
invalidasi cache gambar — dan itu tidak relevan di sini: menurut ADR 0006,
mengganti gambar **menulis kunci baru lalu menghapus yang lama, bukan menimpa**.
Sebuah kunci `<uuid>.<ext>` karenanya tidak pernah berubah isi, sehingga hasil
optimasinya tidak bisa basi. Jangan "membetulkan" angka ini kembali ke nilai
rendah tanpa lebih dulu membatalkan sifat immutable kunci itu.

**Volume `.next/cache` menjadi menanggung beban, dan letaknya di luar repo.**
Ia artefak kedua yang harus ada di luar `pg_dump` setelah `kammi-uploads`, dan
menyimpan masalah izin yang sama: aplikasi berjalan sebagai uid 1001, volume
baru dimiliki root, jadi ia butuh init container ber-`chown` mengikuti pola yang
sudah dipakai host. Tanpa volume itu, keputusan ini **tidak menghasilkan apa
pun** — cache hangus setiap redeploy dan seluruh PNG dibongkar ulang dari nol.
Ini bukan pelengkap; ini separuh keputusannya.

**Gerbang unggah tetap terbuka.** Besok seseorang masih bisa mengunggah PNG 10
MB berikutnya lewat dasbor, dan tidak ada yang mencegahnya. Keputusan ini
membuat keadaan itu bisa ditanggung, bukan tidak mungkin terjadi.

**Halaman depan tidak boleh lagi menarik seluruh gambarnya sekaligus.** Karena
byte sumbernya tetap besar, kapan gambar diminta menjadi penting. `next/image`
memakai atribut `loading` bawaan browser, dan lazy loading bawaan hanya diam
untuk elemen yang tidak punya kotak layout sama sekali — `display: none`, bukan
`opacity: 0` maupun `visibility: hidden`. Layer yang menyimpan potret Pengurus
di `HomeScene` karenanya disembunyikan dengan `display`, dan bukan sekadar
gaya penulisan: menggantinya kembali ke `opacity` akan diam-diam mengembalikan
tiga PNG multi-megabyte ke dalam pemuatan pertama halaman.
