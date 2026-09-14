# Publikasi Artikel dan Situs Struktur

**Status:** ready-for-agent

Keputusan domain yang berlaku: `CONTEXT.md` mendefinisikan **Situs Struktur**,
**Situs Aktif**, **Berita**, **Halaman**, **Terbit**, **Diarsipkan**,
**Permalink**, **Penulis**, dan **Berita Jaringan**. ADR 0012 menetapkan
mekanisme tenancy, ADR 0013 menetapkan perilaku Situs Struktur Non-Aktif, dan
ADR 0014 menetapkan bentuk Permalink. ADR 0002 tetap berlaku: Cakupan Humas
tidak turun ke Struktur di bawahnya, sehingga tiap Struktur mengelola
publikasinya sendiri.

## Problem Statement

Artikel sudah bisa dikelola di dasbor sejak lama dan tidak punya satu pun
permukaan publik. Tidak ada perender body di sisi publik, `/berita` masih
halaman kosong bertuliskan "Belum ada konten", dan seluruh situs publik terikat
mati pada PP — setiap pembaca Pengaturan Situs memanggil PP di dalam dirinya
sendiri. Akibatnya Struktur di bawah PP tidak punya tempat untuk menerbitkan apa
pun, dan Humas yang setiap Struktur miliki sejak dibuat tidak punya hasil kerja
yang bisa dilihat siapa pun.

## Solution

Setiap Struktur memperoleh Situs Struktur di subdomain slug-nya, dan PP
menempati apex. Situs Struktur harus dinyalakan lebih dulu oleh Humas-nya;
sebelum itu alamatnya tidak melayani. Situs PP memakai template lengkap yang
sudah ada, Situs Struktur lain memakai template ramping: identitas, pengurus,
dan Berita.

Berita memperoleh Permalink `/berita/<tahun>/<bulan>/<slug>` di Situs Struktur
penerbitnya, dan Halaman memperoleh alamat akar `/<slug>`. Setiap Situs Struktur
mendapat daftar Berita kronologis di `/berita`, dipaginasi 48. Beranda menampung
12 Berita terbaru milik Struktur itu. Khusus Situs PP, satu bagian tambahan
menampung 12 Berita terbaru dari seluruh Struktur, menuju halaman **Berita
Jaringan** tersendiri.

## User Stories

1. Sebagai pembaca, saya ingin membuka `<slug>.kammi.id` dan mendapat situs
   Struktur tersebut, sehingga tiap Struktur punya wajah publiknya sendiri.
2. Sebagai pembaca, saya ingin `kammi.id` tetap menjadi situs PP seperti
   sebelumnya, sehingga tidak ada yang hilang bagi pengunjung lama.
3. Sebagai pembaca, saya ingin membuka Permalink sebuah Berita dan membacanya
   utuh beserta gambar, penulis, tanggal, dan Struktur penerbitnya.
4. Sebagai pembaca, saya ingin `/berita` menampilkan seluruh Berita Struktur itu
   secara kronologis dan berhalaman, sehingga arsipnya dapat ditelusuri.
5. Sebagai pembaca di situs PP, saya ingin melihat Berita terbaru dari seluruh
   Struktur di satu tempat, sehingga kegiatan daerah ikut terlihat secara
   nasional.
6. Sebagai pembaca yang datang dari Berita Jaringan, saya ingin diantar ke
   Berita di situs Struktur penerbitnya, bukan ke salinannya di situs PP.
7. Sebagai pembaca, saya ingin alamat Berita dengan tahun atau bulan yang keliru
   tetap mengantar saya ke Berita yang benar, sehingga tautan lama tidak mati.
8. Sebagai pembaca, saya ingin membuka Permalink Berita milik Struktur yang
   kepengurusannya berhenti dan tetap dapat membacanya, sehingga arsip tidak
   ikut hilang.
9. Sebagai pembaca, saya ingin situs Struktur yang kepengurusannya berhenti
   tidak dapat ditelusuri, sehingga saya tidak mengira ia masih berjalan.
10. Sebagai pembaca, saya ingin Berita yang saya bagikan ke aplikasi pesan
    menampilkan gambar dan judul Berita itu, bukan gambar generik.
11. Sebagai Humas, saya ingin menyalakan Situs Struktur saya dari halaman
    Pengaturan Situs, sehingga situs saya terbit atas keputusan saya sendiri.
12. Sebagai Humas, saya ingin hanya melihat pengaturan yang benar-benar dirender
    oleh template situs saya, sehingga saya tidak mengisi kolom yang hasilnya
    tidak muncul di mana pun.
13. Sebagai Humas, saya ingin menulis Berita dengan tajuk, penekanan, daftar,
    kutipan, tautan, dan gambar di dalam badan tulisan.
14. Sebagai Humas, saya ingin menjadwalkan Berita dengan tanggal di masa depan
    dan ia baru terbaca publik setelah tanggal itu lewat.
15. Sebagai Humas, saya ingin mencantumkan nama penulis Berita walaupun orang itu
    tidak memiliki Akun.
16. Sebagai Humas, saya ingin ditolak dengan pesan yang jelas ketika permalink
    Halaman yang saya pakai adalah alamat milik sistem, sehingga halaman saya
    tidak diam-diam tidak pernah tampil.
17. Sebagai Humas, saya ingin membetulkan permalink Berita yang sudah terbit
    tanpa mematikan tautan yang telanjur tersebar.
18. Sebagai Humas, saya ingin Berita yang saya arsipkan hilang dari semua daftar
    namun tautannya tetap hidup.
19. Sebagai pengelola, saya ingin Berita milik Struktur Terhapus tidak muncul di
    permukaan publik mana pun.
20. Sebagai pengelola, saya ingin mesin pencari hanya menemukan situs Struktur
    yang aktif, sehingga situs yang belum dinyalakan tidak terindeks.

## Implementation Decisions

### Tenancy

- Proxy (`proxy.ts`, bukan `middleware.ts` yang sudah usang di Next.js 16)
  membaca `Host`, mengenali slug Struktur, dan me-rewrite **seluruh path** ke
  bawah segmen tenant. Apex dipetakan ke slug PP.
- Segmen tenant adalah segmen dinamis biasa, bukan root parameter. Identitas
  Struktur dioper sebagai argumen ke pembaca data, mengikuti bentuk yang sudah
  dipakai `dashboard/pages/home/_data/settings.ts`. Alasan lengkapnya di ADR
  0012.
- `(main)/_data/site-settings.ts` berhenti memanggil PP di dalam dirinya
  sendiri; setiap getter menerima identitas Struktur. Penjagaan terhadap basis
  data yang tidak tersedia saat build dipertahankan.
- Proxy menolak request dari luar yang path-nya sudah berbentuk path internal
  hasil rewrite. Matcher mengecualikan `_next`, berkas berekstensi, `/api/`, dan
  secara eksplisit `/api/images/`.
- Slug Struktur yang tidak dikenal, Terhapus, atau Situsnya belum aktif
  menghasilkan tidak ditemukan.

### Aktivasi Situs

- Penanda Situs Aktif adalah kolom pada tabel `organization`, bukan nilai di
  dalam Pengaturan Situs, karena ia menjadi klausa penyaring pada query daftar
  dan tidak boleh disaring setelah baris ditarik.
- Migrasi menyalakan penanda itu untuk PP. Tanpa langkah ini apex mati begitu
  deploy.
- Sakelarnya berada di `/dashboard/pages/home`, yang sudah terikat pada Struktur
  Akun yang membukanya dan sudah terbatas pada Root dan Humas.
- Sakelar menolak menyala selama Struktur itu belum memiliki satu pun Berita
  Terbit, dengan pesan yang menjelaskan alasannya.
- Halaman Pengaturan Situs menyembunyikan bagian yang tidak dirender oleh
  template Struktur tersebut, ditentukan oleh Jenjang.

### Template Situs

- PP memakai template lengkap yang berlaku sekarang. Struktur lain memakai
  template ramping: identitas Struktur, pengurus, dan Berita.
- Data pengurus pada template ramping berasal dari Pengaturan Situs seperti pada
  PP, dengan bentuk yang lebih sederhana. Tidak ada konsep Jabatan baru pada
  Member.
- Bagian Berita terbaru berisi 12 Berita milik Struktur itu, ditempatkan di
  bawah bagian Jaringan pada template lengkap, dan menautkan ke `/berita`.
  Bagian ini disembunyikan bila tidak ada Berita Terbit.
- Situs PP memperoleh satu bagian tambahan berisi 12 Berita terbaru dari seluruh
  Struktur, menautkan ke `/berita/jaringan`. Setiap kartu menautkan ke Permalink
  di situs Struktur penerbitnya.

### Artikel di permukaan publik

- Terbit berarti Artikel dinyatakan terbit **dan** tanggal terbitnya sudah
  lewat. Tanggal di masa depan berarti terjadwal, bukan terbaca.
- Artikel Diarsipkan hilang dari seluruh daftar, Permalink-nya tetap melayani
  dan ditandai agar tidak diindeks.
- Berita wajib memiliki gambar utama; penegakannya di skema validasi, sejajar
  dengan kewajiban tanggal yang sudah ada. Halaman tidak wajib.
- Nama penulis adalah teks bebas, bukan rujukan ke Member atau Akun.
- Body dirender dari dokumen tersimpan pada saat request, bukan dibekukan
  menjadi HTML saat terbit. Perender memakai daftar-izin node dan mark; keluaran
  tidak pernah disuapkan mentah ke DOM.
- Editor memperoleh gambar di dalam badan tulisan lewat jalur unggah yang sudah
  ada, beserta toolbar minimal: tajuk, tebal, miring, daftar, tautan, gambar,
  kutipan.
- Kategori tampil sebagai label pada kartu dan halaman Berita, **tanpa** tautan
  dan tanpa halaman arsip. Tag belum tampil.
- Halaman beralamat `/<slug>` pada Situs Struktur mana pun. Daftar slug milik
  sistem hidup sebagai satu konstanta, dipakai skema validasi, dan diuji;
  permalink yang bertabrakan ditolak saat simpan.

### Permalink dan riwayat alamat

- Permalink Berita berbentuk `/berita/<tahun>/<bulan>/<slug>`, diselesaikan
  hanya dengan slug. Bentuk yang tidak kanonik dijawab pengalihan permanen. ADR
  0014.
- Penurunan tahun dan bulan memakai Asia/Jakarta lewat satu pembantu terpusat,
  dipakai jalur tulis maupun jalur baca.
- Alamat Berita yang pernah sah disimpan sebagai riwayat dan hanya dibaca pada
  jalur tidak ditemukan. Slug Struktur tidak memiliki riwayat; perubahannya
  dicegah dengan peringatan pada form ketika Situsnya sudah aktif.

### Pembacaan data

- Daftar Berita Jaringan dan daftar per Struktur dilayani satu fungsi query
  dengan `JOIN` ke `organization`; identitas Struktur tidak pernah diambil per
  baris.
- Total halaman dihitung dalam query yang sama, bukan lewat query hitung
  terpisah.
- Urutan memakai tanggal terbit menurun dengan pemecah seri yang stabil, agar
  paginasi tidak menggeser baris antar halaman.
- Berita Jaringan menyaring Struktur Terhapus dan Situs yang belum aktif, dan
  **tidak** menyaring Keadaan Non-Aktif. Daftar milik Situs Struktur menyaring
  Keadaan Non-Aktif. Perbedaan ini disengaja — ADR 0013.
- Karena PP adalah akar pohon, Berita Jaringan tidak memerlukan penelusuran
  rekursif; penyaringan Keadaan sudah cukup.
- Dua indeks parsial ditambahkan: satu untuk urutan kronologis lintas Struktur,
  satu untuk urutan kronologis dalam satu Struktur.

### Cache

- Tag cache per Struktur (`article-<idStruktur>`), per Berita
  (`article-detail-<idBerita>`), dan satu tag untuk Berita Jaringan. Tag global
  `articles` yang berlaku sekarang tidak lagi memadai.
- Perubahan Keadaan Struktur, slug Struktur, dan penanda Situs Aktif ikut
  membatalkan tag Berita Jaringan, bukan hanya tag dasbor.

### SEO

- `sitemap.ts` dan `robots.ts` menjadi per Struktur, mengikuti host. Keduanya
  berhenti menjadi statik.
- Situs yang belum aktif atau Non-Aktif: robots menolak seluruhnya, sitemap
  kosong.
- Metadata Open Graph Berita memakai gambar utama Berita itu, dengan URL absolut
  pada host Struktur yang benar. Jalur gambar wajib dapat diakses tanpa
  autentikasi, dan itu diuji.
- Setiap Situs Struktur memperoleh umpan RSS di `/berita/feed.xml`, memakai
  query daftar yang sama.

## Out of Scope

- Halaman arsip kategori dan tag. Kategori hanya tampil sebagai label.
- Pencarian Berita.
- Konsep Jabatan pada Member; data pengurus tetap dari Pengaturan Situs.
- Domain kustom milik Struktur di luar `kammi.id`.
- Berita Jaringan bagi Struktur selain PP.
