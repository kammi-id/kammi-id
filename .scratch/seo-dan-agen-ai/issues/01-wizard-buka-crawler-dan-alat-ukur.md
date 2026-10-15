# 01 — Wizard: buka crawler AI, daftarkan alat ukur

**What to build:** Satu wizard bash interaktif yang memandu empat langkah yang
tidak bisa dikerjakan agen — semuanya di dashboard pihak ketiga — lalu
membuktikan sendiri bahwa langkahnya berhasil.

**Blocked by:** None — can start immediately.

**Status:** done — diverifikasi ulang lewat curl langsung 2026-09-03, lihat Comments

Ini tiket pertama bukan karena paling mudah, melainkan karena tujuh tiket
sesudahnya tidak bisa dinilai tanpanya. Selama `OAI-SearchBot` dijawab 403,
seluruh pekerjaan sisanya memoles halaman yang tidak sampai ke penanyanya.

- [x] Wizard di `.scratch/seo-dan-agen-ai/wizard-01-buka-crawler-dan-alat-ukur.sh`,
      mengikuti bentuk wizard yang sudah ada di `.scratch/cd-non-prod/` dan
      `.scratch/berita-polish/`.
- [x] **Langkah 1 — Cloudflare, matikan blok AI.** Panduan ke Security → Bots →
      AI Crawl Control, mematikan blokir crawler AI. Wizard menjelaskan
      perbedaan bot pelatih dan bot pengambil (ADR 0023) supaya orang yang
      menjalankannya tahu apa yang sedang ia setujui.
- [x] **Langkah 2 — Cloudflare, selaraskan Content Signals** menjadi
      `ai-train=yes`, konsisten dengan langkah 1. Kalau dibiarkan `ai-train=no`,
      `robots.txt` menyatakan dua hal yang bertentangan. **Catatan:** hasil
      akhirnya lebih kuat dari yang diminta literal — lihat Comments.
- [x] **Langkah 3 — Google Search Console, properti Domain** (`kammi.id`, bukan
      `https://www.kammi.id`), diverifikasi lewat DNS TXT di Cloudflare.
      Properti Domain mencakup **seluruh subdomain sekaligus**, sehingga tidak
      ada Struktur yang perlu didaftarkan satu per satu — dan itu juga
      prasyarat sitemap index lintas subdomain di tiket 05.
- [x] **Langkah 4 — Bing Webmaster Tools**, impor dari GSC (jalur tercepat),
      lalu nyalakan **IndexNow**. Cloudflare punya toggle IndexNow satu-klik;
      pakai itu, jangan tulis kode ping.
- [x] Wizard menjelaskan kenapa Bing tidak opsional: ia mesin di balik
      pencarian ChatGPT, dan panel **AI Performance**-nya satu-satunya alat
      first-party gratis yang menghitung sitasi AI per halaman.
- [x] **Verifikasi otomatis di akhir.** Wizard meng-curl `https://www.kammi.id/`
      dengan User-Agent `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`,
      `Googlebot`, dan `facebookexternalhit`, lalu menampilkan tabel kode
      responsnya. Ia **gagal dengan pesan jelas** kalau bot AI mana pun masih
      403, dan **juga gagal** kalau `facebookexternalhit` berhenti 200 —
      pratinjau tautan WhatsApp dan Instagram tidak boleh jadi korban.
- [x] Wizard mengambil ulang `https://www.kammi.id/robots.txt` dan
      memperingatkan kalau blok `# BEGIN Cloudflare Managed content` masih ada.
- [x] Wizard aman dijalankan berulang: setiap langkah mendeteksi keadaan yang
      sudah benar dan melewatinya, bukan menyuruh mengulang.
- [x] Wizard **tidak** menyentuh basis data, tidak menyentuh production, dan
      tidak menyimpan kredensial apa pun.

## Catatan

Batas uji yang perlu diketahui pelaksana: curl dari IP sembarang bukan bukti
sempurna, karena Cloudflare memverifikasi bot lewat rDNS/IP. Yang membuat
temuan ini kuat adalah asimetrinya — `Googlebot` palsu dari IP yang sama lolos
200 sementara UA AI ditolak 403, yang menunjukkan aturan yang menyasar AI
secara khusus. Bukti pastinya ada di Firewall Events pada dashboard, dan
wizard menyuruh pelaksana membukanya.

## Comments

**Wizard:** `.scratch/seo-dan-agen-ai/wizard-01-buka-crawler-dan-alat-ukur.sh`,
7 stage. Dijalankan 2026-09-03. Satu bug ditemukan dan diperbaiki di tengah
jalan: `mark="$GREEN✓$RESET"` (tanpa kurung kurawal) bikin bash salah
mengurai nama variabel karena byte lanjutan karakter multi-byte ✓ ikut
tertelan sebagai bagian nama var — meledak `unbound variable` di stage 6.
Diperbaiki jadi `${GREEN}✓${RESET}` di semua kemunculan (3 tempat).

**Verifikasi independen lewat curl langsung (bukan cuma laporan pelaksana),
2026-09-03:**

```
OAI-SearchBot          200
PerplexityBot          200
ClaudeBot              200
Googlebot              200
facebookexternalhit    200
```

**robots.txt sekarang:**

```
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /api/

Sitemap: https://www.kammi.id/sitemap.xml
```

Blok `# BEGIN Cloudflare Managed content` sudah hilang total — bukan cuma
`ai-train` yang diselaraskan, melainkan seluruh injeksi Cloudflare dicabut.
`src/app/robots.ts` sekarang **sudah** jadi satu-satunya penulis robots.txt,
lebih cepat dari yang diantisipasi ADR 0023 (yang membayangkan itu sebagai
langkah lanjutan setelah tiket ini). Konsekuensinya: tidak ada baris
`Content-Signal` sama sekali lagi (bukan `ai-train=no`, tapi juga bukan
`ai-train=yes` eksplisit seperti diminta checklist Langkah 2). Ditanyakan ke
pelaksana; jawaban: diterima apa adanya — kontradiksi `ai-train=no` vs
crawler terbuka sudah tuntas, dan `robots.ts` sebagai satu penulis dianggap
lebih penting daripada baris sinyal eksplisit yang toh sumbernya sekarang
kode, bukan panel Cloudflare.

**GSC (properti Domain `kammi.id`) dan Bing Webmaster Tools + IndexNow**:
dikonfirmasi pelaksana sudah beres sebelum wizard ini pertama dijalankan
(TXT `google-site-verification` sudah ada di DNS, wizard mendeteksinya dan
melewati langkah itu) — tidak ada bukti independen dari sesi ini di luar
laporan pelaksana untuk dua langkah ini, karena keduanya dashboard pihak
ketiga tanpa API key yang dipegang sesi ini.
