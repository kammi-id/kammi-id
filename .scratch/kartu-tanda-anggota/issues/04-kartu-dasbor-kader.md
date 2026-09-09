# 04 — Kartu Tanda Anggota dan dasbor Kader

**What to build:** dasbor untuk `role = 'member'` — Kartu Tanda Anggota di atas,
ringkasan data di bawah, tautan ke profil lengkap — plus menu sidebar yang hari
ini kosong sama sekali.

**Blocked by:** 01

**Status:** ready-for-agent

## Keadaan hari ini

Seorang Kader yang masuk mendarat di `/dashboard` dan melihat **hanya sapaan**.
Seluruh blok statistik digerbangi `['root','bph','bpk']` atau
`['root','bph','bpw']`, dan setiap entri menu disaring habis oleh
`item.roles.includes(user.role)` — `menuPembinaan` seluruhnya, dan `menuOrganisasi`
lewat `canAccessOrg`. Sidebar-nya kosong. Halaman kosong.

## Kartunya

Definisi domainnya ada di `CONTEXT.md` → **Kartu Tanda Anggota**; alasan
bentuknya di ADR 0029.

Yang tampil: foto, nama, **Nomor Induk Anggota**, Struktur, **Jenjang
Kaderisasi**, tahun masuk. Ditambah **Keadaan Kader hanya ketika ia bukan
Aktif** — penanda "Alumni" atau "Sanksi" di tempat yang pada Kader Aktif kosong,
supaya kasus lazimnya bersih dan kasus perkecualiannya tidak bisa bersembunyi.

**Tidak ada QR, dan tidak ada ruang kosong yang menunggunya.** Verifikasi belum
diputuskan (tiket 07); kotak kosong yang menunggu adalah janji kepada pengguna
yang belum tentu ditepati.

Rasio kartu 85,6 × 54 mm supaya apa yang di layar sebangun dengan yang dicetak
di tiket 05.

## Ringkasannya

Di bawah kartu: rantai Struktur (`getCachedOrgHierarchyChain` sudah ada),
Jenjang, tahun masuk, Keadaan, dan **riwayat Daurah** — yang terakhir ini satu
hal yang paling sering perlu dibuktikan seorang Kader dan hari ini tidak bisa ia
lihat di mana pun. Sertifikasi Perangkat tampil hanya bila ada, dan selalu
baca-saja. Tautan ke `/dashboard/profile/<NIA sendiri>` untuk selebihnya.

## Sidebar

Untuk `role = 'member'`: **Dashboard**, **Profil Saya**
(`/dashboard/profile/<NIA sendiri>`, NIA dibaca dari
`session.user.connectedMember`), **Pengaturan Akun**. Tidak ada yang lain — Data
Kader, Daurah, Perangkat, Alumni semuanya tetap tersembunyi.

## Catatan struktur

`page.tsx` sudah adaptif-peran lewat bendera `showKader`/`showWilayah`;
tambahkan cabang yang sebangun, jangan buat rute baru. Komponen kartunya hidup
di `dashboard/_components/kartu-tanda-anggota/` dengan barrel-nya sendiri
(`AGENTS.md`) — tiket 05 mengimpornya dari sana, jadi ia memang unit yang
diekspor.

`'use client'` di daun saja; kartunya bisa seluruhnya Server Component.

## Selesai bila

- Kader yang masuk melihat kartunya, bukan halaman kosong.
- Kader ber-Keadaan Sanksi atau Alumni melihat penandanya; Kader Aktif tidak.
- Sidebar-nya berisi tepat tiga entri.
- `check:structure` hijau (barrel, penamaan kebab-case, tidak ada berkas
  telanjang di akar `_components/`).
