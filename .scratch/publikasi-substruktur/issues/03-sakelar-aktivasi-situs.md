# 03 — Humas menyalakan Situs Strukturnya sendiri

**What to build:** Humas membuka Pengaturan Situs, menyalakan Situs Strukturnya, dan alamatnya langsung hidup tanpa restu Struktur di atasnya (ADR 0002). Selama Struktur itu belum memiliki satu pun Berita Terbit, sakelarnya menolak menyala dan menjelaskan alasannya, sehingga tidak lahir Situs resmi yang isinya hanya nama dan logo.

**Blocked by:** 02

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Humas dapat menyalakan dan mematikan Situs Strukturnya sendiri dari halaman Pengaturan Situs, dan hasilnya langsung terlihat di alamat publiknya.
- [x] Humas tidak dapat menyentuh penanda Situs Struktur lain; Root dapat, sesuai kewenangannya.
- [x] Sakelar menolak menyala selama Struktur belum punya Berita Terbit, dengan pesan yang menyebut syaratnya.
- [x] Mematikan Situs mengembalikan alamatnya ke tidak ditemukan.
- [x] Sakelar tampil menonjol, tidak terkubur di antara pengaturan tampilan.

## Comments

Dikerjakan paralel dengan tiket 04 dan 05 di worktree terpisah, digabung lewat merge manual. `requireSiteSettingsAccess()` (tanpa parameter target-org, terikat `session.user.connectedOrganization`) sudah cukup untuk kedua baris kewenangan tanpa kode baru — Humas terkunci ke Strukturnya sendiri karena `connectedOrganization` Humas memang selalu Strukturnya sendiri (Cakupan Humas tidak turun, ADR 0002); Root tidak dibatasi tambahan apa pun di atas gerbang itu.

**Bug yang ditemukan code-review setelah penggabungan** (sudah diperbaiki, lihat commit `ae7db9e`): gerbang `hasPublishedArticle` sempat membandingkan `published_at` mentah langsung terhadap `new Date()` tanpa koreksi offset WIB yang didokumentasikan `tanggal-terbit.ts` (tiket 05) — persis kelas bug yang diperingatkan ADR 0014. Sebuah Berita yang baru Terbit di pagi WIB bisa tidak terlihat gerbang ini hingga 7 jam. Diperbaiki lewat `terbitCutoffForQuery()`, pembantu baru di `tanggal-terbit.ts`.
