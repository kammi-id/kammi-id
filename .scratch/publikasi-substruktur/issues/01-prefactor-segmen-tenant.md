# 01 — Prefactor: situs publik pindah ke bawah segmen tenant

**What to build:** Situs publik berpindah ke bawah satu segmen tenant, dan seluruh pembaca Pengaturan Situs berhenti memanggil PP di dalam dirinya sendiri — identitas Struktur dioper sebagai argumen, mengikuti bentuk yang sudah dipakai pembaca di dasbor. Bagi pembaca situs tidak ada yang berubah: `kammi.id` melayani beranda, tentang, pengurus, berita, dan event persis seperti sebelumnya. Nol perubahan yang kelihatan adalah ukuran keberhasilan tiket ini.

**Blocked by:** None — can start immediately.

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Setiap halaman publik yang hari ini dilayani `kammi.id` tetap dilayani dengan isi yang sama setelah pemindahan, termasuk metadata dan JSON-LD-nya.
- [x] Tidak ada lagi pembaca data di jalur render situs publik yang menentukan Struktur dari dalam dirinya sendiri; identitas Struktur selalu datang dari pemanggil.
- [x] Root layout tetap satu dan tetap dipakai bersama situs publik dan dasbor; font serta `globals.css` tidak diduplikasi (ADR 0012).
- [x] Penandaan cache Pengaturan Situs menyebut Struktur, sebagaimana yang sudah berlaku di pembaca dasbor.
- [x] Penjagaan terhadap basis data yang tidak tersedia saat build tetap ada dan tetap teruji.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.

## Comments

Dua hal tak terduga, keduanya relevan untuk tiket 02 yang menyentuh `proxy.ts` lagi:

- **`resolveStrukturId` wajib `'use cache'` (Next), bukan `cache()` (React).** Draf pertama memakai `cache()` dari `react`, meniru pola `readActiveSession`. Cache Components langsung menolak: "Route .../[strukturSlug]: Next.js encountered uncached data during prerendering" — panggilan DB apa pun yang dijangkau dari badan page/layout wajib berada di balik `'use cache'` atau `<Suspense>`, dan `cache()` React tidak menghitung. `readActiveSession` lolos karena rute dasbornya sudah dinamis lewat sesi, bukan karena `cache()` cukup di sini.
- **Matcher proxy yang diperluas nyaris mematikan OG image beranda.** `src/app/opengraph-image.tsx` (berkas akar, di luar `(main)`) adalah satu-satunya konvensi Next tanpa titik pada URL-nya — favicon, manifest, apple-icon semua punya ekstensi dan otomatis lolos dari matcher `.*\..*`. Tanpa pengecualian eksplisit `/opengraph-image` di `proxy.ts`, permintaan itu ikut ter-rewrite ke `/${slug}/opengraph-image`, rute yang tidak pernah ada.
- Bacaan basis data baru di `proxy.ts` (`readOrganization({ type: ['pp'], limit: 1 })`) sengaja dibungkus try/catch meski checklist hanya menyebut "saat build" — tanpa itu, DB yang sempat terputus saat request nyata akan menjatuhkan seluruh situs publik dengan 500, bukan sekadar tidak ditemukan.
