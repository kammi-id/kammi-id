# 02 — Template impor XLSX rusak karena urutan elemen OOXML

**What to build:** betulkan dua titik sisipan XML di `generateTemplate`, dan
pecah fungsinya supaya bisa dites.

**Blocked by:** None — can start immediately.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

## Sebabnya

`generateTemplate` (`kader/_components/bulk-upload/bulk-upload-utils.ts:404`)
menulis workbook lewat SheetJS, lalu menambal XML mentahnya. Kedua tambalan
melanggar urutan elemen yang dituntut skema OOXML, dan Excel menolak berkas
yang urutannya salah — biasanya dengan tawaran "perbaiki".

1. `dataValidations` ditempel tepat sebelum `</worksheet>`. Di
   `CT_Worksheet` ia harus berdiri **sebelum** `pageMargins`, `pageSetup`, dan
   `hyperlinks` — yang justru sudah ditulis SheetJS di ekor berkas.
2. `<bookViews>` disisip **sebelum** `<workbookPr>`. Di `CT_Workbook`
   urutannya `fileVersion` → `fileSharing` → `workbookPr` →
   `workbookProtection` → `bookViews` → `sheets`.

Dropdown-nya sendiri tidak salah dan tetap dipertahankan — ia yang mencegah
kolom enum diisi ngawur.

## Yang dikerjakan

Sisipkan `dataValidations` sebelum tag pembuka `<pageMargins` (jatuh kembali ke
`</worksheet>` hanya bila `pageMargins` tidak ada), dan `bookViews` sesudah
`</workbookPr>` atau tag `<workbookPr/>` yang menutup sendiri. Kedua bentuk
mungkin muncul; tangani keduanya, jangan mengandaikan salah satu.

Kolom **No HP** dipaksa bertipe teks. Excel memakan `0` di depan dan
memperlakukan `+62…` sebagai rumus; tanpa ini, tiket 04 akan menerima nomor
yang sudah cacat sejak berkasnya diisi.

`generateTemplate` sekarang menyentuh `document` dan `URL.createObjectURL`
sehingga tidak bisa dites. Pecah dua: fungsi murni penghasil `Uint8Array` dan
pembungkus tipis yang mengunduhnya. Pemanggil di `bulk-upload-dialog.tsx`
memakai pembungkusnya, tesnya memakai yang murni.

**Tombol impornya sendiri tidak rusak** — hanya templatenya. Jangan sekalian
merombak alur unggah.

## Acceptance

- [ ] Berkas hasil `generateTemplate` terbuka di Excel tanpa tawaran perbaikan
- [ ] Terbuka juga di LibreOffice Calc dan Google Sheets
- [ ] Keempat dropdown (jenis kelamin, jenjang, pemandu, instruktur) hidup
- [ ] Sheet "Instruksi" yang tampil saat berkas dibuka
- [ ] Kolom No HP bertipe teks: `08123…` tidak kehilangan `0` di depan
- [ ] Fungsi penghasil buffer terpisah dari pengunduh
- [ ] Tes membongkar zip dan memastikan `dataValidations` mendahului
      `pageMargins`, serta `bookViews` menyusul `workbookPr`
- [ ] Berkas hasilnya masih terbaca oleh parser impor yang sudah ada

## Comments

Dikerjakan 2026-09-07. `generateTemplate` dipecah jadi `generateTemplateBuffer`
(murni, dites) dan pembungkus unduhan. `dataValidations` kini disisip sebelum
`pageMargins`/`pageSetup`/`hyperlinks`/`ignoredErrors` (bukan cuma
`pageMargins`), `bookViews` sesudah `workbookPr` (kedua bentuk tag). Kolom No
HP dipaksa teks lewat style kolom. Tes membongkar zip dan mengecek urutan
elemen plus round-trip lewat parser impor asli. Belum sempat dites buka
langsung di Excel/LibreOffice/Google Sheets sungguhan — hanya lewat
penalaran skema OOXML dan sumber writer SheetJS. Lihat commit `5558f82`.
