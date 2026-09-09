# 01 — Prasyarat: DNS, TLS panel, PAT, dan rahasia

**What to build:** Instance Dokploy non-production dapat dihubungi lewat HTTPS
dengan sertifikat sah, subdomain staging sudah mengarah ke mesinnya, dan
GitHub Actions memegang kredensial untuk berbicara dengannya. Setelah tiket ini,
tidak ada lagi rahasia yang melintas dalam bentuk terbaca.

**Blocked by:** None — can start immediately.

**Status:** done — semua prasyarat terpenuhi dan diverifikasi ulang secara
independen (lihat Comments)

Panel saat ini melayani HTTP telanjang di sebuah alamat IP. Selama itu bertahan,
setiap deploy menyiarkan API key yang memegang kendali penuh atas instance —
termasuk kemampuan membaca seluruh variabel lingkungan tiap aplikasi di
dalamnya. Karena itu tiket ini mendahului segalanya, bukan menyusul.

`/wizard` adalah perkakas yang tepat untuk langkah-langkah ini: ia membuka tiap
laman yang perlu diklik, menangkap tiap nilai, dan menuliskannya ke `.env.local`
serta ke GitHub Secrets.

- [x] Record A untuk subdomain staging mengarah ke VPS non-production
- [x] Record A untuk subdomain panel mengarah ke VPS non-production
- [x] Panel Dokploy dilayani lewat HTTPS dengan sertifikat Let's Encrypt yang sah
- [x] `settings.health` menjawab `{"status":"ok"}` lewat HTTPS tanpa perlu
      melewati verifikasi sertifikat
- [x] PAT GitHub ber-scope `read:packages` dibuat
- [x] `DOKPLOY_NONPROD_URL` di `.env.local` naik ke `https://`
- [x] Rahasia repositori `DOKPLOY_NONPROD_URL` dan `DOKPLOY_NONPROD_API_KEY`
      tersetel di GitHub

## Comments

Alamat host sengaja tidak dicatat di berkas ini — `.scratch/` ikut ter-commit.
Nilainya ada di `.env.local`.

DNS sudah diverifikasi lewat `dig` (2026-08-21): `staging.kammi.id` dan
wildcard `*.staging.kammi.id` (dipakai untuk domain panel,
`console.staging.kammi.id`) sudah mengarah ke VPS non-production, resolusi
langsung ke IP (bukan lewat proxy Cloudflare) — sesuai kebutuhan tantangan
HTTP-01 Let's Encrypt. Kedua item checklist DNS di atas dicentang atas dasar
ini, bukan dikerjakan lewat wizard.

Nama domain panel yang dipakai: `console.staging.kammi.id` (bukan
`dokploy.kammi.id`/`panel.kammi.id` yang tadinya diajukan — pengguna sudah
punya wildcard `*.staging.kammi.id` yang mengarah ke mesin yang sama).

Sisa checklist (TLS panel, verifikasi HTTPS, PAT, rahasia GitHub) dikerjakan
lewat `/wizard`. Pengguna melaporkan selesai pada 2026-08-21; diverifikasi
ulang secara independen bukan lewat laporan wizard saja:

- `openssl s_client` ke `console.staging.kammi.id:443` menunjukkan sertifikat
  asli terbit Let's Encrypt (issuer `Let's Encrypt`), `notBefore` 21 Aug 2026,
  `notAfter` 19 Nov 2026.
- `curl` ke `settings.health` lewat HTTPS **tanpa** `-k` mengembalikan
  `{"status":"ok"}` — verifikasi sertifikat aktif dan lolos.
- `DOKPLOY_NONPROD_URL` di `.env.local` sudah `https://console.staging.kammi.id/`.
- `gh secret list --repo kammi-id/kammi-id` menunjukkan `DOKPLOY_NONPROD_URL`
  dan `DOKPLOY_NONPROD_API_KEY` keduanya tersetel 2026-08-21.
- `DOKPLOY_NONPROD_GHCR_PAT` (PAT `read:packages` untuk tiket 03) ada di
  `.env.local`, nilainya tidak dicek isinya di sini — cukup keberadaannya.

Tiket 01 selesai. Frontier berikutnya: **02** (sudah bisa jalan sendiri) dan
**03**, yang sekarang tak lagi diblokir.
