# 04 — Kartu bagikan: Gambar Utama sebagai latar, dua mode

**What to build:** Berita yang punya Gambar Utama membagikan gambarnya, bukan
kotak biru bertuliskan judul.

**Blocked by:** None — bisa jalan paralel dengan 02 dan 03.

**Status:** ready-for-agent

Hari ini ada empat template OG dan semuanya gradien navy bertulisan. Sebuah
Berita bergambar tetap tampil sebagai kotak biru di WhatsApp dan X — kanal
distribusi terbesar KAMMI.

- [ ] `src/components/og-image/` tumbuh menjadi satu komponen dengan **dua
      mode yang berbagi satu tata letak**, supaya kartunya tetap terasa satu
      keluarga:
      - **Bergambar** — Gambar Utama menutup penuh 1200×630, di atasnya scrim
        gelap, judul di depan.
      - **Tanpa gambar** — gradien navy yang sudah ada, tata letak identik.
- [ ] Logo Struktur di **kiri atas** pada kedua mode, diambil dari
      `organization.logo` lewat `resolveSiteImage`. Struktur tanpa logo
      menampilkan wordmark "KAMMI.id" yang sudah ada, bukan ruang kosong.
- [ ] **Scrim tetap, bukan adaptif.** `ImageResponse` tidak bisa mengukur
      kecerahan foto, jadi gradiennya dipatok cukup gelap (sekitar 75% di
      bawah menuju 35% di atas) agar selamat dari foto paling terang.
      Konsekuensinya foto yang sudah gelap menjadi cukup gelap — itu harga
      yang dibayar sadar demi judul yang selalu terbaca, bukan bug.
- [ ] Judul dipotong dengan anggun pada judul panjang (batasi baris, jangan
      biarkan meluber keluar kanvas). Uji dengan judul satu kata dan judul 140
      karakter.
- [ ] Nama Struktur dan tanggal terbit di bawah judul. Nama Struktur diambil
      dari Struktur yang bersangkutan — tidak pernah "KAMMI.id" untuk Situs
      yang bukan PP.
- [ ] `opengraph-image.tsx` baru di rute Permalink Berita. Byte gambarnya
      diambil saat render (ADR 0006/0007 — gambar di volume, cache yang
      menanggung); kegagalan mengambil gambar **jatuh ke mode tanpa gambar**,
      tidak melempar. Kartu bagikan yang gagal render lebih buruk daripada
      kartu polos.
- [ ] `og:image:alt` diisi judul Berita. Hari ini `alt` di beranda dikeraskan
      `'KAMMI.id'` untuk setiap Struktur — perbaiki sekalian.
- [ ] Tiga template lama (`/berita`, `/event`, `/tentang`) ikut memakai
      komponen yang sama supaya tidak ada dua definisi tata letak.
- [ ] Font tetap diambil dari CDN seperti sekarang, dengan catatan yang sudah
      ada di berkas dipertahankan.
- [ ] `check:types`, `check:lint`, `check:structure` hijau.
