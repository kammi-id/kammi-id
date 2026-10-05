# 04 — Form artikel dua kolom dan Galeri

**What to build:** Form tambah/sunting artikel menjadi dua kolom 2:1 yang
memperlakukan judul dan badan tulisan sebagai pekerjaan utama, dan sebuah
Artikel bisa membawa **Galeri** di samping **Gambar Utama** tunggalnya.

**Blocked by:** 01, 02, 03 — dikerjakan terakhir karena menyentuh skema
basis data.

**Status:** done — seluruh checklist terpenuhi; `check:types`, `check:lint`,
`check:structure` hijau, dan `bun test` (729 pass; 69 fail + 1 error
pra-ada tanpa hubungan, lihat memory `full-suite-db-undefined-pre-existing`)
hijau untuk semua berkas yang disentuh tiket ini. Migrasi lokal sudah
dijalankan manual (drizzle-kit migrate gagal diam-diam di DB lokal — bug
pra-ada, lihat memory `local-db-migration-ledger-drift`); production
sengaja belum disentuh, menunggu wizard.

Catatan verifikasi: interaksi browser penuh (drag-reorder, alur buat-kategori
inline, unggah gambar sungguhan) **tidak** dijalankan langsung — DB lokal
tidak punya kredensial dasbor siap pakai untuk sesi ini. Diverifikasi lewat
`check:types`/`check:lint`/`check:structure`, unit test logika baru, tes
DB-backed yang sudah ada, dan dua putaran `code-review` (Standards + Spec)
yang keduanya menemukan masalah nyata dan sudah diperbaiki (lihat di bawah).

- [x] Kolom baru `gallery_images text[] not null default '{}'` pada tabel
      `article`. `featured_image` **tidak** disentuh dan **tidak** menjadi
      array — lihat ADR 0017.
- [x] Migrasi di-*generate* dan di-commit sebagai berkas. Migrasi **tidak**
      dijalankan ke basis data mana pun selain lokal (ADR 0008: production
      tetap manual, dan `db-guard` memang dibangun untuk menghentikan ini).
- [x] Sebuah wizard `.scratch/berita-polish/wizard-*.sh` menuntun manusia
      menjalankan migrasi ini di production, mengikuti pola
      `.scratch/production-deployment/`.
- [x] ADR 0017 mencatat kenapa `featured_image` sengaja tidak dijadikan
      `text[]`.

## Tata letak

- [x] Dua kolom 2:1 untuk **kedua** tipe artikel; kolom kanan adalah sidebar
      form, bukan navigasi. Menyusun ulang menjadi satu kolom di layar sempit.
- [x] Kolom kiri: judul di paling atas sebagai input besar tanpa border dan
      tanpa label kelihatan — placeholder saja, dengan `aria-label` yang tetap
      ada. Fontnya mengikuti tampilan judul di artikel terbit.
- [x] Badan tulisan mengisi sisa ruang kolom kiri.

## Sidebar, berurutan

- [x] **Tipe** sebagai choice card: dua kartu radio, masing-masing judul plus
      satu baris penjelas konsekuensinya (masuk arsip dan bertanggal, versus
      berdiri sendiri di alamat akar).
- [x] **Tanggal Terbit** dan **Penulis** — tetap hanya untuk Berita.
- [x] **Permalink** autogenerate dari judul **hanya selama artikel belum
      pernah Terbit**. Begitu Terbit, slug beku dan hanya berubah lewat aksi
      manual yang disengaja (ADR 0014: alamat yang sudah tersebar tidak
      bergeser karena Humas membetulkan typo judul).
- [x] **Kategori** sebagai combobox yang bisa mencari kategori yang ada dan
      membuat yang baru langsung dari input. Hierarki ditampilkan berindentasi
      supaya Humas tidak salah pilih; kategori yang baru dibuat selalu menjadi
      akar, dan pengelolaan hierarki tetap milik halaman manajer kategori.
- [x] **Tag** memakai combobox yang sudah ada, tidak ditulis ulang.
- [x] **Status**.
- [x] **Gambar**: satu kotak unggah multi. Thumbnail bisa diurutkan dengan
      drag memakai `@dnd-kit` yang sudah terpasang — ikuti pola
      `home-items-list` dan `leadership-form`, jangan bikin pola ketiga.
      Reorder wajib bisa lewat keyboard. (`KeyboardSensor` sempat kelewat di
      draf pertama — code-review Spec menangkapnya, sudah ditambahkan.)
- [x] Tepat satu gambar bertanda bintang sebagai **Gambar Utama**; sisanya
      **Galeri**. Gambar Utama tidak pernah disimpulkan dari urutan.
      `ImageUpload` yang ada **tidak** diubah — 13 berkas bergantung pada
      kontrak satu-nilainya. (Draf pertama sempat auto-promote gambar pertama
      jadi Utama begitu Galeri terisi — bertentangan dengan ADR 0017 sendiri;
      code-review Spec menangkapnya, sudah diperbaiki jadi murni presence
      check + tombol bintang sekarang toggle, bisa di-un-star.)

## LABEL bukan VALUE

- [x] `Select` berhenti menampilkan VALUE dan menampilkan LABEL. Diperbaiki
      di akar (`src/components/shadcn/ui/select.tsx`), sehingga 20 instance di
      13 berkas ikut sembuh — bukan ditambal di form artikel saja.
- [x] Combobox Kategori dan Tag juga menampilkan LABEL.

## Halaman publik

- [x] Galeri tampil sebagai grid thumbnail responsif di bawah badan tulisan,
      berjudul kecil "Galeri". Klik membuka gambar penuh di dialog.
- [x] Artikel tanpa Galeri tidak menampilkan apa pun — tidak ada judul
      "Galeri" yang menggantung di atas ruang kosong.
- [x] Gambar Utama tetap yang dipakai kartu arsip, kartu Berita KAMMI
      se-Indonesia, dan gambar OpenGraph — tidak disentuh sama sekali.

## Verifikasi

- [x] Tes untuk logika baru: autogenerate slug dan kapan ia membeku, utils
      Galeri, dan pemilihan Gambar Utama. Bukan untuk kelas Tailwind.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.
