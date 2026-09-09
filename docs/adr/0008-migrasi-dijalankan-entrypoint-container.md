# Migrasi dijalankan entrypoint container, digerbangi `RUN_MIGRATIONS`

Deployment berkelanjutan ke non-production menuntut skema basis data ikut naik
bersama kodenya; bila tidak, tiap tiket yang menyentuh skema meninggalkan
lingkungan yang rusak sampai ada yang menjalankan migrasi dengan tangan. Kami
memilih menjalankannya dari **entrypoint container**: stage `runner` di
`Dockerfile` ikut membawa migrator runtime Drizzle dan `src/db/__migrations`,
dan entrypoint menjalankan migrator sebelum `bun server.js` — tetapi
**hanya** bila `RUN_MIGRATIONS=1` diset. Non-production menyetelnya; production
tidak, dan migrasinya tetap dijalankan manusia.

## Considered Options

**Satu step di GitHub Actions yang menyambung langsung ke Postgres** adalah
opsi paling sederhana dan mati lebih dulu: Postgres tidak diekspos ke internet,
dan mengeksposnya semata agar runner CI bisa menyentuhnya adalah harga yang
salah untuk kenyamanan yang salah.

**Image kedua khusus migrasi**, dijalankan sebagai one-shot container sebelum
aplikasi naik, lebih bersih secara pemisahan tanggung jawab — alat pengubah
skema tidak pernah masuk image yang melayani trafik. Ditolak karena ia
melahirkan artefak kedua yang harus dibangun, ditandai, dan dijaga tetap
sinkron dengan yang pertama. Begitu satu tertinggal satu commit, migrasinya
tidak lagi cocok dengan kode yang akan menjalankannya, dan mode gagalnya
senyap.

**Membiarkan migrasi manual selamanya** adalah keadaan sekarang, dan justru
itulah yang sedang dihapus — untuk non-production saja.

## Consequences

**Image production ikut membawa perkakas migrasi.** `drizzle-kit` adalah
`devDependency`, dan sampai keputusan ini ia memang tidak pernah ada di stage
`runner`. Sekarang ada, di setiap image, termasuk yang melayani production.
Permukaan image bertambah, dan alat yang sanggup mengubah skema kini duduk di
dalam container production. Ini ongkos nyata yang diterima sadar, dan alasan
utama keputusan ini dicatat alih-alih dijalankan diam-diam.

**Gerbangnya adalah ketiadaan variabel, bukan ketiadaan alat.** Tanpa
`RUN_MIGRATIONS`, entrypoint langsung `exec` ke server tanpa menyentuh basis
data. Bentuk gagalnya tertutup: variabel yang lupa diset berarti migrasi tidak
jalan, bukan migrasi jalan di tempat yang salah.

**Entrypoint jalan di setiap container start, bukan setiap deploy.** Restart
container non-production — oleh Dokploy, oleh reboot host, oleh apa pun —
menjalankan migrasi lagi. `drizzle-kit migrate` idempoten karena jurnalnya,
jadi ini aman; tetapi keamanannya bersandar pada properti itu, dan siapa pun
yang kelak menyisipkan langkah non-idempoten ke jalur ini akan mematahkannya.

**Pagar `db-guard` mati di non-production, sengaja.** `DATABASE_URL`
non-production menunjuk hostname jaringan Docker, bukan `localhost`, sehingga
`src/lib/db-guard/` menolaknya sebagai production. Container non-production
karena itu menyetel `DB_GUARD_ACK=1` permanen. Pagar itu memang dibangun untuk
dilewati lewat pintu ini, tetapi perlu dicatat bahwa di non-production ia tidak
lagi melindungi apa pun.

**Production tetap manual, dan itu bukan kelalaian.** Perbedaannya hanya satu
variabel lingkungan, yang berarti mengubah kebijakan ini kelak tidak menuntut
perubahan kode sama sekali — cukup satu baris di panel. Kemudahan itu justru
alasan tambahan untuk mencatatnya di sini: seseorang bisa membatalkan seluruh
kebijakan production tanpa sengaja meninggalkan jejak di dalam repositori.
