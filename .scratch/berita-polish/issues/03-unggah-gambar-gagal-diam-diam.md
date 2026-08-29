# 03 — Unggah gambar yang gagal diam-diam

**What to build:** Unggahan gambar yang ditolak server berhenti menghilang
tanpa jejak, dan foto HEIC dari iPhone diterima. Perbaikannya di lapisan
penyimpanan, bukan di jalur artikel — bug yang sama menganga di 13 pemanggil
`ImageUpload`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Catatan diagnosis: keluhan aslinya berbunyi "gambar di tengah artikel tidak
dirender di halaman berita". Itu bukan yang terjadi. Perender, sanitizer, dan
perintah `setImage` editor sudah dibuktikan benar lewat uji headless — badan
artikel yang dikeluhkan memang tidak pernah memuat node gambar sama sekali.
Jangan mulai dari perender.

- [ ] Sebelum menulis kode konversi: **buktikan** `sharp` di dalam image
      Docker (`oven/bun:1.4.0-slim`) benar-benar punya decoder HEIF, dengan
      membangun image-nya secara lokal. Terbukti di macOS bukan bukti untuk
      container. Catat hasilnya di `## Comments`.
- [ ] HEIC dikonversi menjadi JPEG di `storage.uploadFile`, sehingga seluruh
      jalur unggah di aplikasi ikut menerimanya — bukan hanya artikel.
- [ ] AVIF ditolak dengan pesan yang menyebut format mana yang diterima.
      Build `sharp` yang ada punya `avif.input = false`; mengejarnya adalah
      non-goal spec ini.
- [ ] Pemeriksaan runtime: bila decoder HEIF ternyata absen, unggahan HEIC
      ditolak dengan pesan yang benar alih-alih melempar error mentah, dan
      satu baris log muncul saat boot.
- [ ] Atribut `accept` pada setiap input file menyebut tipe yang benar-benar
      diterima, bukan `image/*`.
- [ ] Batas 5MB diperiksa di klien sebelum unggah dimulai, dengan pesan yang
      menyebut ukuran berkasnya.
- [ ] Setiap kegagalan unggah — tipe, ukuran, atau kegagalan tulis —
      memunculkan `toast.error` berisi alasannya. Tidak ada lagi jalur yang
      berakhir hanya di `console.error`, baik di toolbar editor maupun di
      `ImageUpload`.
- [ ] Tes untuk logika konversi dan penolakan: HEIC masuk menjadi JPEG, AVIF
      ditolak, tipe tak dikenal ditolak, berkas kebesaran ditolak.
- [ ] `check:types`, `check:lint`, dan `check:structure` hijau.
