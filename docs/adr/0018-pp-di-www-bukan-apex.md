---
status: accepted
---

# PP tinggal di `www.kammi.id`, bukan apex — ADR 0012 dibalik sebagian

ADR 0012 menetapkan PP menempati apex `kammi.id` dan `www.kammi.id` redirect
ke apex. Keputusan itu dibalik: **PP sekarang menempati `www.kammi.id`**, dan
apex `kammi.id` yang redirect ke `www`. Bagian lain ADR 0012 — satu segmen
tenant untuk seluruh Struktur, PP bukan pengecualian, penjagaan path internal
— tidak berubah.

Pembalikan ini ditemukan lewat insiden, bukan direncanakan. Domain
`kammi.id` sudah lama punya Cloudflare redirect rule apex→`www` yang berjalan
di luar Dokploy/origin sepenuhnya. ADR 0012 ditulis tanpa memeriksa aturan itu
dan mengasumsikan arah sebaliknya. Saat cutover production candidate
mencoba memindahkan `www.kammi.id` ke Application baru (30 Agustus 2026),
kedua redirect saling berlawanan arah — Cloudflare apex→www, aplikasi
www→apex — dan menghasilkan redirect loop yang membuat `kammi.id` dan
`www.kammi.id` tidak bisa diakses selama beberapa menit sebelum domain
dikembalikan ke Application lama.

## Considered Options

**Mengubah rule Cloudflare** supaya searah dengan ADR 0012 (apex tetap PP,
`www` redirect ke apex) dipertimbangkan. Ditolak untuk perbaikan ini karena
operator tidak punya akses Cloudflare dari sesi kerja ini, dan mengubah
konvensi eksternal yang sudah berjalan lama berisiko memutus tautan/bookmark
lama yang mengarah ke `www.kammi.id` tanpa manfaat yang sepadan dengan
risikonya.

**Membiarkan origin menangani kedua host sebagai identik** (apex dan `www`
sama-sama melayani PP langsung, tidak ada redirect di app sama sekali) juga
dipertimbangkan. Ditolak karena kanonikal ganda merusak SEO (dua URL untuk
satu konten) — masalah yang sama yang membuat ADR 0012 menolak pengecualian
apex.

## Consequences

`resolveStrukturHost` untuk PP sekarang mengembalikan `www.kammi.id`, bukan
`kammi.id` — dipakai `berita-jaringan-section`/`berita-jaringan-archive` untuk
alamat absolut Berita Jaringan. `tenant-host.ts` membalik anggota
`APEX_HOSTS`: `www.kammi.id` masuk, apex telanjang keluar dan menjadi kasus
`redirect-to-www`. JSON-LD (`buildWebSite`, `buildOrganization`,
`buildBreadcrumb`) dan `metadataBase` di root layout ikut disamakan ke
`https://www.kammi.id` supaya data terstruktur dan canonical tag tidak
menunjuk ke host yang berbeda dari yang benar-benar melayani.

Perbaikan ini juga membetulkan bug independen yang ikut ketemu saat insiden:
redirect apex↔www sebelumnya membocorkan port internal container
(`https://kammi.id:3000/`) karena `nextUrl.clone()` mewarisi port bind lokal
Next.js di belakang Traefik. Redirect sekarang memaksa `protocol: 'https:'`
dan `port: ''` secara eksplisit, tidak lagi mewarisi apa pun dari request
masuk.

**Smoke test cutover berikutnya wajib menguji lewat rantai Cloudflare
sungguhan** (request publik ke domain asli), bukan cuma header `Host`
disuntikkan langsung ke origin lewat jaringan internal. Metode terakhir ini
yang dipakai `wizard-07`/`wizard-09` dan tidak akan pernah menangkap konflik
redirect seperti insiden ini, karena Cloudflare tidak ada di jalur pengujian
itu.
