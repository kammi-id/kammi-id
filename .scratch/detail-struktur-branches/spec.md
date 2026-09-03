# Detail Struktur di Dashboard Branches

**Status:** ready-for-agent

Keputusan domain yang berlaku: `CONTEXT.md` mendefinisikan **Struktur Anak**, dan ADR 0010 mengizinkan BPW membaca agregat Kader yang terbatas pada detail Struktur. Spesifikasi ini tidak mengubah kewenangan pengelolaan Kader maupun Keadaan Struktur yang sudah berlaku.

## Problem Statement

Pengurus yang menelusuri `/dashboard/branches` saat ini masuk ke sebuah Struktur hanya untuk melihat grid Struktur Anak berikutnya. Mereka tidak mendapat satu tempat untuk memahami identitas, Keadaan, komposisi Kader, atau hubungan Struktur yang sedang dibuka. Pada Jenjang dengan banyak Struktur Anak, alur grid bertingkat juga membuat perpindahan antar-Struktur kurang langsung.

## Solution

`/dashboard/branches` tanpa jalur Struktur tetap menjadi grid Struktur Anak dari Struktur terhubung Akun. Setiap Struktur yang dibuka melalui jalur bertingkat menampilkan halaman detailnya sendiri: remah roti yang sah, identitas Struktur, Keadaan, metrik Kader Aktif dalam Cakupannya, dan metrik Struktur Anak yang sesuai Jenjang. Bila Struktur memiliki Struktur Anak, sidebar kanan menjadi navigasi langsung yang dapat dicari dan dipaginasi; bila tidak, sidebar tidak ada. Pola tata letak mengikuti detail Kader.

## User Stories

1. Sebagai Root, saya ingin membuka detail Struktur mana pun dalam pohon nasional, sehingga saya dapat memahami keadaan dan ringkasannya tanpa berpindah melalui banyak grid.
2. Sebagai BPH, saya ingin melihat detail Struktur dalam Cakupan saya, sehingga saya dapat memantau kestrukturan tanpa memperoleh hak kelola tambahan.
3. Sebagai BPW, saya ingin melihat identitas dan ringkasan agregat Kader pada Struktur yang saya kelola, sehingga saya dapat menilai kesehatan Struktur tanpa membuka daftar Kader.
4. Sebagai BPW, saya ingin tetap tidak dapat membuka pengelolaan atau identitas individual Kader dari detail Struktur, sehingga batas kewenangan kekaderan tetap terjaga.
5. Sebagai pengurus, saya ingin `/dashboard/branches` tetap langsung menampilkan Struktur Anak dari Struktur terhubung saya, sehingga titik masuk lama tidak berubah menjadi profil Struktur sendiri.
6. Sebagai pengurus, saya ingin klik sebuah Struktur Aktif membuka detail Struktur tersebut, sehingga saya dapat melihat konteksnya sebelum menelusuri lebih jauh.
7. Sebagai pengurus, saya ingin Struktur Non-Aktif tetap dapat dibuka dan tampak redup dengan penanda Keadaannya, sehingga saya tidak mengira Struktur itu Aktif atau hilang.
8. Sebagai pengurus, saya ingin remah roti dan tombol kembali hanya mengikuti hubungan induk yang sebenarnya, sehingga saya selalu tahu letak Struktur pada pohon nasional.
9. Sebagai pengurus, saya ingin URL dengan jalur induk yang palsu atau tidak berurutan ditolak, sehingga URL tidak dapat menampilkan Struktur dalam konteks pohon yang keliru.
10. Sebagai pengurus, saya ingin nama, kode, Jenjang, Keadaan, logo bila tersedia, dan induk Struktur tampil di detail, sehingga identitas Struktur dapat diperiksa cepat.
11. Sebagai pengurus, saya ingin melihat total Kader Aktif serta rincian AB1, AB2, AB3, Ikhwan, Akhwat, Pemandu, dan Instruktur dalam Cakupan Struktur, sehingga saya memahami komposisi kekaderan tanpa membuka data per orang.
12. Sebagai pengurus pada PW, saya ingin melihat “Jumlah PD”, sehingga metrik Struktur Anak memakai istilah yang sesuai Jenjang.
13. Sebagai pengurus pada PD atau PDLN, saya ingin melihat “Jumlah Komisariat”, sehingga metrik Struktur Anak menyebut jenis Struktur Anak yang sebenarnya.
14. Sebagai pengurus pada PK, saya tidak ingin melihat metrik Struktur Anak, sehingga halaman tidak menampilkan angka yang tidak relevan.
15. Sebagai pengurus, saya ingin sidebar menampilkan Struktur Anak langsung dan bukan seluruh keturunan sekaligus, sehingga navigasi tetap ringkas dan mudah dipindai.
16. Sebagai pengurus pada Struktur dengan banyak Struktur Anak, saya ingin mencari dan berpindah halaman dalam sidebar, sehingga saya dapat menemukan Struktur tujuan tanpa kembali ke grid.
17. Sebagai pengurus pada Struktur tanpa Struktur Anak, saya ingin ruang detail tidak menyisakan sidebar kosong, sehingga fokus tetap pada informasi Struktur.
18. Sebagai pengguna layar kecil, saya ingin navigasi Struktur Anak tetap tersedia setelah konten utama, sehingga detail tetap mudah digunakan tanpa ruang sidebar sempit.
19. Sebagai pengurus yang berwenang mengelola Struktur sasaran, saya ingin aksi kestrukturan yang sudah ada tetap tersedia dari detail, sehingga alur kerja tidak kehilangan kemampuan yang telah ada.
20. Sebagai BPH, saya ingin penyuntingan Struktur saya sendiri tetap berada pada permukaan Organisasi, sehingga aturan kewenangan BPH tidak bergeser diam-diam ke halaman branches.
21. Sebagai pengurus, saya ingin Struktur Terhapus tetap tidak dapat ditemukan melalui URL atau navigasi normal, sehingga semantik Terhapus dan perlindungan keberadaannya tetap utuh.

## Implementation Decisions

- Tidak ada perubahan skema. Detail memakai data Struktur yang sudah tersedia: nama, kode, slug, Jenjang, logo, induk, Keadaan, dan jumlah Struktur Anak yang belum Terhapus.
- Jalur URL tetap bertingkat. Resolusi detail wajib memverifikasi bahwa setiap segmen adalah Struktur Anak dari segmen sebelumnya; jalur yang tidak ada, Terhapus, di luar Cakupan, atau bukan rantai induk yang benar mendapat hasil yang sama seperti Struktur tidak ditemukan.
- Tanpa segmen URL, branches tetap merupakan grid Struktur Anak dari Struktur terhubung Akun. Dengan segmen, halaman menjadi detail Struktur tersebut, termasuk PK yang sebelumnya tidak memiliki permukaan penelusuran.
- Detail menggunakan pembaca terotorisasi tunggal sebagai seam utama. Ia menyatukan resolusi jalur, Cakupan, data identitas, Struktur Anak yang terlihat, dan data ringkasan yang diizinkan; komponen presentasi tidak menyusun ulang aturan ini.
- Detail mengizinkan Root, BPH, dan BPW yang lulus akses kestrukturan. Root dan BPH memperoleh metrik lewat hak baca yang ada. BPW hanya pada detail ini memperoleh agregat Kader, sesuai ADR 0010; akses tersebut tidak membuka daftar, filter, atau mutasi Kader.
- Metrik Kader menghitung **Kader Aktif dalam Cakupan**: tidak mencakup Alumni, Kader Non-Aktif, atau Kader Sanksi. Angka bersifat kumulatif dari Struktur yang dibuka sampai seluruh turunannya dan tidak dapat diklik untuk membuka daftar Kader.
- Pemandu dan Instruktur adalah dua agregat terpisah; keduanya boleh tumpang tindih dan tidak boleh dijumlahkan untuk membentuk total Kader.
- Metrik Struktur Anak menghitung semua Struktur Anak langsung yang terlihat, termasuk Non-Aktif dan tidak termasuk Terhapus. Labelnya bergantung pada Jenjang: PW memakai “Jumlah PD”, PD dan PDLN memakai “Jumlah Komisariat”, sedangkan PK tidak memiliki metrik ini.
- Header detail mengikuti pola halaman detail Kader: remah roti, identitas utama, badge Jenjang dan Keadaan, serta aksi yang tersedia. Logo ditampilkan bila ada dan memiliki fallback yang setara bila tidak ada.
- Struktur Non-Aktif tetap berupa tujuan navigasi dan memakai perlakuan visual redup serta badge Keadaan pada detail dan daftar sidebar. Struktur Anak di bawahnya juga tetap terbaca dan dapat dinavigasi.
- Sidebar hanya untuk Struktur Anak langsung, mendukung pencarian dan pagination dengan state URL yang tidak mengganggu resolusi jalur detail. Tanpa hasil pencarian, tampilkan empty state yang jelas; tanpa Struktur Anak sama sekali, sidebar tidak dirender.
- Aksi pengelolaan Struktur yang telah ada dipertahankan dan tetap digerakkan oleh matriks kestrukturan. Tidak ada aksi baru untuk menyunting Struktur sendiri oleh BPH; permukaan Organisasi tetap pemiliknya.
- Tata letak desktop dua kolom menempatkan konten detail sebagai fokus dan sidebar sebagai navigasi pendamping. Pada viewport sempit, sidebar ditumpuk setelah konten utama. Semantik, fokus keyboard, nama aksesibel, dan kontras Keadaan harus memenuhi WCAG AA.
- Cache ringkasan Kader dan Struktur mengikuti tag data yang sudah ada agar mutasi relevan menyegarkan detail tanpa cache khusus yang terpisah.

## Testing Decisions

- Test pada seam pembaca detail terotorisasi dan gate terkait, bukan pada detail implementasi komponen atau kelas CSS. Test yang baik membuktikan data atau keputusan akses yang diterima pemanggil: jalur, identitas, navigasi, metrik, atau penolakan.
- Gunakan matriks tes kewenangan kestrukturan sebagai prior art untuk Root, BPH, BPW dalam Cakupan, dan aktor/target di luar Cakupan. Tambahkan kasus eksplisit bahwa BPW menerima agregat hanya dari pembaca detail Struktur, sementara pembaca/pengelolaan Kader umum tetap menolaknya.
- Gunakan tes agregat Kader yang ada sebagai prior art untuk memastikan total Cakupan, AB1/AB2/AB3, Ikhwan/Akhwat, Pemandu, dan Instruktur benar, termasuk bahwa kategori Pemandu dan Instruktur tidak diasumsikan saling lepas.
- Uji jalur URL valid untuk setiap Jenjang, jalur dengan induk yang salah, slug tidak ada, Struktur Terhapus, dan target di luar Cakupan. Semua bentuk yang tidak sah tidak boleh membocorkan keberadaan Struktur.
- Uji metadata Struktur Anak: PW menghitung dan melabel PD, PD/PDLN menghitung dan melabel Komisariat, PK tidak menghasilkan metrik tersebut, serta Struktur Terhapus tidak ikut hitung.
- Uji bahwa Struktur Non-Aktif tetap menjadi data detail dan navigasi yang valid dengan Keadaan eksplisit, tanpa mengubah semantik Struktur Terhapus.
- Tambahkan pengujian komponen hanya untuk perilaku yang terlihat dan sulit dijamin di seam server: sidebar tidak hadir pada leaf, hasil pencarian kosong, pagination, tautan aksesibel, serta responsivitas/urutan konten bila harness yang ada mendukungnya.
- Setelah implementasi, verifikasi route di Next.js DevTools untuk kesalahan build/runtime dan lakukan pemeriksaan browser pada desktop serta mobile, termasuk navigasi keyboard dan fokus tautan sidebar.

## Out of Scope

- Menambah alamat, kontak, atau data lain yang tidak dimiliki Struktur.
- Membuat halaman detail untuk Struktur top-level `/dashboard/branches`.
- Menjadikan metrik Kader sebagai pintasan ke daftar Kader terfilter.
- Memberi BPW akses ke halaman, daftar, filter, identitas, atau mutasi Kader.
- Mengubah matriks aksi kestrukturan, hak BPH atas Struktur sendiri, atau permukaan Organisasi.
- Menampilkan atau menavigasi Struktur Terhapus pada branches normal.
- Menampilkan seluruh pohon keturunan dalam sidebar, atau membangun visualisasi pohon baru.
- Mendesain ulang grid top-level, schema database, atau data publik Struktur.

## Further Notes

- Implementasi harus mempertahankan terminologi domain: Struktur, Struktur Anak, Induk, Jenjang, Cakupan, Keadaan, dan Kader.
- Keputusan BPW adalah deviasi sadar dari pembaca Kader umum dan dicatat dalam ADR 0010 agar tidak meluas ke permukaan lain.
- Worktree sudah memiliki perubahan yang tidak terkait pada halaman dashboard; implementasi feature ini tidak boleh menimpa atau menyerap perubahan tersebut.
