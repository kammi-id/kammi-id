# 06 — Salinan Markdown untuk Berita dan Halaman

**What to build:** Setiap Berita dan Halaman bisa dibaca agen AI sebagai
Markdown bersih, lewat dua jalan, tanpa pernah menggeser Permalink HTML-nya.

**Blocked by:** 03 — front-matter memakai ringkasan turunan yang dibuat di sana.

**Status:** done — merged (956caf2), integrated into `dev-20260104` at 066b8e0, 2026-09-03

Keputusan bentuknya ada di ADR 0024. Istilah **Salinan Markdown** ada di
`CONTEXT.md`.

- [x] **Serializer** di `src/lib/publikasi/` (atau tetangga yang wajar) yang
      mengubah dokumen ProseMirror `article.body` menjadi Markdown. Ia adalah
      cerminan `renderNode` di `src/components/article-body-renderer/`: node
      yang sama, urutan yang sama, daftar-izin yang sama.
- [x] **Uji yang menjaga keduanya sinkron.** Node yang ditambahkan ke
      daftar-izin perender tapi tidak ke serializer akan hilang diam-diam dari
      Salinan Markdown. Uji ini bukan pelengkap — ia satu-satunya yang mencegah
      pembusukan senyap yang disebut di Consequences ADR 0024.
- [x] Gambar diserialisasi dengan URL **absolut**; tautan relatif diserap
      menjadi absolut. Berkas Markdown sering dibaca jauh dari asalnya.
- [x] **Front-matter YAML** pada setiap Salinan: `title`, `date`, `author`,
      `organization`, `canonical`, `tags`. `canonical` di dalam berkas penting
      karena ia bertahan setelah berkasnya disalin keluar dari HTTP — tempat
      header di bawah tidak ikut.
- [x] **Jalan 1 — suffix `.md`**: `/berita/2026/09/judul.md` dan `/halaman.md`.
      Menghormati seluruh gerbang yang sudah ada: Terbit, Diarsipkan, Struktur
      Non-Aktif, riwayat Permalink (ADR 0014 — alamat lama ber-`.md` ikut
      `permanentRedirect` ke alamat baru ber-`.md`).
- [x] **Jalan 2 — content negotiation**: Permalink biasa dengan
      `Accept: text/markdown` membalas Markdown. Satu cabang pada penangan yang
      sama, bukan penangan kedua.
- [x] **`Link: <permalink-html>; rel="canonical"`** sebagai header HTTP pada
      setiap respons Markdown. Bukan `noindex`, bukan `Disallow` — keduanya
      ditolak di ADR 0024 karena membatalkan gunanya sendiri.
- [x] Sisi HTML memasang `alternates.types['text/markdown']` menunjuk alamat
      `.md`-nya. Next.js 16 menerima MIME arbitrer di situ tanpa kode kustom.
- [x] `Content-Type: text/markdown; charset=utf-8`.
- [x] **Indeks `/berita.md`** — daftar Berita Terbit satu Struktur: judul,
      tanggal, ringkasan, dan tautan `.md`-nya. Ini pintu masuk yang dipakai
      agen untuk menemukan sisanya.
- [x] Salinan Markdown **tidak** masuk `sitemap.xml`. Ia representasi kedua
      dari sumber daya yang sama, bukan halaman tersendiri, dan mendaftarkannya
      persis sinyal duplikat yang `rel="canonical"` di atas hendak cegah.
- [x] Uji: Berita draft dan terjadwal menjawab 404 di `.md` seperti di HTML;
      header canonical ada dan menunjuk alamat yang benar; front-matter
      ter-escape benar untuk judul bertanda kutip dan bertanda titik dua.
- [x] `check:types`, `check:lint`, `check:structure` hijau.

## Catatan implementasi

Rute tersembunyi awalnya bernama `src/app/__markdown/` (mengikuti idiom
`/__internal-path-blocked` yang sudah ada) — ternyata Next.js memperlakukan
setiap folder berawalan `_` di bawah `app/` sebagai **private folder**,
dikecualikan total dari routing. Untuk `/__internal-path-blocked` itu justru
tujuannya (permanently unroutable, by design). Untuk pohon ini — yang harus
benar-benar menjalankan `route.ts` — sifat itu berbalik jadi bug: rewrite
`proxy.ts` sudah benar (`x-middleware-rewrite` menunjuk ke sana), tapi Next
diam-diam jatuh ke halaman not-found bawaannya, bukan pernah memanggil
handler. Ditemukan lewat verifikasi `next dev` + `curl` sungguhan (bukan
sekadar `check:types` hijau), diperbaiki dengan mengganti nama pohon jadi
`src/app/salinan-markdown/` (tanpa underscore). Lihat komentar di `proxy.ts`
untuk detail dan rujukan dokumennya.
