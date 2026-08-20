# 01 — Prasyarat: DNS, TLS panel, PAT, dan rahasia

**What to build:** Instance Dokploy non-production dapat dihubungi lewat HTTPS
dengan sertifikat sah, subdomain staging sudah mengarah ke mesinnya, dan
GitHub Actions memegang kredensial untuk berbicara dengannya. Setelah tiket ini,
tidak ada lagi rahasia yang melintas dalam bentuk terbaca.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human — butuh akses DNS, panel Dokploy, dan pengaturan
repositori GitHub

Panel saat ini melayani HTTP telanjang di sebuah alamat IP. Selama itu bertahan,
setiap deploy menyiarkan API key yang memegang kendali penuh atas instance —
termasuk kemampuan membaca seluruh variabel lingkungan tiap aplikasi di
dalamnya. Karena itu tiket ini mendahului segalanya, bukan menyusul.

`/wizard` adalah perkakas yang tepat untuk langkah-langkah ini: ia membuka tiap
laman yang perlu diklik, menangkap tiap nilai, dan menuliskannya ke `.env.local`
serta ke GitHub Secrets.

- [ ] Record A untuk subdomain staging mengarah ke VPS non-production
- [ ] Record A untuk subdomain panel mengarah ke VPS non-production
- [ ] Panel Dokploy dilayani lewat HTTPS dengan sertifikat Let's Encrypt yang sah
- [ ] `settings.health` menjawab `{"status":"ok"}` lewat HTTPS tanpa perlu
      melewati verifikasi sertifikat
- [ ] PAT GitHub ber-scope `read:packages` dibuat
- [ ] `DOKPLOY_NONPROD_URL` di `.env.local` naik ke `https://`
- [ ] Rahasia repositori `DOKPLOY_NONPROD_URL` dan `DOKPLOY_NONPROD_API_KEY`
      tersetel di GitHub

## Comments

Alamat host sengaja tidak dicatat di berkas ini — `.scratch/` ikut ter-commit.
Nilainya ada di `.env.local`.
