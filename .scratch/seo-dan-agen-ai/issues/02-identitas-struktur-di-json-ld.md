# 02 — Identitas Struktur di JSON-LD dan canonical di seluruh rute publik

**What to build:** Setiap Situs Struktur menyatakan dirinya sendiri, bukan PP,
dan pohon KAMMI nasional bisa dirakit mesin dengan menelusurinya.

**Blocked by:** None — bisa jalan paralel dengan 01.

**Status:** done — merged (a69d200/0a8ddea), cleanup pass c1a63c1; status doc was never updated after merge, backfilled 2026-09-03

Bug hari ini: `buildOrganization()` di `src/lib/seo/json-ld.ts` mengeraskan
`www.kammi.id` beserta akun sosial PP, dan `src/app/layout.tsx` menyuntikkannya
ke setiap Situs Struktur. Subdomain PW Aceh mengaku sebagai PP kepada setiap
mesin yang membacanya. Ini sudah berjalan di production.

- [x] `buildOrganization` menerima Struktur sebagai **argumen** dan berhenti
      mengeraskan apa pun. Bentuk yang sama dengan pembaca data publik lain di
      repo ini (ADR 0012): identitas dioper, tidak diambil diam-diam.
- [x] Setiap Struktur punya `@id` stabil berbentuk
      `https://<host-struktur>/#organization`, memakai `resolveStrukturHost`
      yang sudah ada. `@id` ini dipakai ulang oleh tiket 03 sebagai `publisher`
      setiap Berita — itulah sambungan yang membuat sebuah halaman terbaca
      sebagai sumber pertama.
- [x] `name`, `url`, dan `logo` diambil dari baris `organization` (`logo`
      lewat `resolveSiteImage`, diserap menjadi URL absolut). Struktur tanpa
      logo tidak memasang properti `logo` sama sekali — bukan string kosong,
      bukan logo PP.
- [x] `parentOrganization` menunjuk `@id` induk langsung; `subOrganization`
      mendaftar `@id` **anak langsung saja**. Bukan seluruh keturunan: PP bisa
      punya ratusan turunan, dan JSON-LD ratusan entri di setiap halaman itu
      berat tanpa guna. Graf lengkapnya terangkai saat crawler menelusuri.
- [x] Anak yang Terhapus, Non-Aktif, atau Situsnya belum Aktif **tidak** ikut
      di `subOrganization` — ADR 0013. Menautkan ke alamat yang tidak melayani
      adalah tautan mati yang kita buat sendiri.
- [x] `sameAs` hanya di **PP**: `https://www.wikidata.org/wiki/Q85992000`,
      `https://id.wikipedia.org/wiki/Kesatuan_Aksi_Mahasiswa_Muslim_Indonesia`,
      plus akun sosial yang sudah terdaftar. Struktur daerah **tidak** mewarisi
      ini — mereka bukan entitas yang sama, dan mengklaim begitu justru
      merusak resolusi entitasnya sendiri.
- [x] `buildWebSite` ikut per-Struktur: `name` dan `url` mengikuti Struktur,
      dan `publisher` menunjuk `@id` organisasinya.
- [x] JSON-LD berpindah dari `src/app/layout.tsx` (yang tidak tahu Struktur
      mana) ke tempat yang tahu. Root layout berhenti menyuntik identitas
      organisasi apa pun.
- [x] `alternates.canonical` dipasang di **seluruh** rute publik — beranda,
      `/berita`, `/berita/seindonesia`, `/event`, `/tentang`,
      `/tentang/pengurus`, Halaman, dan Permalink Berita. Hari ini tidak ada
      satu pun di seluruh aplikasi.
- [x] `metadataBase` mengikuti host Struktur, bukan `www.kammi.id` yang
      dikeraskan di `src/app/layout.tsx`.
- [x] Uji: dua Struktur berbeda menghasilkan `@id`, `name`, `url`, dan
      `canonical` yang berbeda; PP punya `sameAs`, PW tidak; anak Non-Aktif
      tidak muncul di `subOrganization`.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.
