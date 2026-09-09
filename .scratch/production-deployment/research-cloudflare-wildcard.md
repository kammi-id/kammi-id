# Wildcard production dan Cloudflare Free

Ditinjau 2026-09-07. Riset dokumentasi dan ringkasan aktivasi production.

## Kesimpulan

Cloudflare Free mencukupi untuk subdomain organisasi satu tingkat seperti
`aceh.kammi.id` melalui `*.kammi.id`. Tidak diperlukan upgrade paket untuk
wildcard DNS, proxy wildcard, Universal SSL, atau Origin CA.

| Kebutuhan | Dukungan dan sumber resmi |
| --- | --- |
| Wildcard DNS dan proxy | Semua paket dapat membuat dan mem-proxy wildcard. [Cloudflare Wildcard DNS](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/) |
| TLS browser ke Cloudflare | Universal SSL gratis di semua paket. Pada full nameserver setup mencakup apex dan subdomain satu tingkat. [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/) |
| TLS Cloudflare ke Dokploy | Origin CA tersedia pada Free dan dapat mencakup wildcard. Mendukung Full (strict). [Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) |
| Mengelola DNS melalui UI Dokploy | Integrasi DNS Providers merupakan fitur Enterprise. Integrasi ini terpisah dari konfigurasi domain aplikasi dan tidak wajib dipakai. [Dokploy DNS Providers](https://docs.dokploy.com/docs/core/dns-providers) |

## Dua pilihan TLS

### Proxy Cloudflare dan Origin CA

Rekomendasi untuk situs organisasi bila trafik publik akan selalu melewati
Cloudflare: record wildcard diproxy, Universal SSL melayani pengunjung,
Origin CA wildcard dipasang pada Dokploy, dan koneksi origin menggunakan
Full (strict). Pilihan ini diterapkan pada production pada 2026-09-07;
lihat ringkasan aktivasi di bawah.

Dokploy mendokumentasikan pemasangan PEM certificate dan private key lewat
Certificates, kemudian domain memakai HTTPS ON dengan Certificate None untuk
menggunakan sertifikat yang telah dipasang. Panduan tersebut secara eksplisit
mendukung wildcard. Konfigurasi Traefik tetap harus mengenali sertifikat dan
mengarah ke aplikasi yang benar. [Dokploy Cloudflare](https://docs.dokploy.com/docs/core/domains/cloudflare),
[Dokploy Certificates](https://docs.dokploy.com/docs/core/certificates).

Origin CA tidak dipercaya browser untuk akses langsung ke origin. Karena itu,
pemasangan Origin CA saja tidak menyelesaikan HTTPS pada record DNS-only.
[Batas Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/).

### Let's Encrypt melalui DNS-01

Alternatif untuk mempertahankan akses DNS-only adalah sertifikat publik
wildcard melalui DNS-01. Syarat DNS-01 berlaku untuk penerbitan wildcard ACME;
bukan syarat universal bagi semua pilihan TLS wildcard.
[Traefik ACME](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/#wildcard-domains).

Provider Cloudflare pada lego mendukung API token. Token dapat dibatasi pada
zona yang diperlukan dengan Zone Read dan DNS Edit; konfigurasi token
terpisah atau token yang sama untuk kedua variabel didokumentasikan.
[lego Cloudflare](https://go-acme.github.io/lego/dns/cloudflare/).

## Batas subdomain lebih dalam

`*.kammi.id` pada sertifikat tidak mencakup `a.staging.kammi.id`. Universal SSL
pada full setup memiliki batas satu tingkat; cakupan edge lebih dalam
memerlukan solusi sertifikat tambahan, misalnya advanced certificates atau
Total TLS. Ini terpisah dari kemampuan wildcard DNS yang dapat menjangkau
nama lebih dalam, bergantung pada record yang lebih spesifik.
[Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/),
[Wildcard DNS](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/).

## Pemeriksaan sebelum aktivasi — 2026-09-07

Observasi langsung DNS, HTTPS, dan API Dokploy; bukan klaim dokumentasi vendor:

- Wildcard A menuju `103.126.117.171`, sama dengan `settings.getIp` Dokploy.
- Dokploy versi `v0.30.2`; aplikasi `kammi-id-prod / app` hanya mempunyai
  domain `www.kammi.id` dan `candidate.production.kammi.id`.
- Konfigurasi Traefik aplikasi belum mempunyai router wildcard.
- Host wildcard percobaan mendapat HTTP 404 dan TRAEFIK DEFAULT CERT.
- Resolver yang tersedia memakai HTTP-01; belum ada DNS challenge maupun
  variabel kredensial Cloudflare pada Traefik.
- Health check production utama menjawab `{"status":"ok"}`.

## Hasil aktivasi — 2026-09-07

- Record A `*.kammi.id` tetap menuju IP production, dengan proxy Cloudflare
  aktif. Paket tetap Free; Universal SSL untuk apex dan wildcard sudah aktif.
- Origin CA untuk `kammi.id` dan `*.kammi.id` dipasang melalui Certificates
  Dokploy. Sertifikat berlaku sampai 3 September 2041; masa berlakunya perlu
  dipantau karena tidak diperbarui melalui ACME.
- Mode SSL Cloudflare berubah dari Full menjadi Full (strict).
- Routing wildcard satu tingkat dipasang pada file Traefik
  `/etc/dokploy/traefik/dynamic/kammi-id-prod-wildcard.yml`, melalui API Dokploy.
  File ini terpisah dari domain yang dihasilkan otomatis; tidak ada baris
  wildcard baru pada daftar Domains aplikasi.
- Router memakai `HostRegexp`, prioritas `1`, tujuan `http://app-78ev7h:3000`,
  dan `passHostHeader: true`. Router exact untuk domain infrastruktur tetap
  menang sesuai [runbook production](../../docs/operations/production-deployment.md).
- Record A DNS-only tersendiri ditambahkan untuk
  `candidate.production.kammi.id` dan `old-prod.kammi.id`, agar akses langsung
  keduanya tetap terjaga setelah wildcard diproxy.

HTTPS publik pada hostname wildcard baru menjawab readiness
`200 {"status":"ok"}` melalui Cloudflare; HTTP dialihkan ke HTTPS.
TLS langsung ke origin juga lolos menggunakan root CA resmi Cloudflare.
Verifikasi sertifikat tidak dinonaktifkan dalam kedua pemeriksaan.

Apex tetap mengarah ke `www`. Health check `www`, kandidat, staging, serta
panel Dokploy terautentikasi berhasil. Root layanan aset mempertahankan
respons RustFS AccessDenied yang sama seperti sebelum aktivasi.

Host `aceh.kammi.id` dan `jawa-barat.kammi.id` diteruskan ke tenant masing-masing,
tetapi kontennya masih memberi penanda not-found dari aplikasi. Aktivasi ini
tidak mengubah slug atau status publikasi tenant. `get_errors` tidak tersedia
karena dev server lokal tidak aktif.

Tidak ada perubahan kode, image aplikasi, redeploy, atau restart Traefik.
Detail operasi dan identitas resource disimpan di catatan provisioning lokal
yang diabaikan Git; kredensial dan private key tidak disertakan dalam dokumen ini.
