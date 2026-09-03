# 04 — Template ramping untuk Struktur selain PP

**What to build:** Situs Struktur selain PP menampilkan identitas dan pengurusnya sendiri, bukan salinan beranda PP dengan slot-slot kosong. Humas PW, PD, PDLN, dan PK hanya melihat pengaturan yang template-nya benar-benar render — tidak ada lagi form yang tersimpan dengan sukses tetapi hasilnya tidak muncul di mana pun.

**Blocked by:** 02

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Situs Struktur selain PP menampilkan identitas Struktur — nama, Jenjang, logo bila ada — dan susunan pengurusnya.
- [x] Data pengurus berasal dari Pengaturan Situs seperti pada PP, dengan bentuk yang lebih sederhana; tidak ada konsep Jabatan baru pada Member.
- [x] Situs PP tetap memakai template lengkap yang berlaku sekarang, tanpa kehilangan satu bagian pun.
- [x] Halaman Pengaturan Situs menyembunyikan bagian yang tidak dirender template Struktur tersebut, ditentukan oleh Jenjang, dan daftar kondisinya hidup di satu tempat.
- [x] Situs Struktur yang pengaturannya masih kosong tetap tampil utuh dengan bawaan yang layak, bukan tampil rusak.

## Comments

Dikerjakan paralel dengan tiket 03 dan 05 di worktree terpisah, digabung lewat merge manual. Satu sumber kebenaran Jenjang→bagian hidup di `src/lib/struktur/situs-template.ts` (`resolveSitusTemplateVariant`, `isSitusSectionVisible`), dipakai baik oleh pemilih template publik maupun penyaring bagian di halaman Pengaturan Situs — persis yang diminta kriteria "daftar kondisinya hidup di satu tempat".

Ditemukan saat implementasi: halaman Pengaturan Situs sebelumnya hanya merender dua dari delapan form yang ada (`about-form`, `nav-form`, `footer-form`, `metadata-form` sudah ada sebagai komponen tapi yatim piatu, tak pernah dipanggil). Keempatnya kini disambungkan karena datanya benar-benar dirender publik; `hero-form`/`actions-form` sengaja TIDAK disambungkan kembali karena pengaturan yang dikendalikannya (`hero`, `actions`) tidak dirender di mana pun pada situs publik — menyambungkannya kembali akan menghidupkan lagi persis bug yang tiket ini perbaiki.

**Dead code yang ditemukan code-review setelah penggabungan** (sudah dibereskan, lihat commit `ae7db9e`): `isBeritaTerbit`, predikat Terbit kedua yang ditambahkan tiket ini, ternyata tidak pernah dipanggil di luar tesnya sendiri — dan sama seperti bug di tiket 03, tidak terkoreksi offset WIB. Dihapus; jalur yang butuh predikat Terbit memakai `isTerbit`/`terbitCutoffForQuery` terpusat dari `tanggal-terbit.ts` (tiket 05).
