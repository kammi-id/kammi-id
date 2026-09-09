# 02 — Subdomain dikenali, Situs Aktif jadi syarat

**What to build:** Pembaca yang membuka `<slug>.kammi.id` mendapat Situs Struktur milik Struktur itu, dengan Pengaturan Situs dan isinya sendiri. Situs Struktur yang belum dinyalakan, slug yang tidak dikenal, dan Struktur Terhapus sama-sama menjawab tidak ditemukan. PP menempati apex sebagai tenant biasa, dan penandanya dinyalakan lewat migrasi sehingga `kammi.id` tidak pernah mati.

**Blocked by:** 01

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] `<slug>.kammi.id` melayani Situs Struktur milik slug tersebut; membuka dua subdomain berbeda memberi isi yang berbeda.
- [x] Penanda Situs Aktif adalah kolom pada Struktur, bukan nilai di dalam Pengaturan Situs, sehingga ia dapat menjadi klausa penyaring pada query.
- [x] Migrasi menyalakan penanda itu untuk PP; apex melayani seperti sebelumnya segera setelah deploy.
- [x] Slug tidak dikenal, Struktur Terhapus, dan Situs yang belum aktif menjawab tidak ditemukan, tanpa membocorkan mana yang mana.
- [x] Alamat internal hasil rewrite ditolak bila diketik langsung dari luar (ADR 0012).
- [x] Aset tidak ikut ter-rewrite: `_next`, berkas berekstensi, dan jalur gambar tetap dilayani di setiap subdomain.
- [x] `www` pada apex mengantar ke apex.

## Comments

Tiga hal tak terduga, relevan untuk tiket berikutnya yang menyentuh `proxy.ts`
atau `organization`:

- **`request.nextUrl.hostname` bukan `Host` yang dikirim klien.** Di server
  dev lokal (dan kemungkinan di balik reverse proxy sungguhan juga),
  `nextUrl.hostname` mencerminkan alamat bind server (`localhost`), bukan
  header `Host` permintaan. Proxy sekarang membaca
  `request.headers.get('host')` secara eksplisit (dengan `nextUrl.hostname`
  sebagai fallback untuk `NextRequest` yang dibuat langsung dari URL, seperti
  di tes). Tanpa ini, setiap subdomain diam-diam jatuh ke apex — bug yang
  tidak kelihatan lewat unit test `NextRequest`-langsung, hanya lewat
  `curl -H "Host: ..."` terhadap server dev sungguhan.
- **`staging.kammi.id` bukan subdomain Struktur.** Ia host deployment staging
  sendiri, bentuknya kebetulan sama seperti `<slug>.kammi.id` (tiga label).
  Dikecualikan eksplisit sebagai apex kedua di `src/lib/struktur/tenant-host.ts`
  — keputusan yang dikonfirmasi ke pengguna, bukan diasumsikan.
- **`createOrganization` menyalakan Situs Aktif untuk PP baru, bukan cuma
  migrasi.** Checklist cuma minta migrasi menyalakannya untuk PP yang sudah
  ada, tapi `db:seed` di lingkungan dev segar juga membuat PP baru lewat
  `createOrganization` — tanpa penyalaan di sana, apex lokal mati sampai
  seseorang menyalakannya manual, dan sakelar tiket 03 menolak menyala
  sebelum ada Berita Terbit (kebuntuan). Diselesaikan di titik yang sama
  dengan `if (newOrg.type === 'pp') roles.push('root')`.
