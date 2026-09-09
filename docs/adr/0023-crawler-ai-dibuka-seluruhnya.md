# Crawler AI dibuka seluruhnya, termasuk yang melatih model

Situs KAMMI berada di belakang Cloudflare, dan Cloudflare menyuntik blok
"Managed Content" ke dalam `robots.txt` **di atas** keluaran `src/app/robots.ts`.
Blok itu melarang `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`,
`Bytespider`, `Amazonbot`, `Applebot-Extended`, dan `meta-externalagent`, lalu
menyatakan `Content-Signal: search=yes, ai-train=no, use=reference`.

Lebih jauh dari itu, WAF-nya menjawab **403** kepada `OAI-SearchBot` dan
`PerplexityBot` — dua bot yang **bukan** pelatih model, melainkan pengambil
konten saat seorang manusia sedang bertanya. `Googlebot` dan
`facebookexternalhit` dari IP yang sama lolos dengan 200, jadi ini aturan yang
menyasar AI secara khusus, bukan penolakan bot tak-terverifikasi.

Tidak ada keputusan yang pernah diambil untuk itu. Ia menyala sebagai
default Cloudflare, dan sejak itu berdiri diam-diam di jalur yang paling
menentukan.

Sementara itu tujuan yang dinyatakan justru sebaliknya: KAMMI.id ingin menjadi
rujukan pertama ketika seseorang bertanya kepada ChatGPT, Claude, Gemini, atau
Perplexity tentang KAMMI. Selama 403 itu berdiri, seluruh pekerjaan SEO di
repo ini memoles halaman yang tidak pernah sampai ke penanyanya.

## Decision

**Seluruh crawler AI dibuka, termasuk yang mengambil konten untuk melatih
model, dan `Content-Signal` diselaraskan menjadi `ai-train=yes`.**

Sumber kebenarannya adalah **panel Cloudflare, bukan `robots.ts`**. Selama blok
Managed Content aktif, berkas di repo ini hanyalah paragraf kedua dari sebuah
dokumen yang paragraf pertamanya ditulis pihak lain. Tiket 01 mematikannya di
panel; `robots.ts` menyusul sebagai satu-satunya penulis.

Yang membedakan keputusan ini dari sekadar "buka semua" adalah alasannya
dipisah menjadi dua, karena taruhannya memang dua:

**Bot pengambil (retrieval) dibuka karena tanpanya tujuannya mustahil.**
OpenAI menyatakan situs yang menolak `OAI-SearchBot` tidak akan muncul di
jawaban ChatGPT search. Anthropic memisahkan `ClaudeBot` (melatih),
`Claude-SearchBot` (mengindeks), dan `Claude-User` (mengambil saat ditanya) —
menolak dua yang terakhir berarti tidak pernah dikutip Claude. Perplexity
menyatakan `PerplexityBot` tidak dipakai untuk melatih model sama sekali,
sehingga memblokirnya adalah biaya tanpa proteksi.

**Bot pelatih (training) dibuka karena sifat organisasinya, bukan karena
murah.** KAMMI adalah gerakan dakwah; tulisannya diterbitkan untuk tersebar,
bukan sebagai aset yang ditahan. Sebuah model yang mengenal KAMMI sebagai
entitas lebih berguna bagi KAMMI daripada model yang tidak pernah
membacanya. Ini keputusan organisasi yang bisa berubah; kalau berubah, yang
dicabut hanya paragraf ini, dan bot retrieval tetap harus dibuka.

Satu hal yang **tidak** boleh ikut terbuka atau tertutup tanpa sadar:
`facebookexternalhit`. Ia bukan crawler AI melainkan pengambil pratinjau
tautan WhatsApp dan Instagram — kanal distribusi terbesar KAMMI. Statusnya
hari ini 200 dan harus tetap 200.

## Considered Options

**Membuka retrieval, menutup training.** Sikap yang paling banyak dipakai
penerbit berita, dan tetap memenuhi tujuan utama. Ditolak sebagai keputusan
produk, bukan sebagai keputusan teknis — lihat paragraf kedua Decision. Ini
alternatif yang paling mungkin dipilih ulang di kemudian hari, dan ADR ini
sengaja ditulis agar pencabutannya murah.

**Membuka semua kecuali `CCBot`.** Common Crawl adalah arsip publik yang
tidak mengendalikan siapa yang memakainya, sehingga terasa sebagai
kompromi yang rapi. Ditolak karena kompromi itu ilusi: isi Common Crawl sudah
menjadi bahan hampir semua model yang ada, dan menutupnya sekarang tidak
menarik kembali apa pun. Yang ia hasilkan hanya satu baris aturan yang
kelihatan berhati-hati.

**Menutup `Google-Extended` saja.** Terdengar seperti menolak Gemini tanpa
kehilangan Google. Ditolak karena premisnya keliru: Google menyatakan kontrol
untuk fitur AI di dalam Search adalah `robots.txt` bagi `Googlebot`, sehingga
memblokir `Google-Extended` **tidak** mengeluarkan situs dari AI Overviews. Ia
hanya menolak pelatihan Gemini — membayar penuh, menerima setengah.

**Membiarkan Cloudflare sebagai sumber kebenaran dan tidak menyentuh
`robots.ts`.** Ditolak karena dua penulis untuk satu berkas berarti tidak ada
yang bertanggung jawab atasnya. Bug hari ini persis lahir dari situ.

## Consequences

- **`src/app/robots.ts` menjadi satu-satunya penulis `robots.txt`.** Siapa pun
  yang mengubah kebijakan crawler tanpa menyentuh berkas itu sedang mengubah
  kebijakan di tempat yang tidak terlacak oleh Git.
- **Isi KAMMI akan masuk ke data pelatihan model, tanpa jaminan atribusi.**
  Itu diterima secara sadar. Yang tidak diterima adalah kehilangan sitasi
  saat orang bertanya — dan dua hal itu dikendalikan oleh bot yang berbeda.
- **`ChatGPT-User`, `Perplexity-User`, dan `meta-externalfetcher` mengabaikan
  `robots.txt`** menurut pernyataan vendornya sendiri. Selama arahnya membuka,
  itu tidak berakibat apa-apa. Kalau suatu hari kebijakan ini dibalik,
  `robots.txt` saja tidak akan cukup dan penegakannya harus lewat WAF.
- **`robots.ts` adalah Route Handler yang bisa menjawab 5xx.** Per RFC 9309,
  `robots.txt` yang membalas 5xx wajib ditafsirkan crawler sebagai larangan
  atas **seluruh** situs. Ia membaca basis data lewat
  `resolveStrukturForRequestHost`; kegagalan basis data karena itu bisa
  menghilangkan seluruh Situs Struktur dari indeks tanpa satu pun perubahan
  kode. Tiket 05 memberinya jalur aman.
- Bagi Struktur yang Situsnya belum Aktif atau Non-Aktif, `robots.ts` tetap
  menjawab `Disallow: /` (ADR 0013). Keputusan ini tidak menyentuh itu.
