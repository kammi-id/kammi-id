# Rilis waktu terbit dengan zona input

ADR 0032 mengubah `article.published_at` dari digit jam WIB menjadi instan
`timestamptz`. Berlaku untuk semua jenis Artikel yang memakai kolom itu;
waktu kegiatan Event, `created_at`, dan `updated_at` tidak dimigrasikan.

## Urutan rilis

1. Siapkan image baru dan backup DB yang teruji dapat dipulihkan. Catat image
   lama, marker migrasi, jumlah artikel, dan snapshot `id`, `slug`,
   `organization_id`, `published_at::text`, serta tahun/bulan tanggal terbit.
   Jangan mengandalkan zona sesi untuk konversi.
2. Aktifkan maintenance dan hentikan seluruh instance aplikasi lama, termasuk
   pembaca publik dan penulis dashboard. Ini rilis terkoordinasi, bukan rolling
   update: kode lama membaca digit WIB sedangkan kode baru membaca instan UTC.
3. Jalankan runner migrasi berpagar seperti rilis biasa. Migrasi
   `20261015072542_publication-instant` menjalankan:

   ```sql
   ALTER TABLE article ALTER COLUMN published_at TYPE timestamptz
     USING published_at AT TIME ZONE 'Asia/Jakarta';
   ```

   Drizzle mencatat migrasi yang telah selesai dan menjalankannya di dalam
   transaksi. Ulangi lewat runner jika gagal; jangan menjalankan SQL ini dua kali
   secara manual. Lock timeout runner membatalkan percobaan yang terhalang.

4. Sebelum membuka lalu lintas, cocokkan snapshot lama dengan
   `(published_at AT TIME ZONE 'Asia/Jakarta')::text` dan tahun/bulannya.
   Jumlah, NULL, slug, urutan, dan presisi harus sama. Bandingkan gerbang
   Terbit pada satu instan pemeriksaan tetap, bukan dua waktu berbeda.
5. Jalankan hanya image baru. Build baru memisahkan cache dari build lama.
   Buka ulang formulir dashboard agar tidak mengirim payload dari build lama.
   Periksa input WITA/WIT, simpan tanpa perubahan jadwal, Terbitkan sekarang,
   arsip, permalink, RSS, Markdown, sitemap, dan galat runtime. Buka lalu lintas
   setelah pemeriksaan lulus.

## Rollback

Sebelum membuka lalu lintas, pilihan paling sederhana adalah menghentikan
image baru, memulihkan backup pra-rilis (termasuk marker migrasi), lalu
menjalankan kembali image lama.

Konversi kebalikannya yang mempertahankan makna WIB adalah:

```sql
ALTER TABLE article ALTER COLUMN published_at TYPE timestamp
  USING published_at AT TIME ZONE 'Asia/Jakarta';
```

Jika rollback dilakukan setelah menerima tulisan baru, hentikan seluruh
pembaca/penulis lebih dulu dan ambil backup baru. Gunakan konversi balik agar
tulisan baru tetap tersimpan, lalu rekonsiliasi marker migrasi yang tepat dengan
prosedur operator sebelum memakai image lama. Jangan memulihkan backup lama
secara buta setelah lalu lintas tulis dibuka. Jangan hanya mengganti image:
image lama menafsirkan `published_at` dengan kontrak yang berbeda.

## Bukti lokal

`src/db/published-at-migration.test.ts` mengeksekusi SQL migrasi yang sebenarnya
terhadap tabel temporer, lalu konversi balik. Menguji sesi UTC dan Asia/Tokyo,
awal tahun, akhir bulan, pecahan mikrodetik, NULL, kelayakan Terbit pada instan
tetap, dan kesamaan tanggal pembentuk Permalink. Tes query dan Server Action
memakai DB lokal terpisah; ini bukan bukti migrasi produksi.

Cache daftar berita tetap memakai kebijakan sebelumnya. Ketepatan pemunculan
artikel terjadwal saat waktu berlalu tanpa penyimpanan baru memerlukan
penanganan invalidasi cache tersendiri; migrasi zona waktu tidak menyelesaikannya.
