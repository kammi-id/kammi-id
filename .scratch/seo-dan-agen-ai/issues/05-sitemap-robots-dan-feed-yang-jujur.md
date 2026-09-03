# 05 — Sitemap, robots, dan feed yang jujur

**What to build:** Sinyal yang dikirim ke mesin pencari berhenti mengandung
hal yang diabaikan dan hal yang tidak benar, dan subdomain Struktur baru bisa
ditemukan.

**Blocked by:** 01 — sitemap index lintas subdomain baru sah setelah GSC
properti Domain terverifikasi.

**Status:** ready-for-agent

- [ ] **Buang `changeFrequency` dan `priority`** dari `src/app/sitemap.ts`.
      Google dan Bing sama-sama menyatakan mengabaikannya. Dokumentasi Next.js
      lokal masih mencontohkannya di semua contoh sitemap — itu contoh, bukan
      anjuran, dan jangan dijadikan alasan mempertahankannya.
- [ ] **`lastModified` berhenti berbohong.** `lastModified: new Date()` pada
      rute statis membuat setiap rute tampak baru diubah setiap kali sitemap
      diambil. Google menuntut `lastmod` akurat dan bisa diverifikasi;
      `lastmod` yang tidak dipercaya akan diabaikan seluruhnya. Rute statis
      memakai tanggal perubahan yang sesungguhnya diketahui — untuk rute yang
      dirender dari Pengaturan Situs, waktu pembaruan pengaturannya; untuk
      yang benar-benar statis, hilangkan `lastmod` daripada mengarangnya.
- [ ] **Berita memakai `updatedAt`, bukan `publishedAt`.** Hari ini artikel
      yang disunting tidak pernah memberi sinyal segar. Kalau `updatedAt`
      lebih awal dari `publishedAt`, pakai `publishedAt` — aturan yang sama
      dengan `dateModified` di tiket 03.
- [ ] **Sitemap index di `www`** yang mendaftar `sitemap.xml` setiap Struktur
      yang Situsnya Aktif dan tidak Non-Aktif. Sah lintas subdomain **hanya
      karena** GSC-nya properti Domain (tiket 01) — catat ketergantungan itu
      di komentar berkasnya supaya tidak terlepas kalau propertinya diubah.
- [ ] Halaman jaringan PP memastikan setiap Situs Struktur Aktif punya tautan
      internal yang bisa ditelusuri. Sitemap saja lemah untuk situs baru;
      tautan internal yang mengalirkan otoritas ke bawah pohon.
- [ ] **`robots.ts` menjadi satu-satunya penulis** (ADR 0023). Setelah blok
      Cloudflare mati di tiket 01, berkas ini menyatakan kebijakannya sendiri
      secara eksplisit — termasuk `Allow` untuk bot pengambil yang disebut di
      ADR 0023, ditulis terang supaya kebijakannya terlacak di Git dan bukan
      hasil ketiadaan aturan.
- [ ] **Jalur aman untuk `robots.ts`.** Ia Route Handler yang membaca basis
      data lewat `resolveStrukturForRequestHost`; per RFC 9309, `robots.txt`
      yang membalas 5xx wajib ditafsirkan sebagai larangan atas **seluruh**
      situs. Kegagalan basis data karena itu bisa menghilangkan Situs Struktur
      dari indeks tanpa perubahan kode apa pun. Bungkus pembacaannya sehingga
      kegagalan menghasilkan `robots.txt` permisif yang sah dengan 200, bukan
      5xx. Uji yang membuktikannya wajib ada.
- [ ] **RSS diperkaya** di `berita/feed.xml`: `<language>id-ID</language>`,
      `<lastBuildDate>`, `<atom:link rel="self">`, `<description>` per item
      memakai ringkasan turunan dari tiket 03, dan `<author>` kalau ada
      Penulis. `<image>` kalau Struktur punya logo.
- [ ] Feed ditautkan dari `<head>` lewat `alternates.types['application/rss+xml']`
      supaya bisa ditemukan tanpa menebak alamatnya.
- [ ] Uji `sitemap.test.ts` dan `robots.test.ts` yang sudah ada diperbarui,
      bukan diganti — keduanya menjaga perilaku ADR 0013 yang tidak berubah.
- [ ] `check:types`, `check:lint`, `check:structure` hijau.
