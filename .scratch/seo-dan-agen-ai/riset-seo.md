# Riset SEO 2026 — Situs Berita/Organisasi Multi-Tenant di Next.js 16 (App Router)

**Tanggal riset:** 2 September 2026
**Basis kode:** Next.js `16.3.1` (dokumen lokal `node_modules/next/dist/docs/`)

## Cara membaca dokumen ini

Setiap klaim ditandai:

- ✅ **TERVERIFIKASI** — dikutip langsung dari dokumentasi resmi vendor/standar (Google Search Central, Bing, OpenAI, Anthropic, Perplexity, Apple, Meta, IETF, schema.org, ogp.me, llmstxt.org, docs Next.js lokal).
- 🧪 **TERVERIFIKASI EMPIRIS** — diverifikasi sendiri lewat `curl` terhadap situs live pada 2 Sep 2026 (header HTTP nyata, bukan klaim pihak ketiga).
- ⚠️ **KLAIM KOMUNITAS / BELUM TERKONFIRMASI** — bersumber dari blog industri, laporan pers, atau inferensi. **Jangan** dijadikan dasar keputusan arsitektural tanpa validasi ulang.

---

# AREA 1 — General SEO Best Practices (2026)

## 1.1 Sinyal on-page yang masih berpengaruh

### Title (`<title>` / title link)

✅ **TERVERIFIKASI** — Google membangkitkan "title link" secara otomatis dan tidak selalu memakai `<title>` apa adanya:

> "Google's generation of title links on the Google Search results page is completely automated and takes into account both the content of a page and references to it that appear on the web."

Rekomendasi resmi: setiap halaman punya `<title>` yang deskriptif dan ringkas, unik per halaman.
Sumber: <https://developers.google.com/search/docs/appearance/title-link>

### Meta description

✅ **TERVERIFIKASI** — meta description **bukan** ranking factor, tapi dipakai sebagai kandidat snippet:

> "Google will sometimes use the meta description tag from a page to generate a snippet in search results, if it thinks it gives users a more accurate description than would be possible purely from the on-page content."

Praktik resmi: pendek, unik per URL, hindari duplikasi dan keyword stuffing; boleh memuat fakta bertag jelas (author, date).
Sumber: <https://developers.google.com/search/docs/appearance/snippet>

### Heading hierarchy

✅ **TERVERIFIKASI** — SEO Starter Guide Google menempatkan heading sebagai bagian dari "organize your content" (struktur logis, heading deskriptif), bukan sebagai directive kaku "satu H1 per halaman". Tidak ada pernyataan resmi Google yang mewajibkan single-H1.
Sumber: <https://developers.google.com/search/docs/fundamentals/seo-starter-guide>

⚠️ **KLAIM KOMUNITAS** — aturan "wajib tepat satu `<h1>`" adalah konvensi SEO komunitas + aksesibilitas, bukan syarat Google. (Untuk a11y tetap disarankan hierarki tidak melompat.)

### Canonical

✅ **TERVERIFIKASI** — canonical adalah **hint, bukan directive**:

> "While we encourage you to use these methods, none of them are required; your site will likely do just fine without specifying a canonical preference. That's because if you don't specify a canonical URL, Google will identify which version of the URL is objectively the best version to show to users in Search."

Dan `rel="canonical"` **didukung sebagai HTTP header**, khususnya untuk dokumen non-HTML:

> "you can use a `link` HTTP response header with a `rel="canonical"` target attribute ... to indicate the canonical URL for a document supported by Search, including non-HTML documents such as PDF files."

Sumber: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>

> **Relevansi langsung untuk AREA 3:** header `Link: <...>; rel="canonical"` adalah mekanisme resmi untuk menautkan varian `.md` ke halaman HTML-nya. Lihat §3.4.

### hreflang

✅ **TERVERIFIKASI** — tiga metode implementasi: elemen `<link>` di HTML, HTTP header `Link:`, dan entri `<xhtml:link>` dalam sitemap.

Aturan yang paling sering dilanggar:

> "If two pages don't both point to each other, the tags will be ignored. This is so that someone on another site can't arbitrarily create a tag naming itself as an alternative version of one of your pages."

> "Each language version must list itself **as well as** all other language versions."

- Format kode: ISO 639-1 (bahasa) + opsional ISO 3166-1 alpha-2 (region), mis. `en-US`, `de-CH`. Region-only **tidak valid**.
- `x-default` = fallback bagi pengguna yang setelan bahasanya tidak cocok.
- Kesalahan umum yang disebut Google: return link hilang, kode bahasa salah, kode region non-standar seperti `EU` atau `UK`.

Sumber: <https://developers.google.com/search/docs/specialty/international/localized-versions>

> **Catatan untuk KAMMI.id:** kalau situs ini monolingual (id-ID), hreflang **tidak dibutuhkan sama sekali**. hreflang untuk multi-tenant per-wilayah (BPK/BPW) adalah **salah kaprah** — hreflang untuk varian bahasa/region dari *konten yang sama*, bukan untuk konten berbeda per daerah.

### Internal linking

✅ **TERVERIFIKASI** — Google menekankan anchor text yang deskriptif dan link yang crawlable (`<a href>` dengan href yang valid; link berbasis JS tanpa `href` bisa tidak terikuti):

> "Good anchor text is descriptive, reasonably concise, and relevant to the page that it's on and to the page it links to."

Sumber: <https://developers.google.com/search/docs/crawling-indexing/links-crawlable>

---

## 1.2 Core Web Vitals (status 2026)

✅ **TERVERIFIKASI** — per dokumentasi web.dev, ada **tiga** metrik stabil, semuanya diukur pada **persentil ke-75** dan disegmentasi mobile/desktop:

| Metrik | Ambang "Good" | Aspek |
|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ **2,5 detik** | loading |
| **INP** (Interaction to Next Paint) | ≤ **200 ms** | interaktivitas |
| **CLS** (Cumulative Layout Shift) | ≤ **0,1** | stabilitas visual |

- INP menggantikan FID; menjadi Core Web Vital stabil pada **Maret 2024**.
- Sumber: <https://web.dev/articles/vitals> · <https://web.dev/blog/inp-cwv-launch>

✅ **TERVERIFIKASI (2026, non-metrik-baru)** — tidak ada metrik CWV baru per 2026. Yang berubah adalah *alat ukur*:
- **Soft Navigations API** masuk Chrome untuk membawa pengukuran CWV ke SPA (diumumkan Google I/O 2026).
  Sumber: <https://developer.chrome.com/blog/chrome-at-io26>
- CrUX API menambah *LCP image subparts*, *LCP resource type*, dan *RTT tri-bins*.
  Sumber: <https://developer.chrome.com/docs/crux/release-notes>

⚠️ **BARU & PERLU DIPERHATIKAN** — Lighthouse kini punya kategori audit **"Agentic Browsing"**, dan salah satu auditnya adalah **layout stability (CLS) khusus agen** — alasannya: pergeseran layout membuat agen AI salah klik. Artinya CLS sekarang punya konsumen kedua di luar SEO.
Sumber: <https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring> · <https://developer.chrome.com/docs/lighthouse/agentic-browsing/layout-stability>

---

## 1.3 Sitemap & robots.txt

### `changefreq` dan `priority` — sudah mati

✅ **TERVERIFIKASI (Google)**:

> "Google ignores `<priority>` and `<changefreq>` values."

Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>

✅ **TERVERIFIKASI (Google, blog)** — alasannya eksplisit:

> "changefreq specifically is also conceptually overlapping with lastmod."
> "The priority element is a heavily subjective field and based on our internal studies, it generally doesn't accurately reflect the actual priority of a page relative to other pages on a site."

Sumber: <https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping>

✅ **TERVERIFIKASI (Bing)** — Bing menyatakan hal yang sama, terpisah:

> "Optional sitemap tags like changefreq and priority are ignored by Bing and do not influence how your content is crawled or ranked."

Sumber: <https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search>

⚠️ **JEBAKAN NEXT.JS** — dokumentasi resmi Next.js 16.3.1 (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`) **masih mencontohkan `changeFrequency` dan `priority` di semua contohnya**. Ini bukan rekomendasi SEO, hanya kelengkapan API. Contoh dari file lokal:

```ts
{ url: 'https://acme.com', lastModified: new Date(), changeFrequency: 'yearly', priority: 1 }
```

Aman untuk diisi (tidak merusak), tapi **tidak ada gunanya** untuk Google maupun Bing. Rekomendasi: hilangkan agar sitemap lebih kecil dan tidak menyesatkan tim.

### `lastmod` — satu-satunya field opsional yang penting

✅ **TERVERIFIKASI (Google)**:

> "Google uses the `<lastmod>` value if it's consistently and verifiably (for example by comparing to the last modification of the page) accurate."

> "The `<lastmod>` value should reflect the date and time of the last significant update to the page."

Google menyebut perubahan signifikan = konten utama, structured data, atau link. Mengubah tahun copyright **bukan** perubahan signifikan.
Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>

✅ **TERVERIFIKASI (Bing)**:

> "The lastmod field in your sitemap remains a key signal, helping Bing prioritize URLs for recrawling and reindexing, or skip them entirely if the content hasn't changed since the last crawl."

Sumber: <https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search>

> **Implikasi arsitektur:** `lastmod` **harus** berasal dari kolom `updated_at` nyata di DB, bukan `new Date()` saat build. `new Date()` pada `sitemap.ts` membuat SEMUA URL berubah lastmod setiap deploy → Google akan berhenti mempercayai sinyal ini ("consistently and verifiably accurate"). Ini bug paling umum di implementasi Next.js.

### Batas ukuran & sitemap index

✅ **TERVERIFIKASI**:

> "All formats limit a single sitemap to 50MB (uncompressed) or 50,000 URLs."

Lebih dari itu → pecah dan pakai sitemap index. Google mendukung submit satu file index.
Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap> · <https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps>

✅ **TERVERIFIKASI (Next.js)** — Next.js 16 punya `generateSitemaps()` untuk memecah sitemap; ia menghasilkan rute `/sitemap/[id].xml`.
Sumber: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-sitemaps.md`

### Kapan sitemap berguna / tidak

✅ **TERVERIFIKASI** — Google menyebut sitemap berguna bila situs besar, situs baru dengan sedikit backlink, atau **"has a lot of rich media content (video, images) or is shown in Google News."**
Tidak perlu bila situs "small" (~≤500 halaman) dan terhubung internal dengan baik.
Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview>

### Ping endpoint sudah dimatikan

✅ **TERVERIFIKASI** — endpoint ping sitemap (`/ping?sitemap=`) **sudah dihapus Google** (2023). Jangan implementasikan.
Sumber: <https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping>

### RSS/Atom sebagai sitemap + WebSub

✅ **TERVERIFIKASI** — Google menerima submit sitemap "through WebSub for Atom/RSS feeds".
Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>

### robots.txt — aturan yang sering dilanggar

✅ **TERVERIFIKASI (Google)**:

- Lokasi: **top-level directory**, case-sensitive, protokol yang didukung.
- **Scoping ketat**: `https://example.com/robots.txt` **tidak** berlaku untuk `https://www.example.com/` maupun `http://example.com/`. Aturan terikat pada host + protokol + port.
- Field yang didukung Google: `user-agent`, `allow`, `disallow`, `sitemap`.
- **Tidak didukung**: `crawl-delay` ("Other fields such as `crawl-delay` aren't supported"), dan `noindex` di robots.txt.
- Presedensi: "crawlers use the most specific rule based on the length of the rule path"; bila konflik, "Google uses the least restrictive rule."
- Jebakan besar:
  > "Google can't index the content of pages which are disallowed for crawling, but it may still index the URL and show it in search results without a snippet."

Sumber: <https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt>

> **Kesalahan klasik:** memakai `Disallow` untuk menyembunyikan halaman dari index. Yang benar: izinkan crawl + `<meta name="robots" content="noindex">`.

✅ **TERVERIFIKASI (IETF, RFC 9309)** — Robots Exclusion Protocol resmi jadi standar:
- Parsing limit minimal **500 KiB**.
- Cache robots.txt **SHOULD NOT** lebih dari 24 jam.
- Robots.txt **4xx** → crawler boleh akses semua; **5xx** → crawler harus asumsi *complete disallow*.
Sumber: <https://www.rfc-editor.org/rfc/rfc9309.html>

> **Implikasi ops:** kalau `/robots.txt` di KAMMI.id sempat 500 (mis. error DB pada route handler multi-tenant), crawler yang patuh RFC akan **berhenti meng-crawl seluruh situs**. `robots.txt` harus statik atau minimal punya fallback yang tidak pernah 5xx. Di Next.js, `robots.ts` adalah Route Handler yang bisa gagal.

### Meta robots yang relevan (kontrol snippet)

✅ **TERVERIFIKASI**:

- `nosnippet`: "Do not show a text snippet or video preview in the search results for this page."
- `max-snippet:[number]`: "Use a maximum of [number] characters as a textual snippet for this search result." (`0` = tanpa snippet, `-1` = Google pilih sendiri)
- `max-image-preview:[none|standard|large]`
- `max-video-preview:[number]`
- `noindex`, `nofollow`, `none`, `noimageindex`, `notranslate`, `unavailable_after`, `indexifembedded`
- `data-nosnippet`: atribut boolean pada `span`, `div`, `section` untuk mengecualikan potongan teks. Jangan ditambah/dihapus lewat JS.
- **Sudah tidak dipakai Google**: `noarchive`, `nocache`, `nositelinkssearchbox`.

Sumber: <https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag>

> Untuk berita, `max-image-preview:large` biasanya wajib agar thumbnail besar muncul di Discover/Top Stories. (Kombinasi umum: `max-snippet:-1, max-image-preview:large, max-video-preview:-1`.) ⚠️ *Bahwa ini "wajib untuk Discover" adalah klaim komunitas; yang terverifikasi hanyalah arti direktifnya.*

---

## 1.4 OpenGraph & Twitter/X Card

### Field wajib vs opsional (OGP)

✅ **TERVERIFIKASI** — ogp.me menyebut **empat properti wajib**:

> "The four required properties for every page are: `og:title`, `og:type`, `og:image`, `og:url`"

Opsional yang relevan: `og:description`, `og:locale`, `og:site_name`, `og:image:alt`, `og:image:width`, `og:image:height`.

Untuk `og:type="article"` tersedia: `article:published_time`, `article:modified_time`, `article:author`, `article:section`, `article:tag`.
Sumber: <https://ogp.me/>

### Ukuran gambar

✅ **TERVERIFIKASI (Meta)**:

> "Use images that are at least 1200 x 630 pixels for the best display on high resolution devices. At the minimum, you should use images that are 600 x 315 pixels"
> "The minimum allowed image dimension is 200 x 200 pixels."
> Rasio: sedekat mungkin ke **1.91:1**.
> "The size of the image file must not exceed 8 MB."

Sumber: <https://developers.facebook.com/docs/sharing/webmasters/images/>

✅ **TERVERIFIKASI (Next.js)** — dokumen lokal Next.js 16.3.1 menetapkan default `size = { width: 1200, height: 630 }` untuk `opengraph-image`, dan menegaskan batas file: **`twitter-image` ≤ 5MB**, **`opengraph-image` ≤ 8MB** — build **gagal** kalau dilanggar.
Sumber: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`

### `og:image:alt`

✅ **TERVERIFIKASI** — properti resmi OGP, dan Next.js mendukungnya lewat file `opengraph-image.alt.txt` atau export `alt` dari `opengraph-image.tsx`, menghasilkan `<meta property="og:image:alt">`.
Sumber: <https://ogp.me/> · dokumen lokal Next.js di atas.

### Apakah `twitter:card` masih perlu bila OG lengkap?

✅ **TERVERIFIKASI (X/Twitter)** — parser X melakukan fallback ke Open Graph:

> "When the Twitter card processor looks for tags on a page, it first checks for the Twitter-specific property, and if not present, falls back to the supported Open Graph property."

**TAPI** — satu properti tidak punya padanan OG:

> "All cards have one basic property in common - the card type value" (`<meta name="twitter:card" content="summary_large_image">`)

Sumber: <https://developer.x.com/en/docs/x-for-websites/cards/overview/markup>

**Kesimpulan praktis:** cukup **satu tag** `twitter:card`. `twitter:title`, `twitter:description`, `twitter:image` **redundan** kalau OG sudah lengkap. `twitter:image:alt` tetap berguna karena OG `og:image:alt` tidak dibaca X sebagai alt kartu (⚠️ bagian terakhir ini **belum terkonfirmasi eksplisit** di docs X; docs hanya menyebut fallback per-properti secara umum).

---

# AREA 2 — SEO untuk Berita (News)

## 2.1 Masuk Google News / Top Stories tanpa daftar manual

✅ **TERVERIFIKASI** — tidak ada proses aplikasi. Google menghapusnya sejak Publisher Center diluncurkan (Desember 2019):

> Situs "automatically considered for Google News and news surfaces in Search—no application required."

Publisher Center hanya untuk mengelola detail publikasi; **memakainya tidak menjamin tampil**.
Sumber: <https://support.google.com/news/publisher-center/answer/9607025> · <https://developers.google.com/search/blog/2021/07/google-news-top-questions>

✅ **TERVERIFIKASI** — AMP **tidak lagi disyaratkan** untuk Top Stories; terbuka untuk halaman apa pun.
Sumber: <https://developers.google.com/search/docs/crawling-indexing/amp>

✅ **TERVERIFIKASI** — markup Article **tidak wajib** untuk eligibilitas Top Stories:

> "there's no markup requirement to be eligible for Google News features like Top stories, you can add Article to more explicitly tell Google what your content is about."

Sumber: <https://developers.google.com/search/docs/appearance/structured-data/article>

✅ **TERVERIFIKASI — kebijakan konten (ini yang sebenarnya menjadi gerbang)** — Google News policies mewajibkan transparansi & akuntabilitas: tanggal dan byline yang jelas, informasi tentang penulis, publikasi, penerbit/perusahaan/jaringan di baliknya, dan **informasi kontak**. Artikel harus jelas membedakan teks byline/tanggal dari kalimat pertama artikel. Pelanggaran berulang → situs bisa kehilangan eligibilitas di news surfaces.
Sumber: <https://support.google.com/news/publisher-center/answer/6204050>

> **Implikasi untuk KAMMI.id:** ini secara langsung mewajibkan adanya halaman **Tentang Kami**, **Redaksi**, **Kontak**, dan **halaman penulis**. Bukan "nice to have" — ini syarat kebijakan.

---

## 2.2 Structured data: NewsArticle vs Article vs BlogPosting

✅ **TERVERIFIKASI** — Google memperlakukan ketiganya setara:

> "Article objects must be based on one of the following schema.org types: `Article`, `NewsArticle`, `BlogPosting`."

Dan yang sering mengejutkan:

> "There are no required properties; instead, add the properties that apply to your content."

**Properti yang direkomendasikan Google (daftar lengkap):**
`author`, `author.name`, `author.url`, `dateModified`, `datePublished`, `headline`, `image`.

- `datePublished` / `dateModified`: format **ISO 8601**; timezone disarankan (tanpa timezone, Google memakai zona waktu Googlebot).
- `image`: minimal **50K piksel** (lebar × tinggi); rasio disarankan 16:9, 4:3, 1:1; harus crawlable & indexable.
- `headline`: "Consider using a concise title, as long titles may be truncated on some devices."

Sumber: <https://developers.google.com/search/docs/appearance/structured-data/article>

✅ **TERVERIFIKASI (schema.org)** — hierarki: `NewsArticle` → `Article` → `CreativeWork` → `Thing`. Properti khas NewsArticle: `dateline`, `printEdition`, `printSection`, `printPage`, `printColumn`. Dari Article: `articleBody`, `articleSection`, `wordCount`. Dari CreativeWork: `author`, `datePublished`, `dateModified`, `publisher`, `isAccessibleForFree`, `inLanguage`, `about`, `mentions`, `citation`.
Sumber: <https://schema.org/NewsArticle>

**Kapan pakai yang mana (rekomendasi berbasis definisi schema.org, bukan aturan Google):**

| Tipe | Definisi schema.org | Cocok untuk KAMMI.id |
|---|---|---|
| `NewsArticle` | "articles whose content reports news, or provides background context and supporting materials for understanding the news" | Berita organisasi, rilis pers, liputan kegiatan |
| `Article` | umum | Artikel netral/umum yang bukan berita dan bukan blog |
| `BlogPosting` | posting blog | Opini, catatan kader, tulisan personal |

⚠️ **KLAIM KOMUNITAS** — bahwa `NewsArticle` "meningkatkan peluang Top Stories" dibanding `Article`. Google secara eksplisit **tidak** menyatakan ini; docs justru bilang markup tidak diperlukan untuk eligibilitas.

---

## 2.3 Author markup (byline)

✅ **TERVERIFIKASI** — panduan spesifik Google:

> "Use the `Person` type for people, and the `Organization` type for organizations."

> "[In the] `author.name` property, only specify the name of the author. Don't add any other piece of information."
> (artinya: **jangan** tulis `"Oleh Budi, Redaktur"` atau `"Budi | KAMMI"` di `author.name`)

> "Google can understand both `sameAs` and `url` when disambiguating authors."

Praktiknya: sertakan `author.url` yang menunjuk halaman profil penulis di situs Anda (halaman yang benar-benar ada dan berisi info penulis), dan/atau `sameAs` ke profil eksternal yang otoritatif.
Sumber: <https://developers.google.com/search/docs/appearance/structured-data/article>

⚠️ **CATATAN VERIFIKASI** — halaman terpisah `/structured-data/article-author` yang sering dirujuk komunitas mengembalikan **404** saat riset ini (2 Sep 2026). Panduan author kini berada di dalam halaman Article. Jangan sitasi URL lama itu.

✅ **TERVERIFIKASI (terkait)** — `sameAs` juga direkomendasikan Google untuk `Organization` (menautkan profil resmi organisasi di platform lain).
Sumber: <https://developers.google.com/search/docs/appearance/structured-data/organization>

---

## 2.4 Datelines — `datePublished` / `dateModified`

✅ **TERVERIFIKASI** — panduan Google (halaman khusus "Article dates"):

- **Tampilkan tanggal yang terlihat pengguna, dan tonjolkan.** "Label your dates appropriately with text like 'Publish' or 'Last updated'."
- **Konsistensi wajib:** "Ensure that the date (and optional time and timezone) match between the equivalent user-visible and structured values."
- Format ISO 8601 dengan timezone designator yang benar (perhitungkan DST).
- "The date is required; the time is not: However, we recommend you provide a time and timezone in markup for added precision."
- **Jangan** pakai tanggal masa depan, atau tanggal peristiwa yang diceritakan — harus tanggal publikasi/pembaruan halaman.
- Ubah `dateModified` **hanya** saat ada pembaruan signifikan.
- Hilangkan tanggal-tanggal yang bersaing di halaman jika Google salah pilih.

Sumber: <https://developers.google.com/search/docs/appearance/publication-dates>

✅ **TERVERIFIKASI (Google News khusus)**:

> "Google News tries to determine the time and date to display for an article in a variety of ways. You can help ensure we get it right by showing a clear, visible date and time between the headline and the article text."

Sumber: <https://developers.google.com/search/blog/2019/01/ways-to-succeed-in-google-news>

> **Implikasi untuk situs Indonesia:** timezone `+07:00` (WIB) harus eksplisit di JSON-LD, dan tanggal yang di-render ke user harus berasal dari nilai yang sama. Bug umum: JSON-LD memakai UTC dari DB sementara UI memformat ke WIB → beda tanggal untuk artikel yang terbit sebelum 07:00 WIB.

---

## 2.5 Google News sitemap

✅ **TERVERIFIKASI — masih didukung** (halaman docs aktif per 2 Sep 2026):

- Isi: "recent URLs for articles that were created in the last two days". Setelah 2 hari, hapus URL-nya **atau** hapus metadata `<news:news>`-nya.
- Batas: maksimal **1.000 tag `<news:news>`** per sitemap; lebih dari itu → pecah + sitemap index.
- Empat tag wajib di dalam `<news:news>`:
  1. `<news:name>` — "It must exactly match the name as it appears on your articles on news.google.com"
  2. `<news:language>` — kode ISO 639 (`id` untuk Indonesia)
  3. `<news:publication_date>` — "The original date and time when the article was first published on your site", format W3C
  4. `<news:title>` — judul artikel, **tanpa** nama penulis/publikasi/tanggal

Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap>

**Kapan berguna:** situs yang publikasi berita rutin dan ingin discovery cepat. Google secara eksplisit menyebut sitemap berguna bila situs "is shown in Google News".
Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview>

⚠️ **BELUM TERKONFIRMASI** — apakah news sitemap "mempercepat masuk Top Stories". Docs tidak menjanjikan itu; hanya membantu discovery.

⚠️ **CATATAN PENTING (Next.js)** — konvensi `sitemap.ts` Next.js 16 **tidak mendukung namespace `news:`** (yang didukung: `images`, `videos`, `alternates.languages`). Konfirmasi dari dokumen lokal `sitemap.md`. News sitemap harus dibuat lewat **Route Handler** (`app/news-sitemap.xml/route.ts`) yang men-generate XML manual.

---

## 2.6 E-E-A-T untuk organisasi berita

✅ **TERVERIFIKASI** — pernyataan resmi Google:

> "While E-E-A-T itself isn't a specific ranking factor, using a mix of factors that can identify content with good E-E-A-T is useful."

> "Of these aspects, trust is most important."

Google memberi bobot lebih pada E-E-A-T untuk topik **YMYL** (kesehatan, keuangan, keselamatan).

Kerangka self-assessment "Who / How / Why":
- **Who** — "making authorship clear through bylines and author pages that provide background information about creators."
- **How** — jika ada otomasi/AI: "Is the use of automation, including AI-generation, self-evident to visitors through disclosures or in other ways?"
- **Why** — konten harus dibuat "primarily to help people", bukan "primarily to attract search engine visits".

Search Quality Rater Guidelines dipakai evaluator manusia, tapi: "Rater data is not used directly in our ranking algorithms."
Sumber: <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>

✅ **TERVERIFIKASI (kebijakan, bukan sekadar saran)** — Google News policies mewajibkan info penerbit + kontak (lihat §2.1).
Sumber: <https://support.google.com/news/publisher-center/answer/6204050>

**Halaman yang perlu ada (turunan dari kedua sumber di atas):**
- Tentang Kami / profil organisasi
- Susunan redaksi + kebijakan editorial (proses verifikasi, koreksi, ralat)
- Halaman kontak dengan alamat & email nyata
- Halaman penulis per-orang, ditautkan dari `author.url` di JSON-LD
- Disclosure jika ada konten dibantu AI

**Publisher markup:**
✅ `publisher` adalah properti `CreativeWork` yang di-inherit `NewsArticle`. Untuk `Organization`, Google merekomendasikan `sameAs`, logo, dll.
Sumber: <https://schema.org/NewsArticle> · <https://developers.google.com/search/docs/appearance/structured-data/organization>

---

## 2.7 RSS/Atom — masih relevan?

✅ **TERVERIFIKASI — ya, tapi bukan untuk ranking Google.** Fakta yang terverifikasi:

1. **Google menerima RSS/Atom sebagai format sitemap** dan mendukung submit lewat **WebSub**.
   Sumber: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
2. **Google punya crawler khusus feed** — `Feedfetcher` terdaftar di dokumentasi crawler Google.
   Sumber: <https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers>
3. **Next.js mendukungnya secara native** — `metadata.alternates.types` menghasilkan `<link rel="alternate" type="application/rss+xml" href="...">`.
   Sumber: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (§`alternates`)

**Untuk siapa:** agregator berita, aplikasi feed reader, bot Telegram/WhatsApp internal organisasi, layanan press-clipping, dan integrasi antar-tenant (mis. situs pusat menarik feed dari daerah). Biaya implementasi sangat rendah di Next.js (satu Route Handler).

⚠️ **BELUM TERKONFIRMASI** — klaim komunitas bahwa RSS "membantu LLM menemukan konten baru". Tidak ada vendor LLM yang mendokumentasikan konsumsi RSS.

---

# AREA 3 — SEO untuk AI (GEO / AEO)

## 3.1 Daftar crawler AI — inilah bagian paling penting

**Aturan mental:** pisahkan tiga fungsi. Memblokir fungsi yang salah = hilang dari jawaban AI tanpa mendapat perlindungan apa pun.

| Fungsi | Arti | Konsekuensi blokir |
|---|---|---|
| **Training** | konten dipakai melatih model | Blokir = konten tidak dilatih. **Tidak** menghilangkan Anda dari jawaban live. |
| **Search indexing / retrieval** | konten diindeks untuk grounding jawaban | Blokir = **Anda hilang dari jawaban & sitasi**. Ini yang mematikan. |
| **User-triggered fetch** | user menempel URL / agen membuka halaman | Blokir = halaman gagal dibuka saat user memintanya. Banyak yang **mengabaikan robots.txt**. |

### OpenAI

✅ **TERVERIFIKASI** — <https://developers.openai.com/api/docs/bots>

| User-agent | Fungsi | Patuh robots.txt | Kutipan konsekuensi |
|---|---|---|---|
| `OAI-SearchBot` (`OAI-SearchBot/1.4`) | **Search indexing** untuk ChatGPT search | Ya | **"Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links."** |
| `GPTBot` (`GPTBot/1.4`) | **Training** foundation models | Ya | "Disallowing GPTBot indicates a site's content should not be used in training generative AI foundation models." |
| `ChatGPT-User` (`ChatGPT-User/1.0`) | **User-triggered** (ChatGPT & Custom GPTs) | **Tidak** — "Because these actions are initiated by a user, robots.txt rules may not apply." | "ChatGPT-User is not used to determine whether content may appear in Search" dan tidak dipakai training |
| `OAI-AdsBot` (`OAI-AdsBot/1.0`) | Validasi keamanan landing page iklan (bukan training) | tidak dinyatakan | tidak dinyatakan |

✅ **TERVERIFIKASI (help center)** — "For site content to be included in summaries and snippets in ChatGPT, make sure you aren't blocking OAI-SearchBot"; perubahan robots.txt butuh **~24 jam** untuk terproses.
Sumber: <https://help.openai.com/en/articles/12627856-publishers-and-developers-faq> (⚠️ halaman ini menolak fetch otomatis/403 saat riset; kutipan berasal dari indeks pencarian atas halaman resmi tersebut — **verifikasi manual di browser sebelum dijadikan dasar keputusan final**)

> **KRITIS:** `GPTBot` ≠ `OAI-SearchBot`. Banyak situs Indonesia memblokir `GPTBot` (wajar, soal training) lalu ikut memblokir `OAI-SearchBot` karena dikira sama → **hilang total dari ChatGPT search**. Ini kesalahan paling mahal di daftar ini.

### Anthropic

✅ **TERVERIFIKASI** — <https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler>
(URL lama `privacy.anthropic.com` sekarang 301 ke `privacy.claude.com`.)

| User-agent | Fungsi (kutipan) | Konsekuensi blokir (kutipan) |
|---|---|---|
| `ClaudeBot` | "helps enhance the utility and safety of our generative AI models by collecting web content" → **training** | "signals that the site's future materials should be excluded from our AI model training datasets" |
| `Claude-User` | "supports Claude AI users. When individuals ask questions to Claude, it may access websites" → **user-triggered retrieval** | **"prevents our system from retrieving your content in response to a user query"** |
| `Claude-SearchBot` | "navigates the web to improve search result quality for users" → **search indexing** | **"prevents our system from indexing your content for search optimization"** |

Kepatuhan: "Anthropic's Bots respect 'do not crawl' signals by honoring industry standard directives". Mendukung ekstensi non-standar **`Crawl-delay`** (contoh resmi: `User-agent: ClaudeBot` / `Crawl-delay: 1`).

⚠️ **BELUM TERKONFIRMASI** — apakah `Claude-User` mengabaikan robots.txt untuk fetch atas permintaan user (seperti `ChatGPT-User` dan `Perplexity-User`). Dokumentasi Anthropic **tidak menyatakan** pengecualian itu; justru menyiratkan robots.txt dihormati (memblokirnya "prevents retrieval"). Jangan asumsikan perilaku OpenAI berlaku di sini.

> **KRITIS:** untuk dikutip Claude, yang harus **diizinkan** adalah `Claude-SearchBot` dan `Claude-User`. `ClaudeBot` (training) bisa diblokir tanpa kehilangan sitasi.

### Perplexity

✅ **TERVERIFIKASI** — <https://docs.perplexity.ai/docs/resources/perplexity-crawlers>

| User-agent | Fungsi (kutipan) | robots.txt |
|---|---|---|
| `PerplexityBot` | "designed to surface and link websites in search results on Perplexity. **It is not used to crawl content for AI foundation models**" | Ya. "To ensure your site appears in search results, we recommend allowing `PerplexityBot`" |
| `Perplexity-User` | "supports user actions within Perplexity. When users ask Perplexity a question, it might visit a web page to help provide an accurate answer" | **Tidak** — "Since a user requested the fetch, this fetcher generally ignores robots.txt rules" |

IP resmi dipublikasikan: `https://www.perplexity.com/perplexitybot.json` dan `https://www.perplexity.com/perplexity-user.json`.

> **KRITIS:** `PerplexityBot` **bukan** crawler training. Memblokirnya "untuk melindungi konten dari AI" adalah keputusan yang murni merugikan — tidak ada training yang dicegah, hanya visibilitas yang hilang.

### Google

✅ **TERVERIFIKASI** — <https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers>

| Token | Fungsi (kutipan) |
|---|---|
| `Googlebot` | Search, Images, Video, News, Discover |
| `Googlebot-News` | "Crawling preferences addressed to the `Googlebot-News` user agent affect the Google News product, including news.google.com and the Google News app." |
| `Google-Extended` | "Web publishers can use to manage whether content Google crawls from their sites may be used for **training future generations of Gemini models**." |
| `GoogleOther` | "Crawling preferences addressed to the `GoogleOther` user agent don't affect any specific product." |
| `Google-CloudVertexBot` | crawl untuk membangun Vertex AI Agents atas permintaan pemilik situs |
| `Google-InspectionTool` | Rich Result Test & URL Inspection di Search Console |

✅ **TERVERIFIKASI — PENTING & KONTRA-INTUITIF** — untuk **AI Overviews dan AI Mode di Google Search**, yang mengendalikan akses adalah **robots.txt untuk Googlebot**, bukan `Google-Extended`:

> "robots.txt directives for Googlebot is the control for site owners to manage access [to AI features in Search]"

Halaman AI features juga menyebut `Google-Extended` berlaku untuk "some of Google's other systems", terpisah dari fitur AI di Search. Untuk membatasi tampilan di AI features, gunakan `nosnippet`, `data-nosnippet`, `max-snippet`, atau `noindex`.
Sumber: <https://developers.google.com/search/docs/appearance/ai-features>

> **KRITIS:** memblokir `Google-Extended` **TIDAK** mengeluarkan Anda dari AI Overviews. Ia hanya mencegah training Gemini. Satu-satunya cara keluar dari AI Overviews adalah keluar dari Google Search itu sendiri (atau `nosnippet`) — trade-off yang hampir selalu tidak sepadan untuk situs organisasi.

### Microsoft / Bing

✅ **TERVERIFIKASI** — `bingbot` adalah crawler Bing; sitasi di Copilot & AI summaries berasal dari indeks Bing. Microsoft: "Bing respects all content owner preferences expressed through robots.txt and other supported control mechanisms."
Bing merekomendasikan **IndexNow** untuk notifikasi real-time perubahan URL, dan menegaskan hubungannya dengan AI: "This helps ensure changes are surfaced quickly, especially important for freshness in AI search."
Sumber: <https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview> · <https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search>

✅ **TERVERIFIKASI** — Bing Webmaster Tools kini punya laporan **AI Performance** (public preview, Feb 2026) dengan metrik: **Total Citations**, **Average Cited Pages**, **Grounding Queries**, dan **Page-level Citation Activity**.

> **Ini satu-satunya alat pengukuran sitasi AI yang bersifat first-party dan gratis** yang ditemukan dalam riset ini. Kalau ingin mengukur GEO secara empiris (bukan menebak), daftar Bing Webmaster Tools.

### Apple

✅ **TERVERIFIKASI** — `Applebot` (search/Siri/Spotlight) vs `Applebot-Extended`:

> "With Applebot-Extended, web publishers can choose to opt out of their website content being used to train Apple's general purpose foundation models powering generative AI features across Apple products, including Apple Intelligence, Services, and Developer Tools."

Penting: "Even if you disallow Applebot-Extended ... your website instructions may still allow Applebot to crawl your webpages." — `Applebot-Extended` **murni kontrol training**, bukan indexing.
Sumber: <https://support.apple.com/en-us/119829> · <https://support.apple.com/en-us/120320>

### Meta

✅ **TERVERIFIKASI** — <https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/>

| UA | Fungsi (kutipan) | robots.txt |
|---|---|---|
| `facebookexternalhit` | crawl konten yang dibagikan di app Meta (**ini yang merender preview OG/link**) | "might bypass robots.txt when performing security or integrity checks" |
| `meta-externalagent` | "crawls the web for use cases such as **training foundation AI models** or improving products by indexing content directly" | Patuh |
| `meta-externalfetcher` | "fetches individual links at a user's request" untuk "evaluating and improving agentic AI capabilities" | **"may bypass robots.txt rules"** |
| `meta-webindexer` | "navigates the web to **improve Meta AI search result quality** for users" | Patuh |
| `meta-externalads` | crawl untuk produk iklan | Patuh |

⚠️ **TEMUAN BARU** — `meta-webindexer` **tidak ada di daftar yang diminta** dan tampaknya crawler baru. Inilah UA Meta yang setara `OAI-SearchBot`/`Claude-SearchBot`. Memblokir `meta-externalagent` (training) sambil membiarkan `meta-webindexer` (retrieval) adalah konfigurasi yang benar untuk Meta AI. Verifikasi ulang halaman ini sebelum menulis robots.txt final — daftar Meta berubah.

> **KRITIS:** memblokir `facebookexternalhit` **merusak preview link di Facebook/Instagram/WhatsApp/Messenger**. Untuk organisasi Indonesia yang distribusinya berat di WhatsApp, ini konsekuensi terbesar dan paling sering tidak disadari.

### Common Crawl

✅ **TERVERIFIKASI** — `CCBot` (`CCBot/2.0`). Blokir dengan `User-agent: CCBot` / `Disallow: /`. Mematuhi `Crawl-delay`. Mengikuti hingga 4 redirect berturut-turut (5 untuk robots.txt, sesuai RFC 9309). Kini berjalan di IP range khusus dengan reverse DNS untuk verifikasi.
Sumber: <https://commoncrawl.org/ccbot>

> **Konsekuensi memblokir:** CCBot adalah sumber tak langsung bagi banyak dataset training (bukan hanya satu vendor). Memblokirnya mempengaruhi training di banyak lab sekaligus, tapi **tidak** mempengaruhi retrieval/sitasi di produk mana pun.

### Ringkasan keputusan: mana yang TIDAK BOLEH diblokir

**Blokir salah satu ini = tidak bisa dikutip saat user bertanya:**

| Crawler | Produk yang hilang |
|---|---|
| `OAI-SearchBot` | ChatGPT search answers |
| `Claude-SearchBot` | indexing untuk Claude |
| `Claude-User` | retrieval Claude saat user bertanya |
| `PerplexityBot` | hasil pencarian Perplexity |
| `Googlebot` | Google Search + AI Overviews + AI Mode + Discover |
| `Googlebot-News` | Google News |
| `bingbot` | Bing + Copilot + AI summaries |
| `meta-webindexer` | Meta AI search |
| `facebookexternalhit` | preview link WhatsApp/FB/IG (bukan AI, tapi kritis) |

**Aman diblokir kalau memang ingin menolak training (tanpa kehilangan sitasi):**
`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `CCBot`, `Google-CloudVertexBot`.

**Sebagian besar mengabaikan robots.txt (blokir hanya efektif via WAF/IP):**
`ChatGPT-User`, `Perplexity-User`, `meta-externalfetcher`, `facebookexternalhit` (untuk pengecekan integritas).

### Konteks kebijakan yang lebih luas

⚠️ **KLAIM VENDOR (Cloudflare, bukan standar)** — sejak 1 Juli 2025 ("Content Independence Day") Cloudflare mengubah default menjadi **memblokir AI crawler** untuk domain baru, plus menawarkan managed robots.txt, tombol "Block AI Bots", dan **Pay Per Crawl** (masih closed beta per pertengahan 2026).
Sumber: <https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/> · <https://developers.cloudflare.com/ai-crawl-control/>

> **Cek ini di KAMMI.id:** kalau situs di belakang Cloudflare dengan setting default baru, Anda mungkin **sudah memblokir OAI-SearchBot/PerplexityBot tanpa sadar** — di layer WAF, bukan di `robots.ts`. `robots.txt` yang permisif tidak menolong kalau WAF-nya menolak.

✅ **TERVERIFIKASI (IETF)** — sedang distandardisasi: **Working Group AIPREF**. Dua dokumen inti:
- `draft-ietf-aipref-vocab` — "A Vocabulary For Expressing AI Usage Preferences"
- `draft-ietf-aipref-attach` — "Associating AI Usage Preferences with Content in HTTP", mendefinisikan direktif **`Content-Usage`** untuk robots.txt dan HTTP response header.

Sumber: <https://datatracker.ietf.org/wg/aipref/about/> · <https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/> · <https://www.ietf.org/archive/id/draft-ietf-aipref-attach-04.html> · <https://www.ietf.org/blog/aipref-wg/>

> **Status: draft, belum RFC.** Jangan implementasikan sekarang sebagai mekanisme utama, tapi rancang `robots.ts` supaya mudah menambah direktif `Content-Usage` nanti. Ada juga `draft-car-ai-txt-wellknown` (AI.TXT) — draft individual, **bukan** produk working group, adopsi nol.

---

## 3.2 `llms.txt` — status sebenarnya per 2026

### Spesifikasi (apa isinya)

✅ **TERVERIFIKASI** — <https://llmstxt.org/>
Penulis: **Jeremy Howard**, dipublikasikan **3 September 2024**; **v2 diperbarui 10 Agustus 2026**.

Struktur wajib (berurutan):
1. Optional byte-order mark
2. **H1** — nama proyek/situs (**satu-satunya bagian yang wajib**)
3. **Blockquote** — "short summary of the project, containing key information necessary for understanding the rest of the file"
4. Konten opsional — "markdown sections (e.g. paragraphs, lists, etc) of any type except headings"
5. **H2** — memperkenalkan daftar file berisi "URLs where further detail is available"

Format item daftar: "a markdown list, containing a required markdown hyperlink `[name](url)`, then optionally a `:` and notes".

Lokasi: `/llms.txt` di root **atau di sub-path** (mis. `/docs/llms.txt`); "a file covers the pages under its path, and the most specific file applies".

Konvensi companion `.md`: sediakan versi markdown bersih dengan **menambahkan `.md`** (`page.html.md`) **atau mengganti ekstensi** (`page.md`); untuk path tanpa filename gunakan `index.html.md`/`index.md`. Spec menyarankan `rel="alternate" type="text/markdown"`.

Perubahan v1→v2 (✅ dari <https://llmstxt.org/changes.html>):
- Menambahkan link relation standar untuk penemuan: `rel="alternate" type="text/markdown"` dan `rel="describedby"`, sebagai `<link>` HTML **atau HTTP header `Link:`**.
- Mengizinkan penggantian ekstensi (`page.md`), bukan hanya penambahan.
- Memperjelas cakupan per-path.
- **Menghapus** alat `llms_txt2ctx` dan makna mekanis bagian "Optional" — kini "a useful convention for secondary links, but they no longer carry mechanical semantics".
- Pergeseran fokus dari spekulasi ke "how agents actually use websites, rather than predicting that they might".

### Adopsi nyata — bukti, bukan asumsi

**Google — MENOLAK, eksplisit dan berulang:**

✅ **TERVERIFIKASI (dokumentasi resmi Google Search Central)**:

> "You don't need to create new machine readable files, AI text files, markup, or Markdown to appear in Google Search (including its generative AI capabilities), as Google Search itself doesn't use them."

> "Doing so will neither harm nor help your site's visibility or rankings in Google Search."

Sumber: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>

⚠️ **KLAIM KOMUNITAS (pernyataan individu Google, dilaporkan pihak ketiga)** — John Mueller di Bluesky: *"FWIW no AI system currently uses llms.txt"*, membandingkannya dengan meta keywords, dan menyebut membangun halaman Markdown terpisah untuk bot sebagai ide buruk. Gary Illyes di Search Central Live APAC menyatakan Google tidak akan meng-crawl llms.txt. **Kutipan-kutipan ini dilaporkan Search Engine Journal / Search Engine Land / Search Engine Roundtable — bukan dokumentasi Google. Perlakukan sebagai indikasi arah, bukan sumber primer.**
Sumber: <https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422> · <https://www.seroundtable.com/google-ai-llms-txt-39607.html>

**OpenAI / Anthropic / Google (tim developer) — MENERBITKAN, tapi tidak pernah menyatakan MEMBACA:**

🧪 **TERVERIFIKASI EMPIRIS (curl, 2 Sep 2026)**:

| URL | Status | Ukuran |
|---|---|---|
| `https://developers.openai.com/llms.txt` | **200** `text/plain` | 5.853 B |
| `https://docs.anthropic.com/llms.txt` | **200** `text/plain` | 73.393 B |
| `https://ai.google.dev/gemini-api/docs/llms.txt` | **200** `text/markdown` | 30.072 B |
| `https://nextjs.org/llms.txt` | **200** | 12.249 B |
| `https://vercel.com/llms.txt` | **200** | 3.507 B |
| `https://docs.stripe.com/llms.txt` | **200** `text/markdown` | 90.052 B |
| `https://developers.google.com/llms.txt` | **404** | — |
| `https://www.nytimes.com/llms.txt` | **404** | — |
| `https://www.bbc.com/llms.txt` | **404** | — |

Isi nyata `developers.openai.com/llms.txt` (baris pertama, hasil curl):

```
# OpenAI Developers

> Complete documentation hub for OpenAI API, Ads, Plugins, Workspace Agents, Codex, ...

## Documentation sets
- [OpenAI API guides and reference](https://developers.openai.com/api/llms.txt): ...
```

**Kesimpulan bukti:**
- ✅ Lab AI **menerbitkan** llms.txt — untuk dokumentasi developer mereka sendiri. llmstxt.org menyatakan ini apa adanya: *"The AI labs themselves publish llms.txt files for their own developer docs"*, dan halaman itu **tidak** mengklaim mereka membacanya.
- ✅ **Tidak ada satu pun** pernyataan resmi dari OpenAI, Anthropic, atau Google yang mengatakan crawler mereka **membaca** llms.txt. Riset ini tidak menemukannya di dokumentasi bot manapun (`developers.openai.com/api/docs/bots`, `privacy.claude.com/.../8896518`, `google-common-crawlers`) — **ketiadaan** ini sendiri adalah temuan.
- ✅ Situs berita besar (NYT, BBC) **tidak** menerbitkannya. Pola adopsi = **situs dokumentasi developer**, bukan penerbit berita.
- ⚠️ Klaim komunitas "llms.txt membantu dikutip AI" **tidak punya dukungan sumber primer**.

**Sinyal berlawanan yang perlu dicatat:**

✅ **TERVERIFIKASI** — Chrome Lighthouse **mengaudit** keberadaan llms.txt di kategori "Agentic Browsing":

> "The `llms.txt` file is an emerging convention used to provide a machine-readable summary of a website's content, specifically designed for LLMs and AI agents."
> "Without this file, agents may spend more time crawling the site to understand its high-level structure and primary content."

Tapi audit itu hanya gagal saat ada **server error**; jika 404 → **Not Applicable**, karena "the file is currently optional". Chrome **tidak mengklaim** sistem AI mana pun membacanya.
Sumber: <https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt>

> **Ironi yang harus disadari saat mengambil keputusan:** tim Google Search bilang "jangan repot"; tim Google Chrome menaruh audit untuknya di Lighthouse. Ini bukan kontradiksi teknis — Search bicara soal *ranking*, Chrome bicara soal *efisiensi agen browsing*. Tapi artinya "Google bilang X tentang llms.txt" adalah pernyataan yang tidak lengkap tanpa menyebut produk mana.

### Verdict llms.txt untuk KAMMI.id

- **Bukti membaca:** nol dari vendor LLM manapun.
- **Bukti menerbitkan:** kuat, tapi hanya di kelas situs dokumentasi.
- **Biaya:** rendah (satu route handler).
- **Risiko:** nol menurut Google ("neither harm nor help").
- **Manfaat terverifikasi:** hanya efisiensi agen (klaim Chrome), tidak ada manfaat ranking/sitasi terverifikasi.

---

## 3.3 Konten Markdown untuk agen — mana yang nyata dipakai

Ini adalah bagian dengan **bukti empiris terkuat** dalam riset ini. Semua di bawah 🧪 **TERVERIFIKASI EMPIRIS** via `curl` pada 2 September 2026.

### Pola A — Suffix `.md` (paling universal)

```
GET https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview.md
  → HTTP 200, content-type: text/markdown; charset=utf-8
  (docs.claude.com → 302 → platform.claude.com)

GET https://nextjs.org/docs/app/getting-started/installation.md
  → HTTP 200, content-type: text/markdown; charset=utf-8
  → link: <https://nextjs.org/docs/app/getting-started/installation>; rel="canonical"

GET https://docs.stripe.com/payments.md
  → HTTP 200, content-type: text/markdown; charset=utf-8
  → link: </.well-known/skills/index.json>; rel="service-meta"

GET https://vercel.com/docs/functions.md
  → HTTP 200, content-type: text/markdown; charset=utf-8
  → link: <https://vercel.com/docs/functions>; rel="canonical"

GET https://developers.google.com/search/docs/fundamentals/ai-optimization-guide.md.txt
  → HTTP 200, content-type: text/markdown; charset=utf-8
```

**Google sendiri menerbitkan companion markdown** (pola `.md.txt`) untuk halaman dokumentasi Search Central — di halaman yang isinya bilang "jangan buat Markdown untuk AI". Menarik, dan layak dicatat sebagai konteks.

### Pola B — Content negotiation `Accept: text/markdown` (juga nyata, dan sama luasnya)

```
curl -H 'Accept: text/markdown' <URL-HTML>
  https://nextjs.org/docs/app/getting-started/installation      → text/markdown 200
  https://docs.stripe.com/payments                              → text/markdown 200
  https://vercel.com/docs/functions                             → text/markdown 200
  https://platform.claude.com/docs/en/build-with-claude/...      → text/markdown 200
```

**Keempatnya mendukung KEDUA pola sekaligus** — suffix `.md` dan content negotiation di URL kanonik yang sama. Ini pola de facto industri.

### Pola C — Advertising via `rel="alternate" type="text/markdown"`

🧪 **TERVERIFIKASI EMPIRIS** — tag nyata dari HTML live:

```html
<!-- nextjs.org -->
<link rel="alternate" type="text/markdown"
      href="https://nextjs.org/docs/app/getting-started/installation.md"/>

<!-- vercel.com -->
<link href="https://vercel.com/docs/functions.md" rel="alternate" type="text/markdown"/>
<link href="https://vercel.com/docs/functions.graph.md" rel="alternate"
      type="text/markdown" title="Cross-link map"/>
```

- `nextjs.org`: ✅ mengiklankan di HTML `<link>`
- `vercel.com`: ✅ mengiklankan di HTML `<link>` (bahkan dua varian)
- `docs.stripe.com`: ❌ **tidak** ada `text/markdown` di HTML-nya; sebagai gantinya ada header `Link: </.well-known/skills/index.json>; rel="service-meta"` — konvensi baru yang berbeda arah.

**Kesimpulan pola:** kombinasi yang benar-benar dipakai di lapangan =
1. Suffix `.md` yang mengembalikan `Content-Type: text/markdown`
2. Content negotiation `Accept: text/markdown` di URL yang sama
3. `<link rel="alternate" type="text/markdown">` di HTML
4. `Link: <html-url>; rel="canonical"` di **response header** varian `.md`

### Dukungan Next.js 16 (dari docs lokal)

✅ **TERVERIFIKASI** — `metadata.alternates.types` menerima MIME arbitrer dan menghasilkan `<link rel="alternate" type="..." href="...">`:

```jsx
export const metadata = {
  alternates: {
    canonical: 'https://nextjs.org',
    types: { 'application/rss+xml': 'https://nextjs.org/rss' },
  },
}
```
→
```html
<link rel="alternate" type="application/rss+xml" href="https://nextjs.org/rss" />
```

Jadi `types: { 'text/markdown': '/artikel/slug.md' }` bekerja **tanpa kode kustom**.
Sumber: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` §`alternates`

---

## 3.4 Risiko duplicate content antara HTML dan `.md`

**Jawaban resmi Google (untuk canonical, bukan spesifik markdown):**

✅ **TERVERIFIKASI**:

> "you can use a `link` HTTP response header with a `rel="canonical"` target attribute ... to indicate the canonical URL for a document supported by Search, including non-HTML documents such as PDF files."

Sumber: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>

**Apa yang dilakukan industri (bukti empiris):**

🧪 Next.js dan Vercel **memakai persis mekanisme itu** — response header canonical pada varian `.md`:

```
link: <https://nextjs.org/docs/app/getting-started/installation>; rel="canonical"
link: <https://vercel.com/docs/functions>; rel="canonical"
```

**Rekomendasi:**

1. ✅ **Kirim `Link: <url-html>; rel="canonical"` sebagai HTTP header pada setiap response `.md`.** Ini didukung resmi Google, terbukti dipakai Next.js/Vercel, dan **tidak** menghalangi agen AI membacanya.
2. ❌ **Jangan `noindex` varian `.md`.** `noindex` di robots.txt tidak didukung Google, dan `X-Robots-Tag: noindex` akan menghalangi crawler retrieval mengambil versi markdown-nya — persis kebalikan dari tujuan Anda.
3. ❌ **Jangan `Disallow: /*.md` di robots.txt.** Itu memblokir agen AI dari resource yang Anda buat untuk mereka.

⚠️ **BELUM TERKONFIRMASI** — Google tidak pernah menerbitkan panduan khusus tentang duplicate content HTML↔Markdown. Rekomendasi di atas adalah ekstrapolasi dari panduan canonical umum + observasi praktik industri. **Risiko duplicate content dalam praktik kemungkinan besar nol** karena Googlebot jarang menemukan URL `.md` (tidak masuk sitemap, hanya di `<link rel=alternate>`), tapi ini penalaran, bukan pernyataan Google.

---

## 3.5 Sinyal apa yang benar-benar membuat konten dikutip mesin jawaban

### Bukti akademik

✅ **TERVERIFIKASI** — *"GEO: Generative Engine Optimization"*, Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande — **KDD 2024**.
Sumber: <https://arxiv.org/abs/2311.09735>

Abstrak: GEO "can boost visibility by up to 40% in generative engine responses"; efektivitas bervariasi per domain.

Hasil per metode (dari versi HTML paper, <https://arxiv.org/html/2311.09735v3>):

| Metode | Perbaikan visibilitas |
|---|---|
| **Quotation Addition** (menambah kutipan) | **~41%** (Position-Adjusted Word Count) |
| **Statistics Addition** (menambah data/angka) | **~31–37%** |
| **Cite Sources** (menyebut sumber) | **~30%** |
| **Fluency Optimization** | ~15–30% |
| Easy-to-Understand | ~15–30% |
| Authoritative (nada otoritatif) | ~22%, tergantung domain (debat, sejarah) |
| Technical Terms | ~21% |
| Unique Words | ~20% (nyaris setara baseline) |
| **Keyword Stuffing** | **"little to no improvement"** — lebih buruk dari baseline di uji nyata |

Temuan kunci: generative engine "already somewhat robust" terhadap persuasi stilistik; yang dihargai adalah **penambahan substantif** — sitasi, kutipan, dan statistik berbasis data. Situs berperingkat rendah paling diuntungkan (sampai ~115% di beberapa metode).

⚠️ **BATAS VALIDITAS** — paper 2023/2024, diuji pada generasi mesin generatif saat itu (BingChat era). Jangan diperlakukan sebagai hukum alam untuk model 2026. Tapi ini satu-satunya studi peer-reviewed yang ditemukan, dan arahnya konsisten dengan panduan vendor di bawah.

### Panduan vendor (primer)

✅ **TERVERIFIKASI (Microsoft/Bing, Feb 2026)** — saran resmi untuk publisher agar dikutip di AI answers:
- **Strengthen expertise** — liputan lebih dalam pada topik yang sudah dikutip
- **Improve structure** — "clear headings, tables, and FAQ sections"
- **Support claims with evidence** — contoh dan data
- **Keep content current** — pembaruan rutin
- **Maintain consistency** across text, images, and video

Sumber: <https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview>

> Perhatikan konvergensinya: "tables/headings" (struktur), "evidence/data" (statistik), "expertise" — ini sejalan dengan tiga metode teratas paper GEO.

✅ **TERVERIFIKASI (Google)** — untuk generative AI di Search, yang berlaku adalah SEO dasar:

> "Creating content that people find unique, compelling, and useful will likely influence your website's presence in generative AI search in the long run more than any of the other suggestions."

Syarat teknis: halaman harus "indexed and eligible to be shown in Google Search **with a snippet**" — artinya `nosnippet` mengeluarkan Anda dari AI features.
Sumber: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>

✅ **TERVERIFIKASI (OpenAI)** — "ChatGPT ranks search results using multiple factors intended to help users find relevant, reliable information, and **placement is not guaranteed**." Tidak ada mekanisme "optimasi" yang didokumentasikan.
Sumber: <https://help.openai.com/en/articles/9237897-chatgpt-search>

⚠️ **KLAIM KOMUNITAS** — "kalimat deklaratif", "entitas bernama", "jawaban di 2 paragraf pertama", "format Q&A" sebagai sinyal sitasi. Tidak ada vendor yang mendokumentasikan ini. Yang paling dekat dengan dukungan primer hanyalah saran struktur Bing (headings/tables/FAQ).

---

## 3.6 Apakah crawler LLM membaca JSON-LD?

**Jawaban jujur: tidak ada bukti primer, dan ada satu bukti kontra.**

✅ **BUKTI KONTRA (Google, eksplisit)**:

> "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add."

Google tetap menyarankan memakainya "as part of your overall SEO strategy" untuk rich results.
Sumber: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>

⚠️ **TIDAK DITEMUKAN** — pernyataan dari OpenAI, Anthropic, atau Perplexity bahwa crawler mereka mem-parse JSON-LD. Dokumentasi bot mereka hanya membahas robots.txt dan user-agent, tidak menyebut format markup sama sekali. Riset ini **tidak menemukan** sumber primer manapun.

⚠️ **KONTEKS** — schema.org menyatakan "many applications from Google, Microsoft, Pinterest, Yandex and others already use these vocabularies", dan Bing punya dukungan JSON-LD di Webmaster Tools sejak 2018 — tapi itu tentang search index tradisional, bukan grounding LLM.
Sumber: <https://schema.org/> · <https://blogs.bing.com/webmaster/august-2018/Introducing-JSON-LD-Support-in-Bing-Webmaster-Tools>

**Argumen yang tetap berlaku:** karena sitasi ChatGPT/Copilot/Perplexity di-ground lewat indeks search (Bing/indeks sendiri), dan JSON-LD memengaruhi bagaimana indeks itu memahami halaman, JSON-LD punya jalur pengaruh **tidak langsung**. Tapi ini rantai penalaran, bukan bukti. ⚠️

**Praktisnya:** JSON-LD tetap dipasang — justifikasinya adalah Google rich results, Top Stories, dan Google News (semuanya terverifikasi). Bukan GEO.

---

# Keputusan yang perlu diambil (butuh manusia)

Berikut trade-off yang **tidak bisa** diselesaikan dari riset — semuanya bergantung pada nilai, risiko, dan kapasitas organisasi.

### 1. Kebijakan training AI: izinkan atau tolak?
Riset hanya bisa memisahkan crawler training dari crawler retrieval. Keputusan apakah KAMMI mengizinkan `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `CCBot` melatih model dari konten organisasi adalah **keputusan kebijakan organisasi**, bukan teknis. Menolak = konsisten dengan gerakan penerbit global, tapi mengurangi kemungkinan model masa depan "mengenal" KAMMI secara intrinsik (tanpa retrieval). Mengizinkan = kebalikannya. Yang jelas: **memblokir training tidak mengurangi peluang dikutip hari ini.**

### 2. Cloudflare: siapa yang memegang kendali sebenarnya?
Perlu dicek manual apakah KAMMI.id di belakang Cloudflare dan apakah "Block AI Bots"/managed robots.txt aktif. Kalau ya, `robots.ts` di Next.js **tidak** menjadi source of truth. Keputusan: pindahkan kendali sepenuhnya ke kode, atau ke Cloudflare, tapi **jangan dua-duanya** — konfigurasi terbelah adalah bug yang paling sulit dilacak.

### 3. `llms.txt`: buat atau tidak?
Nol bukti dibaca, nol risiko, biaya rendah, satu-satunya dukungan resmi datang dari audit Lighthouse Chrome (bukan vendor LLM). Keputusan bergantung pada seberapa besar toleransi terhadap "membangun untuk kemungkinan". Pertimbangan kontra yang nyata: file ini **harus dijaga sinkron**; llms.txt basi lebih buruk daripada tidak ada. Untuk situs multi-tenant dengan konten berubah cepat, biaya pemeliharaan bukan nol.

### 4. Varian `.md`: seluruh situs, hanya artikel, atau tidak sama sekali?
Pola industri jelas (§3.3) tapi semua contohnya adalah **situs dokumentasi** — konten stabil, terstruktur, ditulis dalam Markdown sejak awal. Berita adalah kelas yang berbeda: banyak, cepat basi, dan sudah punya HTML semantik yang bersih. Tidak ada satu pun penerbit berita di sampel yang melakukannya. Keputusan: apakah KAMMI ingin jadi yang pertama, dan apakah artikel disimpan dalam bentuk yang mudah di-serialize ke Markdown (kalau body-nya HTML dari WYSIWYG, konversinya adalah proyek tersendiri, bukan satu route handler).

### 5. `Claude-User` dan robots.txt — asumsi mana yang diambil?
Anthropic tidak menyatakan apakah `Claude-User` mengabaikan robots.txt untuk fetch atas permintaan user (OpenAI dan Perplexity menyatakan bahwa milik mereka mengabaikan). Kalau kebijakan KAMMI adalah "boleh dibaca kalau user yang minta", konfigurasinya sama saja. Kalau kebijakannya lebih ketat, ketidakpastian ini perlu diklarifikasi langsung ke Anthropic sebelum menulis robots.txt.

### 6. Multi-tenant: subdomain atau subdirectory per daerah?
Tidak diteliti secara mendalam di sini, tapi ini keputusan SEO paling berdampak untuk arsitektur multi-tenant, dan **tidak bisa diputuskan dari riset saja** — bergantung pada apakah tiap tenant ingin identitas terpisah (subdomain, otoritas terpisah, robots.txt terpisah — ingat scoping robots.txt per host di §1.3) atau ingin berbagi otoritas domain (subdirectory). Konsekuensi teknisnya besar: robots.txt, sitemap, dan Search Console semuanya per-host.

### 7. Nama publikasi di Google News sitemap
`<news:name>` harus "exactly match the name as it appears on your articles on news.google.com". Untuk multi-tenant: apakah tiap daerah adalah publikasi terpisah dengan nama sendiri, atau semuanya satu publikasi "KAMMI.id"? Ini keputusan editorial yang mengunci struktur sitemap dan Publisher Center.

### 8. Kebijakan `dateModified`
Google mensyaratkan `dateModified` hanya berubah pada "pembaruan signifikan", dan `lastmod` harus "verifiably accurate". Perlu definisi organisasi: perbaikan typo → bukan. Tambah paragraf → ya? Ganti gambar → ? Tanpa aturan tertulis, tim redaksi akan memicu update di setiap penyuntingan dan merusak sinyal freshness.

### 9. Seberapa jauh mengikuti "agentic web" (WebMCP)?
Lighthouse kini mengaudit WebMCP tools, skema, dan aksesibilitas untuk agen. Ini arah baru yang belum matang. Keputusan: investasi sekarang (early mover, standar bisa berubah) atau tunggu. Untuk situs berita, nilai WebMCP jauh lebih rendah dibanding untuk situs transaksional.

### 10. Daftar Bing Webmaster Tools?
Ini satu-satunya cara terverifikasi untuk **mengukur** sitasi AI (AI Performance: total citations, grounding queries, page-level citations). Biayanya cuma verifikasi domain. Kalau tidak diambil, semua diskusi GEO akan tetap berbasis tebakan. Keputusannya: siapa yang memegang akun, dan apakah datanya akan benar-benar dibaca rutin.

---

## Lampiran — daftar sumber primer yang dipakai

**Google Search Central**
- <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- <https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview>
- <https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap>
- <https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps>
- <https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping>
- <https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt>
- <https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag>
- <https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers>
- <https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers>
- <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- <https://developers.google.com/search/docs/crawling-indexing/links-crawlable>
- <https://developers.google.com/search/docs/appearance/structured-data/article>
- <https://developers.google.com/search/docs/appearance/structured-data/organization>
- <https://developers.google.com/search/docs/appearance/publication-dates>
- <https://developers.google.com/search/docs/appearance/snippet>
- <https://developers.google.com/search/docs/appearance/title-link>
- <https://developers.google.com/search/docs/appearance/ai-features>
- <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
- <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>
- <https://developers.google.com/search/docs/fundamentals/seo-starter-guide>
- <https://developers.google.com/search/docs/specialty/international/localized-versions>
- <https://developers.google.com/search/docs/crawling-indexing/amp>
- <https://developers.google.com/search/blog/2019/01/ways-to-succeed-in-google-news>
- <https://developers.google.com/search/blog/2021/07/google-news-top-questions>
- <https://support.google.com/news/publisher-center/answer/6204050>
- <https://support.google.com/news/publisher-center/answer/9607025>

**Web/Chrome**
- <https://web.dev/articles/vitals>
- <https://web.dev/blog/inp-cwv-launch>
- <https://developer.chrome.com/blog/chrome-at-io26>
- <https://developer.chrome.com/docs/crux/release-notes>
- <https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring>
- <https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt>
- <https://developer.chrome.com/docs/lighthouse/agentic-browsing/layout-stability>

**Bing / Microsoft**
- <https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search>
- <https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview>
- <https://blogs.bing.com/webmaster/august-2018/Introducing-JSON-LD-Support-in-Bing-Webmaster-Tools>

**Crawler AI**
- <https://developers.openai.com/api/docs/bots>
- <https://help.openai.com/en/articles/12627856-publishers-and-developers-faq>
- <https://help.openai.com/en/articles/9237897-chatgpt-search>
- <https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler>
- <https://docs.perplexity.ai/docs/resources/perplexity-crawlers>
- <https://support.apple.com/en-us/119829> · <https://support.apple.com/en-us/120320>
- <https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/>
- <https://commoncrawl.org/ccbot>

**Standar**
- <https://www.rfc-editor.org/rfc/rfc9309.html> (Robots Exclusion Protocol)
- <https://datatracker.ietf.org/wg/aipref/about/> · <https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/> · <https://www.ietf.org/archive/id/draft-ietf-aipref-attach-04.html>
- <https://ogp.me/>
- <https://developer.x.com/en/docs/x-for-websites/cards/overview/markup>
- <https://schema.org/NewsArticle>
- <https://www.sitemaps.org/protocol.html>
- <https://llmstxt.org/> · <https://llmstxt.org/changes.html>
- <https://developers.facebook.com/docs/sharing/webmasters/images/>

**Akademik**
- <https://arxiv.org/abs/2311.09735> (GEO, KDD 2024) · <https://arxiv.org/html/2311.09735v3>

**Dokumentasi lokal Next.js 16.3.1** (`node_modules/next/dist/docs/`)
- `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`
- `01-app/03-api-reference/04-functions/generate-metadata.md`
- `01-app/03-api-reference/04-functions/generate-sitemaps.md`

**Sumber sekunder (ditandai sebagai klaim komunitas di badan dokumen)**
- <https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422>
- <https://www.seroundtable.com/google-ai-llms-txt-39607.html>
- <https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/>
- <https://developers.cloudflare.com/ai-crawl-control/>
