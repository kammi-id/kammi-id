# 03 — Metadata dan JSON-LD Berita

**What to build:** Setiap Berita punya deskripsi yang benar-benar
menggambarkan dirinya, tanggal dan penulis yang terbaca mesin, dan markup
`Article` yang menunjuk Struktur penerbitnya sebagai sumber.

**Blocked by:** 02 — `publisher` menunjuk `@id` yang dibuat di sana.

**Status:** done — 2026-09-03

Hari ini deskripsi setiap Berita harfiah `` `Berita dari ${org.name}` `` —
string yang sama untuk seluruh artikel di satu Struktur. Tidak ada JSON-LD
sama sekali di Permalink, dan `buildBreadcrumb` yang dipakai di lima halaman
lain justru absen di halaman yang paling membutuhkannya.

- [x] **Ringkasan turunan.** Fungsi murni yang mengambil paragraf pertama dari
      dokumen ProseMirror `article.body`, meratakannya menjadi teks polos,
      memotong pada **batas kata** di sekitar 155 karakter, dan menutup dengan
      elipsis hanya kalau benar-benar terpotong. Tidak ada kolom baru dan
      tidak ada migrasi.
- [x] Ringkasan dipakai untuk `description`, `openGraph.description`,
      `twitter.description`, dan `Article.description` — satu sumber, empat
      pemakai.
- [x] Jatuhan berlapis kalau paragraf pertama tidak ada atau kosong (artikel
      yang dibuka gambar, kutipan, atau daftar): paragraf pertama yang
      **punya teks**, lalu nama kategori dan nama Struktur, lalu deskripsi
      Struktur. Tidak pernah string kosong.
- [x] Uji khusus untuk badan tulisan yang: kosong; dibuka gambar; dibuka
      heading; paragraf pertamanya satu kata; paragraf pertamanya jauh lebih
      panjang dari 155 karakter dan tidak punya spasi di sekitar batasnya.
- [x] `openGraph.type: 'article'` dilengkapi `publishedTime`, `modifiedTime`,
      `authors`, `section` (nama kategori), dan `tags`. Semuanya sudah ada di
      tabel dan hari ini tidak dipakai satu pun.
- [x] **JSON-LD `Article`** — bukan `NewsArticle`. KAMMI.id situs organisasi,
      bukan ruang redaksi, dan `CONTEXT.md` mendefinisikan Berita tanpa klaim
      jurnalisme. Lihat spec, bagian Solution.
- [x] `Article` memuat `headline`, `description`, `image` (Gambar Utama,
      absolut), `datePublished`, `dateModified`, `inLanguage: 'id-ID'`,
      `articleSection`, `keywords`, dan `mainEntityOfPage` menunjuk Permalink.
- [x] `publisher` menunjuk `{ '@id': '<host-struktur>/#organization' }` dari
      tiket 02 — **rujukan, bukan salinan objek Organization**. Itu yang
      menyatukan setiap Berita dengan simpul entitas Struktur penerbitnya.
- [x] `author`: `Person` dengan `name` kalau `penulis` terisi; jatuh ke
      rujukan `@id` Struktur kalau kosong. `Person` tanpa `url` memang sinyal
      lemah, tapi jauh lebih baik daripada `author` yang hilang, dan otoritas
      sesungguhnya dipikul `publisher`.
- [x] `dateModified` memakai `article.updatedAt`. Kalau `updatedAt` lebih awal
      dari `publishedAt` (Berita terjadwal yang disunting sebelum terbit),
      yang dipakai adalah `publishedAt` — `dateModified` tidak pernah boleh
      mendahului `datePublished`.
- [x] **Breadcrumb** dipasang di Permalink Berita: Beranda → Berita → judul.
      Pakai `buildBreadcrumb` yang sudah ada, dan perbaiki fungsinya yang
      sekarang mengeraskan `https://www.kammi.id` di setiap `item` — itu bug
      yang sama dengan tiket 02 dan menyerang lima halaman yang memakainya.
- [x] Berita ber-`noindex` (Struktur Non-Aktif, ADR 0013) **tetap** memasang
      JSON-LD. `noindex` menyangkut pengindeksan, bukan penyangkalan bahwa
      tulisannya pernah ada.
- [x] Halaman (`type: 'page'`) ikut mendapat ringkasan turunan, canonical, dan
      breadcrumb, tapi dimarkup `WebPage`, bukan `Article` — ia tak bertanggal
      (`CONTEXT.md`).
- [x] `check:types`, `check:lint`, `check:structure` hijau, dan uji baru lulus.
