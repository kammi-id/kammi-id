# SEO dan agen AI: identitas entitas, kartu bagikan, dan Salinan Markdown

**Status:** ready-for-agent

Keputusan domain yang berlaku: `CONTEXT.md` mendefinisikan **Berita**,
**Halaman**, **Permalink**, **Penulis**, **Gambar Utama**, **Situs Struktur**,
dan — baru dari spec ini — **Salinan Markdown** serta **Kartu Bagikan**. ADR 0012 menetapkan Situs
Struktur hidup di bawah satu segmen tenant. ADR 0013 menetapkan Situs
Non-Aktif mati sementara arsipnya hidup. ADR 0014 menetapkan Permalink sebagai
alamat yang berkuasa. ADR 0018 menempatkan PP di `www`, bukan apex. ADR 0023
dan 0024 lahir dari spec ini.

Riset yang mendasarinya ada di `riset-seo.md` (1.024 baris, tiap klaim
bersumber, dan sudah memisahkan mana yang terverifikasi dari sumber resmi dan
mana yang klaim komunitas).

## Problem Statement

Tujuannya dinyatakan sebagai dua hal: selalu muncul di halaman pertama mesin
pencari, dan menjadi rujukan utama saat orang bertanya kepada ChatGPT, Claude,
Gemini, atau Perplexity. Penelusuran menemukan bahwa yang kedua **sedang
diblokir di tepi jaringan**, dan yang pertama bocor di beberapa titik yang
justru paling mahal.

**Blokir di tepi.** Cloudflare menyuntik blok "Managed Content" ke `robots.txt`
di atas keluaran `src/app/robots.ts`, dan WAF-nya menjawab **403** kepada
`OAI-SearchBot` dan `PerplexityBot` — dua bot pengambil, bukan pelatih. Uji
langsung: `Googlebot` 200, `facebookexternalhit` 200, `OAI-SearchBot` 403,
`PerplexityBot` 403, `ClaudeBot` 403. Selama itu berdiri, seluruh sisa spec ini
memoles halaman yang tidak pernah sampai ke penanyanya. Ini juga berarti
`robots.ts` bukan sumber kebenaran — ada penulis kedua yang tidak terlacak Git.

**Identitas yang salah alamat.** `buildOrganization()` di `src/lib/seo/json-ld.ts`
mengeraskan `www.kammi.id` beserta akun sosial PP, dan `src/app/layout.tsx`
menyuntikkannya ke **setiap** Situs Struktur. Akibatnya subdomain PW Aceh
mengaku sebagai PP kepada setiap mesin yang membacanya. Sementara itu KAMMI
sudah punya entitas Wikidata (`Q85992000`) dan halaman Wikipedia Indonesia
(pageid 2957290) — sinyal resolusi entitas terkuat yang tersedia — dan
keduanya tidak ada di `sameAs`.

**Berita tanpa identitas.** Permalink Berita tidak memasang JSON-LD sama
sekali: tidak ada `Article`, dan `buildBreadcrumb` yang dipakai di lima halaman
lain justru absen di sini. Deskripsinya harfiah `` `Berita dari ${org.name}` ``
— string yang sama untuk setiap artikel di satu Struktur. `alternates.canonical`
tidak ada di mana pun di seluruh aplikasi. `openGraph.publishedTime`,
`modifiedTime`, dan `authors` kosong padahal `publishedAt` dan `penulis` ada di
tabel.

**Sinyal yang berbohong.** `sitemap.ts` memakai `changeFrequency` dan
`priority` yang dinyatakan diabaikan Google maupun Bing, memasang
`lastModified: new Date()` pada rute statis — yang merusak kepercayaan `lastmod`
karena Google menuntutnya akurat dan bisa diverifikasi — dan memakai
`publishedAt` alih-alih `updatedAt` untuk Berita, sehingga artikel yang disunting
tidak pernah memberi sinyal segar. Tidak ada mekanisme apa pun yang memberi
tahu Google bahwa subdomain Struktur baru ada.

**Kartu bagikan yang seragam.** Empat template OG yang semuanya gradien navy
bertulisan. Berita bergambar tetap membagikan kotak biru bertuliskan judul,
padahal Gambar Utama-nya ada.

**Tidak ada cara memulai berbagi.** Halaman Permalink Berita sendiri tidak
punya satu pun tombol bagikan — pembaca yang ingin menyebarkannya harus
menyalin URL dari address bar secara manual. Kartu bagikan yang diperbaiki di
atas cuma memoles pratinjau setelah tautan sudah dibagikan orang lain; belum
ada yang memoles momen memulainya.

**Tidak ada permukaan untuk agen.** Isi hanya tersedia sebagai HTML, padahal
`article.body` sudah berupa dokumen ProseMirror ber-daftar-izin yang murah
diserialisasi menjadi Markdown.

**Tidak ada alat ukur.** Google Search Console dan Bing Webmaster Tools belum
didaftarkan. Tanpa keduanya tidak ada satu pun cara memverifikasi apakah
tujuan spec ini tercapai — dan panel AI Performance milik Bing adalah
satu-satunya alat first-party gratis yang menghitung sitasi AI.

## Solution

Sepuluh tiket. Urutan 1–8 berurutan secara sengaja — yang lebih dulu bukan
yang paling mudah, melainkan yang tanpanya sisanya tak berarti: selama 403
masih berdiri dan tidak ada alat ukur, tujuh tiket sesudahnya adalah pekerjaan
yang tak bisa dinilai. Tiket 9 lahir belakangan dan berdiri sendiri — paralel
dengan yang lain, senasib dengan tiket 4. Tiket 10 lahir paling belakangan,
setelah tiket 4 merged dan kartunya dilihat berdampingan dengan kartu
penerbit lain: ia menggantikan keputusan visual tiket 4, bukan menambahinya.

**Arah yang membedakan spec ini dari daftar periksa SEO biasa:** KAMMI.id
adalah situs organisasi, bukan ruang redaksi. Kita tidak mengejar Top Stories,
dan Berita dimarkup sebagai `Article`, bukan `NewsArticle` — klaim penerbit
berita akan menarik ekspektasi Google News yang memang tidak dilayani.
Otoritasnya dikejar lewat **graf entitas**: setiap Struktur mendapat `@id`
stabil, menyebut induk dan anak langsungnya, dan PP menautkan dirinya ke
Wikidata serta Wikipedia. Pohon KAMMI nasional lalu terangkai sendiri saat
crawler menelusurinya, dan setiap Berita menunjuk penerbitnya dengan `@id`
yang sama — itulah yang membuat sebuah halaman dibaca sebagai sumber pertama,
bukan sebagai situs yang kebetulan menyebut KAMMI.

Ringkasan Berita diturunkan otomatis dari paragraf pertama, dipotong pada
batas kata. Tidak ada kolom `excerpt` dan karena itu **tidak ada migrasi basis
data di seluruh spec ini** — konsekuensinya diterima: paragraf pertama yang
tidak representatif tidak punya jalan keluar manual.

Salinan Markdown dilayani lewat dua jalan sekaligus, dengan kanonik lewat
header HTTP (ADR 0024). `llms.txt` diterbitkan ringkas, dengan catatan jujur
bahwa tidak ada bukti vendor mana pun membacanya.

### Tiket

1. **Wizard: buka crawler AI, daftarkan alat ukur** — empat langkah lintas tiga
   dashboard yang hanya bisa dikerjakan manusia, plus verifikasi otomatis.
2. **Identitas Struktur di JSON-LD** — graf entitas per-Struktur, `sameAs`
   Wikidata/Wikipedia di PP, canonical di seluruh rute publik.
3. **Metadata dan JSON-LD Berita** — ringkasan turunan, tanggal, penulis,
   `Article`, breadcrumb.
4. **Kartu bagikan** — Gambar Utama sebagai latar penuh dengan scrim, logo,
   dua mode. **Keputusan visualnya dicabut tiket 10** — scrim diganti plakat
   opak; tiket ini tetap `done` sebagai catatan sejarahnya.
5. **Sitemap, robots, dan feed yang jujur** — buang sinyal yang diabaikan,
   `lastmod` yang benar, sitemap index lintas subdomain, RSS diperkaya.
6. **Salinan Markdown untuk Berita dan Halaman** — serializer, suffix `.md`,
   content negotiation, header canonical.
7. **`llms.txt` per Struktur.**
8. **Salinan Markdown untuk `tentang` dan `tentang/pengurus`.**
9. **Tombol bagikan** — baris tombol WhatsApp/X/Facebook/Telegram/Threads/
   Salin Tautan di halaman Permalink Berita, dengan Web Share API di
   perangkat yang mendukungnya.
10. **Kartu bagikan gaya plakat** — scrim dicabut, keterbacaan dijamin plakat
    putih opak: chip identitas, plakat judul, pil tanggal. Lahir setelah
    tiket 4 merged dan menggantikan keputusan visualnya.

## Out of Scope

- **Kolom `excerpt` dan migrasi basis data apa pun.** Ditutup oleh keputusan
  di atas; kalau ringkasan turunan terbukti tidak cukup, itu spec berikutnya.
- **News sitemap dan pengejaran Google News / Top Stories.** Ditutup oleh
  keputusan bahwa KAMMI.id bukan situs jurnalisme.
- **Halaman profil Penulis.** `Penulis` adalah teks bebas dan bukan Kader
  (`CONTEXT.md`); untuk situs organisasi, otoritas dipikul penerbit.
- **Rename kolom `article.type` dari `'blog'`.** Glosarium menyuruh menghindari
  kata "Blog" sementara kolomnya memakainya — kontradiksi lama, bukan bagian
  dari pekerjaan ini.
- **`llms-full.txt`.** Ditolak di ADR 0024.
- **Core Web Vitals dan optimasi kinerja render.** Nyata dan berpengaruh, tapi
  bentuk pekerjaannya sama sekali berbeda dan tidak berbagi satu berkas pun
  dengan spec ini.
