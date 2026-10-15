# Salinan Markdown ditawarkan dua jalan, dan kanoniknya lewat header

Agen AI membaca HTML dengan susah payah: navigasi, tombol, skrip, dan kelas
Tailwind menenggelamkan tulisannya. Situs yang ingin dikutip dengan tepat
mulai menyediakan bentuk kedua yang sama isinya tapi tanpa perancah itu.

Pola itu sudah nyata dan seragam di lapangan, bukan spekulasi: nextjs.org,
Vercel, Stripe, dan dokumentasi Claude semuanya melayani **suffix `.md`**
sekaligus **content negotiation** lewat `Accept: text/markdown` pada alamat
yang sama. Google menerbitkan varian `.md.txt`-nya sendiri.

Isi KAMMI kebetulan sangat siap untuk ini: `article.body` sudah berupa dokumen
ProseMirror ber-daftar-izin (`src/components/article-body-renderer/`), jadi
serializer Markdown-nya adalah cerminan langsung `renderNode` — bukan proyek
tersendiri.

Yang tidak jelas adalah bagaimana bentuk kedua itu hidup berdampingan dengan
HTML-nya tanpa dibaca mesin pencari sebagai isi duplikat.

## Decision

**Setiap Berita dan Halaman punya satu Salinan Markdown, dijangkau lewat dua
jalan, dan Permalink HTML-nya tetap yang berkuasa.**

**Dua jalan, karena keduanya melayani pembaca yang berbeda.** Suffix `.md`
(`/berita/2026/09/judul.md`) adalah yang bisa ditempel manusia ke dalam
percakapan dan diikuti agen yang tidak mengirim header apa pun. Content
negotiation (`Accept: text/markdown` pada Permalink biasa) adalah yang dipakai
klien yang lebih pintar dan tidak perlu tahu konvensi alamat kita. Keduanya
dilayani satu serializer, jadi jalan kedua nyaris gratis.

**Kanoniknya lewat header HTTP, bukan `noindex` dan bukan `Disallow`.**
Salinan Markdown mengirim `Link: <permalink-html>; rel="canonical"` — mekanisme
yang didukung Google untuk dokumen non-HTML, dan persis yang dikirim Next.js
dan Vercel pada varian `.md` mereka. Sisi HTML membalas dengan
`metadata.alternates.types['text/markdown']`, yang diterima Next.js 16 apa
adanya tanpa kode kustom.

**Setiap Salinan Markdown dibuka front-matter YAML** berisi `title`, `date`,
`author`, `organization`, `canonical`, dan `tags`. Agen membaca metadata
terstruktur jauh lebih andal daripada menebaknya dari prosa, dan `canonical`
di dalam berkas bertahan setelah berkasnya disalin keluar dari HTTP — tempat
header tadi tidak ikut.

**Salinan Markdown bukan cache.** Ia diserialisasi dari dokumen tersimpan pada
saat request, sama seperti HTML-nya, sehingga tidak pernah ada dua versi satu
Berita yang berbeda isi.

## Considered Options

**Hanya suffix `.md`.** Paling sedikit permukaan. Ditolak karena membuang
jalan yang gratis: serializer-nya sudah ada, dan content negotiation cuma
menambah satu cabang pada penangan yang sama.

**Hanya content negotiation.** Paling bersih secara HTTP — satu sumber daya,
banyak representasi. Ditolak karena tidak bisa ditempel: seorang manusia yang
ingin memberi agen sebuah tautan bersih tidak punya alamat untuk disalin.

**`noindex` pada Salinan Markdown.** Cara paling naif menghindari duplikat.
Ditolak karena menembak kaki sendiri: kita membangun permukaan khusus agar
mesin AI membacanya, lalu melarang mesin membacanya.

**`Disallow: /*.md` di `robots.txt`.** Sama seperti di atas, dan lebih buruk —
`Disallow` mencegah pengambilan, sehingga `rel="canonical"` di dalamnya tidak
pernah terbaca.

**`llms-full.txt` berisi seluruh isi situs.** Ditolak: situs berbasis arsip
kronologis tidak punya "seluruh isi" yang stabil, dan berkasnya basi pada
Berita berikutnya. `llms.txt` yang ringkas — identitas Struktur dan tautan ke
permukaan utamanya — tetap diterbitkan (tiket 07), dengan catatan jujur bahwa
tidak ada bukti satu pun vendor LLM membacanya; Google Search menyatakan
terang-terangan tidak memakainya. Ia dibuat karena murah dan karena Chrome
Lighthouse mulai mengauditnya, bukan karena terbukti bekerja.

## Consequences

- **Ada dua alamat untuk satu isi, dan itu disengaja.** Siapa pun yang
  menambah permukaan publik baru harus memutuskan apakah ia punya Salinan
  Markdown — diam berarti tidak punya, dan itu jawaban yang sah.
- **Serializer Markdown terikat pada daftar-izin ProseMirror.** Node baru yang
  ditambahkan ke editor tanpa ditambahkan ke serializer akan hilang diam-diam
  dari Salinan Markdown. Uji yang menjaga keduanya sinkron adalah bagian dari
  tiket 06, bukan pelengkap.
- **`tentang` dan `tentang/pengurus` tidak dirender dari ProseMirror**
  melainkan dari Pengaturan Situs, sehingga Salinan Markdown-nya butuh penulis
  tersendiri (tiket 08). Keduanya justru halaman yang paling menjawab "KAMMI
  itu apa", jadi ia ditunda, bukan dibatalkan.
- Kalau suatu hari `rel="canonical"` lewat header ternyata tidak cukup dan
  Salinan Markdown mulai muncul di hasil pencarian menggantikan HTML-nya,
  jalan keluarnya adalah memperbaiki header — bukan `noindex`, yang akan
  membatalkan seluruh gunanya.
