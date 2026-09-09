# Gambar disimpan di volume, bukan object storage

Gambar unggahan — foto Kader, logo Struktur, gambar Artikel — semula disimpan
di object storage S3-compatible (MinIO saat pengembangan, RustFS di production)
dan diakses lewat presigned URL. Kami mencabutnya: byte pindah ke satu volume
Docker yang di-mount ke aplikasi, dan `Bun.S3Client` beserta lima variabel
`S3_*` hilang dari `src/`. RustFS tetap hidup di host production, tetapi
perannya berubah dari sumber gambar menjadi sasaran backup yang disegarkan
Dokploy secara berkala.

Alasannya bukan biaya dan bukan beban operasional, melainkan
**reproduksibilitas antar-lingkungan**. Berkas tidak pernah ikut berpindah saat
data production disalin ke staging atau ke mesin pengembang — yang tersalin
hanya basis datanya. Akibatnya lingkungan non-production penuh baris yang
menunjuk ke berkas yang tidak ada di situ. Ini bukan dugaan: `.env.local`
menunjuk bucket `kammiidz` yang tidak pernah ada (bucket yang berisi bernama
`kammiid`), dan `minio.license` yang dibutuhkan `docker-compose.yml` tidak
pernah ada di mesin mana pun. Storage lokal sudah mati dari dua sisi tanpa ada
yang menyadarinya, karena memang tidak pernah terpakai.

Skalanya ikut membantu keputusan ini: seluruh isi bucket saat ditimbang hanya
**44 objek, 173,9 MB**. Ini bukan beban yang membutuhkan object storage.

## Considered Options

**Mempertahankan object storage dan memperbaiki ritual penyalinannya** adalah
opsi nol yang paling murah. Ditolak karena penyalinan itulah yang selama ini
tidak pernah terjadi justru karena berbelit — kredensial, bucket, dan perkakas
terpisah dari jalur `pg_dump` yang sudah rutin dipakai.

**Postgres (`bytea`)** ditimbang serius dan merupakan satu-satunya opsi yang
menyembuhkan penyakitnya secara struktural: bila byte ikut di dalam basis data,
satu `pg_dump -Fc` membawa segalanya, dan mode gagal "baris menunjuk berkas yang
tidak ada" menjadi **mustahil**, bukan sekadar jarang. Pada 174 MB ongkosnya
dapat diabaikan, dan `bytea` di atas 2 KB otomatis masuk TOAST yang terkompresi.

Opsi itu tidak diambil. Konsekuensinya dicatat di bawah dan diterima dengan
sadar.

## Consequences

**Mode gagal berkas-hilang tetap hidup.** Volume tidak ikut `pg_dump`; ia
artefak kedua yang harus disalin sendiri. Karena itu dua hal menjadi **wajib,
bukan pelengkap**: `/api/images/*` mengembalikan placeholder alih-alih rusak
ketika berkasnya tidak ada, dan ada satu perintah (`assets:pull`) yang menarik
volume production ke mesin lokal. Tanpa keduanya, keputusan ini tidak
menyelesaikan masalah yang melahirkannya.

**Volume bernama `kammi-uploads`, izinnya ditegakkan saat deploy.** Aplikasi
berjalan sebagai uid 1001 (`nextjs`); volume baru dimiliki root. Izin diurus
init container ber-`chown`, mengikuti pola `rustfs_perms` yang sudah dipakai di
host — bukan langkah manual di README, yang akan terlupakan saat volume dibuat
ulang.

**Kunci lama tidak disentuh.** 44 kunci yang sudah tercatat di `member.photo`,
`organization.logo`, `article.featured_image`, dan blob JSON `site_settings`
tetap apa adanya, sehingga tidak ada satu baris pun ditulis ulang di production.
Sebagian nilai lama berbentuk URL penuh `https://assets.kammi.id/kammiid/…`;
itu diterjemahkan oleh satu konstanta beku `LEGACY_ASSET_PREFIX`, bukan oleh
variabel lingkungan yang sudah dicabut. Konstanta itu permanen dan memang
demikian adanya.

**Kunci baru berbentuk `<uuid>.<ext>`, tanpa nama berkas asli.** Di object
storage nama dari pengunggah hanyalah potongan string; di filesystem ia menjadi
path sungguhan. Sekalian, memperbarui gambar menulis kunci baru lalu menghapus
yang lama — bukan menimpa — sehingga cache `next/image` yang berumur 24 jam
tidak lagi menyajikan gambar basi setelah penggantian.

**`/api/images/*` tetap terbuka tanpa gerbang**, sama seperti sebelumnya. Foto
Kader memang tampil di halaman publik `tentang/pengurus`, jadi menggerbanginya
adalah keputusan produk yang belum diambil, bukan pekerjaan teknis. Ini
keputusan sadar, bukan kelalaian.

**RustFS tetap terpapar ke internet** meski sudah berhenti menjadi origin dan
tidak ada lagi permukaan yang menunjuk ke sana. Ini juga keputusan sadar.
Siapa pun yang kelak mengerjakan gerbang auth per-gambar perlu tahu bahwa
`/api/images/*` bukan satu-satunya pintu menuju byte yang sama.

**Backup berlapis dua, keduanya di luar aplikasi.** Volume masuk backup berkala
Dokploy dengan RustFS sebagai sasaran, ditambah snapshot host dari penyedia.
Aplikasi tidak boleh tahu RustFS ada — menulis ganda dari dalam aplikasi akan
menyeret `Bun.S3Client` kembali ke `src/` dan membatalkan separuh keputusan ini.
