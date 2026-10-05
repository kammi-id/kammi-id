# Staging diisi data production, bukan seed

Lingkungan non-production diisi dengan **restore `pg_dump` production** ditambah
salinan volume `kammi-uploads` production, bukan dengan `bun run db:seed`.
Alasannya: staging yang berisi data buatan hanya membuktikan fitur berjalan di
atas data yang bentuknya sudah kita duga, sedangkan sebagian besar kejutan di
sistem ini justru lahir dari bentuk data nyata — Struktur yang bersarang lebih
dalam dari yang diperkirakan, Kader tanpa foto, Daurah dengan peserta yang
Membernya sudah dihapus.

Penyalinannya **manual dan sesuai kebutuhan**, dijalankan dari mesin lokal
sebagai perantara. Ia bukan bagian dari pipeline CD.

## Considered Options

**`db:seed` dengan volume kosong** adalah opsi yang lebih aman dan sempat
diusulkan. Ia cukup untuk pertanyaan "fitur ini jalan atau tidak", dan
`/api/images/*` sudah mengembalikan placeholder untuk berkas yang tidak ada
(lihat ADR 0006), sehingga staging tanpa gambar pun tidak rusak. Ditolak demi
alasan di atas.

**Sinkronisasi terjadwal dari staging ke production** ditolak karena ia menuntut
kunci SSH permanen dari mesin non-production ke mesin production. Itu
menjadikan staging — yang postur keamanannya memang lebih longgar — sebagai
pintu belakang menuju production, dan menukar kenyamanan penyegaran data dengan
jalur pergerakan lateral yang permanen. Perantara berupa mesin lokal lebih
merepotkan, dan kerepotan itulah harga yang dibayar untuk tidak memiliki jalur
tersebut.

**Menjadikannya bagian tiap deploy** ditolak karena restore `pg_dump` mengubah
deploy dari hitungan detik menjadi menit, dan menaruh operasi destruktif di
jalur yang berjalan otomatis puluhan kali seminggu.

## Consequences

**Data pribadi Kader hidup di mesin dengan postur keamanan lebih longgar.**
Nama, foto, jenjang kekaderan, dan riwayat orang sungguhan berada di host
non-production — host yang panelnya baru saja dipasangi TLS, yang aksesnya
lebih luas, dan yang memang diperlakukan sebagai tempat mencoba-coba. Ini
konsekuensi utama keputusan ini dan satu-satunya alasan ia layak dicatat.

**Keputusan ini batal, bukan ditambal, bila staging dibuka lebih luas.** Selama
yang memegang akses staging adalah orang yang juga berhak melihat data
production, keputusan ini bertahan. Begitu ada kontributor, vendor, atau
demo-user yang diberi akses staging tanpa hak itu, jawabannya adalah kembali ke
`db:seed` — bukan menambahkan penyamaran data di atas salinan yang sudah
telanjur ada.

**Kunci gambar harus tersalin persis.** Volume dan basis data adalah dua
artefak terpisah (ADR 0006); menyalin salah satu tanpa yang lain menghasilkan
staging penuh baris yang menunjuk berkas yang tidak ada. Itu tidak merusak —
placeholder menanganinya — tetapi ia diam-diam mengembalikan persis penyakit
yang ADR 0006 obati, kali ini di lingkungan yang tugasnya justru menemukan
penyakit semacam itu.
