# 06 — Tambah Struktur Anak dari detail

**What to build:** Detail Struktur mengembalikan afordansi membuat Struktur Anak yang hilang saat grid bertingkat diganti halaman detail. Tombolnya hidup di sidebar Struktur Anak dan digerakkan matriks kestrukturan, bukan `role`.

**Blocked by:** 03 — Sidebar Struktur Anak.

**Status:** done

## Konteks

Sebelum `a25a3f2`, `/dashboard/branches/<slug>` merender grid yang sama dengan halaman top-level, lengkap dengan tombol `Tambah {Jenjang}` di `BranchesHeader`. Halaman detail menggantikan jalur itu dan tidak membawa serta tombolnya, jadi satu-satunya tempat membuat Struktur Anak tersisa di grid top-level — dan hanya untuk Struktur terhubung Akun itu sendiri.

Isu ini **membalik satu keputusan** yang ditulis di `spec.md`: "tanpa Struktur Anak sama sekali, sidebar tidak dirender". Struktur tanpa anak justru keadaan yang paling membutuhkan tombol Tambah, jadi syaratnya digeser.

- [x] Tombol Tambah berada sebaris di kanan kolom pencarian sidebar Struktur Anak.
- [x] Sidebar dirender bila Struktur punya anak **atau** aktor memegang kemampuan membuat anak; syarat lama hanya yang pertama.
- [x] Tanpa Struktur Anak, kolom pencarian dirender dalam keadaan mati dan kalimatnya "Belum ada Struktur Anak." — dibedakan dari "Tidak ada Struktur Anak yang cocok." untuk pencarian nihil.
- [x] Kemampuan dihitung server-side sebagai `buatAnak` pada pembaca detail terotorisasi, dari `childTypesOf` + sel `buat` matriks; tidak pernah diturunkan dari `role` di komponen.
- [x] Label tombol diturunkan dari bentuk pohon, bukan ditulis per cabang. Label lama untuk PW ("PD/PK") diperbaiki menjadi "PD".
- [x] Pembuatan memakai ulang `BranchManagementSheet` dalam mode tambah; dialog kredensial awal ikut terbawa.
- [x] Struktur Anak baru muncul tanpa memuat ulang halaman secara manual.

## Comments

**25 Agustus 2026 — tombol Tambah kembali, plus tiga salinan bentuk pohon disatukan.**

Pengerjaannya membuka bahwa "Jenjang apa boleh jadi anak Jenjang apa" tersimpan
di tiga tempat: `CHILD_TYPES` di `~/lib/auth/kestrukturan`, peta `childTypes` di
`add-form`, dan rantai `if` label di `page.tsx`. Ketiganya sudah menyimpang —
label PW menyebut PK yang tidak pernah bisa lahir di sana.

Tabelnya dipindahkan ke `~/lib/struktur/jenjang.ts` yang bebas basis data, dan
`kestrukturan.ts` yang mengimpor dari sana. Pemindahan itu wajib, bukan rapi-rapi:
dua konsumen barunya `'use client'`, sedangkan `kestrukturan.ts` menarik
`~/db/query/organization`, jadi mengimpor tabel lewat modul gate akan menyeret
`db.ts` ke bundel browser — bahaya yang sudah pernah ditutup `6073b89`.

Judul grid top-level untuk PW ikut dibetulkan ("Daftar Pengurus Daerah dan
Komisariat" → "Daftar Pengurus Daerah") karena salah dengan sebab yang sama:
grid hanya memuat anak langsung. PDLN, yang sebelumnya jatuh ke default "Daftar
Wilayah", ikut mendapat judul yang benar.

`revalidatePath('/dashboard/branches')` di `add-form/action.ts` dilebarkan
menjadi `'layout'`. Tanpa tipe itu ia page-scoped dan tidak pernah menyentuh
route Struktur bersarang.

**Verifikasi browser — `router.refresh()` tidak diperlukan.** Sempat dipasang
sebagai jaring pengaman di penutupan sheet. Diuji dengan mencopotnya lebih dulu,
lalu membuat satu PK sungguhan lewat UI: Struktur Anak baru muncul di sidebar
**sebelum sheet ditutup**, jadi revalidasi aksi sendiri yang mendorong payload
RSC baru. Refresh manualnya dibuang, dan alasannya ditulis di komponen supaya
tidak dipasang ulang oleh pembaca berikutnya. Struktur uji dihapus setelahnya
dan kini berada di Struktur Terhapus.

Sekalian terverifikasi di runtime: dialog kredensial awal ikut terbawa oleh
pemakaian ulang sheet, `Select` hanya menawarkan "Pengurus Komisariat (PK)" di
bawah PD, dan detail PK tidak merender sidebar sama sekali.
