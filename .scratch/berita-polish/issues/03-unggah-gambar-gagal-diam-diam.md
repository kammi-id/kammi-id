# 03 — Unggah gambar yang gagal diam-diam

**What to build:** Unggahan gambar yang ditolak server berhenti menghilang
tanpa jejak, dan foto HEIC dari iPhone diterima. Perbaikannya di lapisan
penyimpanan, bukan di jalur artikel — bug yang sama menganga di 13 pemanggil
`ImageUpload`.

**Blocked by:** None — can start immediately.

**Status:** done

Catatan diagnosis: keluhan aslinya berbunyi "gambar di tengah artikel tidak
dirender di halaman berita". Itu bukan yang terjadi. Perender, sanitizer, dan
perintah `setImage` editor sudah dibuktikan benar lewat uji headless — badan
artikel yang dikeluhkan memang tidak pernah memuat node gambar sama sekali.
Jangan mulai dari perender.

- [x] Sebelum menulis kode konversi: **buktikan** `sharp` di dalam image
      Docker (`oven/bun:1.4.0-slim`) benar-benar punya decoder HEIF, dengan
      membangun image-nya secara lokal. Terbukti di macOS bukan bukti untuk
      container. Catat hasilnya di `## Comments`.
- [x] HEIC dikonversi menjadi JPEG di `storage.uploadFile`, sehingga seluruh
      jalur unggah di aplikasi ikut menerimanya — bukan hanya artikel.
- [x] AVIF ditolak dengan pesan yang menyebut format mana yang diterima.
      Build `sharp` yang ada punya `avif.input = false`; mengejarnya adalah
      non-goal spec ini.
- [x] Pemeriksaan runtime: bila decoder HEIF ternyata absen, unggahan HEIC
      ditolak dengan pesan yang benar alih-alih melempar error mentah, dan
      satu baris log muncul saat boot.
- [x] Atribut `accept` pada setiap input file menyebut tipe yang benar-benar
      diterima, bukan `image/*`.
- [x] Batas 5MB diperiksa di klien sebelum unggah dimulai, dengan pesan yang
      menyebut ukuran berkasnya.
- [x] Setiap kegagalan unggah — tipe, ukuran, atau kegagalan tulis —
      memunculkan `toast.error` berisi alasannya. Tidak ada lagi jalur yang
      berakhir hanya di `console.error`, baik di toolbar editor maupun di
      `ImageUpload`.
- [x] Tes untuk logika konversi dan penolakan: HEIC masuk menjadi JPEG, AVIF
      ditolak, tipe tak dikenal ditolak, berkas kebesaran ditolak.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.

## Comments

**Bukti decoder HEIF, dibangun lokal (2026-08-30).** Dibangun ulang
`oven/bun:1.4.0-slim` dengan `sharp@0.35.3` terpasang (versi yang sama
persis dipakai `next@16.3.1` sebagai `optionalDependencies`, dikonfirmasi
lewat `bun.lock`), lalu dicoba decode foto HEIC 16×16 sungguhan (HEVC,
diekspor lewat `sips` macOS — sample asli Apple, bukan file rekaan). Hasilnya
gagal di container **maupun** di macOS host:

```
heif: Error while loading plugin: Support for this compression format has not been built in (11.6003)
```

`sharp.format.heif.input` melaporkan `true` di kedua lingkungan sekalipun —
flag itu cuma menandai kontainer HEIF terdaftar (dipakai bersama AVIF),
bukan codec HEVC-nya tersedia. Jadi assessment awal tiket ini kebalik:

- **HEIC (HEVC) — decoder ABSEN**, bukan tersedia. Ini codec yang dipakai
  kamera default iPhone, dan build `sharp` publik tidak menyertakan decoder
  HEVC-nya (kemungkinan lisensi paten, sama seperti alasan H.265 encoder
  jarang dibundel gratis).
- **AVIF (AV1) — decoder DAN encoder TERSEDIA**, dibuktikan lewat round-trip
  encode+decode langsung di `sharp`. Bertolak belakang dengan asumsi
  `avif.input = false` di spec/tiket ini.

Perilaku yang diminta tiket ini tidak berubah oleh temuan ini — AVIF tetap
ditolak sebagai non-goal, dan HEIC tetap butuh jalur penolakan yang jelas —
tapi jalur penolakan HEIC bukan skenario cadangan yang jarang kena; itu yang
akan terjadi di **setiap** unggahan HEIC di production sampai image `sharp`
diganti dengan build kustom yang menyertakan libheif+HEVC (tidak dikejar di
sini, lihat catatan lisensi di atas). `checkHeifDecoderAtBoot`
(`src/lib/api/heif-decoder.ts`) akan mencatat `logger.warn` di setiap boot
sampai itu berubah — itu yang diharapkan, bukan bug.

Fixture uji (16×16, 750 byte) juga mengajarkan satu hal: HEIC yang di-downscale
terlalu ekstrem (dicoba 4×4) bisa membuat percobaan decode **hang**, bukan
melempar error, alih-alih gagal cepat. 16×16 terbukti gagal cepat dan bersih
di kedua lingkungan yang diuji — itu yang dipakai sebagai fixture boot-probe.

Detail implementasi: `storage.uploadFile` mengonversi HEIC→JPEG lewat
`sharp` ketika decode-nya sukses, dan menolak dengan pesan
`Foto HEIC tidak dapat diproses...` ketika gagal — jalur yang aktif di
production hari ini berdasarkan temuan di atas. `sharp` ditambahkan sebagai
`dependencies` langsung di `package.json` (sebelumnya cuma transitif lewat
`next`), dipin ke `0.35.3` supaya tidak diam-diam berubah kalau Next
mengganti pin-nya sendiri.
