# 04 — Form artikel dua kolom dan Galeri

**What to build:** Form tambah/sunting artikel menjadi dua kolom 2:1 yang
memperlakukan judul dan badan tulisan sebagai pekerjaan utama, dan sebuah
Artikel bisa membawa **Galeri** di samping **Gambar Utama** tunggalnya.

**Blocked by:** 01, 02, 03 — dikerjakan terakhir karena menyentuh skema
basis data.

**Status:** ready-for-agent

## Skema dan migrasi

- [ ] Kolom baru `gallery_images text[] not null default '{}'` pada tabel
      `article`. `featured_image` **tidak** disentuh dan **tidak** menjadi
      array — lihat ADR 0017.
- [ ] Migrasi di-*generate* dan di-commit sebagai berkas. Migrasi **tidak**
      dijalankan ke basis data mana pun selain lokal (ADR 0008: production
      tetap manual, dan `db-guard` memang dibangun untuk menghentikan ini).
- [ ] Sebuah wizard `.scratch/berita-polish/wizard-*.sh` menuntun manusia
      menjalankan migrasi ini di production, mengikuti pola
      `.scratch/production-deployment/`.
- [ ] ADR 0017 mencatat kenapa `featured_image` sengaja tidak dijadikan
      `text[]`.

## Tata letak

- [ ] Dua kolom 2:1 untuk **kedua** tipe artikel; kolom kanan adalah sidebar
      form, bukan navigasi. Menyusun ulang menjadi satu kolom di layar sempit.
- [ ] Kolom kiri: judul di paling atas sebagai input besar tanpa border dan
      tanpa label kelihatan — placeholder saja, dengan `aria-label` yang tetap
      ada. Fontnya mengikuti tampilan judul di artikel terbit.
- [ ] Badan tulisan mengisi sisa ruang kolom kiri.

## Sidebar, berurutan

- [ ] **Tipe** sebagai choice card: dua kartu radio, masing-masing judul plus
      satu baris penjelas konsekuensinya (masuk arsip dan bertanggal, versus
      berdiri sendiri di alamat akar).
- [ ] **Tanggal Terbit** dan **Penulis** — tetap hanya untuk Berita.
- [ ] **Permalink** autogenerate dari judul **hanya selama artikel belum
      pernah Terbit**. Begitu Terbit, slug beku dan hanya berubah lewat aksi
      manual yang disengaja (ADR 0014: alamat yang sudah tersebar tidak
      bergeser karena Humas membetulkan typo judul).
- [ ] **Kategori** sebagai combobox yang bisa mencari kategori yang ada dan
      membuat yang baru langsung dari input. Hierarki ditampilkan berindentasi
      supaya Humas tidak salah pilih; kategori yang baru dibuat selalu menjadi
      akar, dan pengelolaan hierarki tetap milik halaman manajer kategori.
- [ ] **Tag** memakai combobox yang sudah ada, tidak ditulis ulang.
- [ ] **Status**.
- [ ] **Gambar**: satu kotak unggah multi. Thumbnail bisa diurutkan dengan
      drag memakai `@dnd-kit` yang sudah terpasang — ikuti pola
      `home-items-list` dan `leadership-form`, jangan bikin pola ketiga.
      Reorder wajib bisa lewat keyboard.
- [ ] Tepat satu gambar bertanda bintang sebagai **Gambar Utama**; sisanya
      **Galeri**. Gambar Utama tidak pernah disimpulkan dari urutan.
      `ImageUpload` yang ada **tidak** diubah — 13 berkas bergantung pada
      kontrak satu-nilainya.

## LABEL bukan VALUE

- [ ] `Select` berhenti menampilkan VALUE dan menampilkan LABEL. Diperbaiki
      di akar (`src/components/shadcn/ui/select.tsx`), sehingga 20 instance di
      13 berkas ikut sembuh — bukan ditambal di form artikel saja.
- [ ] Combobox Kategori dan Tag juga menampilkan LABEL.

## Halaman publik

- [ ] Galeri tampil sebagai grid thumbnail responsif di bawah badan tulisan,
      berjudul kecil "Galeri". Klik membuka gambar penuh di dialog.
- [ ] Artikel tanpa Galeri tidak menampilkan apa pun — tidak ada judul
      "Galeri" yang menggantung di atas ruang kosong.
- [ ] Gambar Utama tetap yang dipakai kartu arsip, kartu Berita KAMMI
      se-Indonesia, dan gambar OpenGraph.

## Verifikasi

- [ ] Tes untuk logika baru: autogenerate slug dan kapan ia membeku, utils
      Galeri, dan pemilihan Gambar Utama. Bukan untuk kelas Tailwind.
- [ ] `check:types`, `check:lint`, dan `check:structure` hijau.
