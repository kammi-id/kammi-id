# KAMMI ID

Single source of truth untuk data organisasi KAMMI se-Indonesia: siapa
kadernya, struktur kepengurusannya, daurah yang mereka jalani, dan publikasi
yang mereka terbitkan.

## Language

### Orang & Akun

**Kader**:
Seorang anggota KAMMI sebagai manusia — orang yang direkrut, dibina, dan
menjalani jenjang kekaderan.
_Avoid_: Anggota, User, Member (lihat di bawah — Member itu record-nya, bukan
orangnya)

**Member**:
Record seorang Kader di dalam sistem. Satu Kader punya tepat satu Member.
Ketika yang dibicarakan adalah data (diimpor, diedit, dihapus), itu Member;
ketika yang dibicarakan adalah orangnya (dibina, lulus, kena sanksi), itu
Kader.
_Avoid_: Profil, Data anggota

**Akun**:
Kredensial login. Terikat pada satu Struktur, dan opsional pada satu Member.
Akun bukan Kader — seorang Kader bisa ada tanpa Akun, dan sebuah Akun
operasional bisa ada tanpa Member.
_Avoid_: User (sebagai istilah domain)

**Akun Kepengurusan**:
Akun yang terikat langsung pada sebuah Struktur dan memegang kewenangan
operasional Root, BPH, BPK, BPW, atau Humas. Berbeda dari Akun Kader yang
terikat pada seorang Member.
_Avoid_: Akun Struktur, Akun organisasi, Akun pengurus

**Perangkat**:
Payung untuk Kader yang tersertifikasi menjalankan Daurah — yaitu Pemandu dan
Instruktur. Bukan entitas tersendiri, melainkan cara memandang sekumpulan
Kader.

Sertifikasi saja tidak cukup untuk menjalankan Daurah mana pun: jenjang minimum
seorang Perangkat ditentukan oleh **jenis Daurah** yang ia layani, bukan oleh
satu angka yang berlaku di mana-mana. DM3 menuntut AB3; Daurah lain menerima
AB2. Sertifikasi Instruktur tetap syarat mutlak di semuanya.
_Avoid_: Staf, Petugas, Specialist

**Pemandu**:
Kader yang tersertifikasi memandu kelompok binaan. Sertifikasi ini diperoleh
lewat DPMK, dan menjadi syarat untuk mengikuti DM3.

**Instruktur**:
Kader yang tersertifikasi mengajar di Daurah. Sertifikasi ini diperoleh lewat
TFI.

**Sertifikasi Tanpa Riwayat**:
Keadaan seorang Perangkat yang sertifikasinya tercatat, namun Daurah
Sertifikasi yang mendasarinya tidak ada dalam riwayatnya. Bukan berarti
sertifikasinya batal — sertifikasi tetap sah — melainkan penanda bahwa
riwayatnya perlu dilengkapi.
_Avoid_: Sertifikasi palsu, Data tidak valid

**Nomor Induk Anggota**:
Identitas permanen seorang Kader, tersusun dari Wilayah dan Daerah tempat ia
**pertama kali terdaftar**, tahun masuknya, dan nomor urutnya di dalam Daerah
itu. Komisariat tempat Kader terdaftar **tidak** muncul di dalamnya, sehingga
seluruh Kader satu Daerah berbagi satu deret nomor. Dipakai sekaligus sebagai
identitas login.

Ia nomor kelahiran, bukan alamat. Setelah **Mutasi**, Wilayah dan Daerah di
dalamnya berhenti menunjuk tempat Kader itu bernaung sekarang — dan itu
disengaja. Struktur seorang Kader selalu dibaca dari datanya, tidak pernah
diurai dari Nomor Induknya.

Satu nomor tidak pernah dipakai dua orang, dan nomor yang pernah terbit tidak
pernah terbit lagi — termasuk setelah Kader pemegangnya dihapus. Deret sebuah
Daerah karena itu boleh berlubang, dan lubangnya permanen: ia penomoran, bukan
hitungan jumlah Kader.
_Avoid_: Register number, NIK, Nomor anggota

**Mutasi**:
Perpindahan seorang Kader dari satu Struktur ke Struktur lain, karena alasan
hidup yang sah — pulang ke kampung halaman, menikah dan mengikuti pasangan,
pindah kuliah. Mutasi mengubah Struktur tempat Kader bernaung tanpa menyentuh
**Nomor Induk Anggota**-nya, dan tanpa memutus riwayat Daurah-nya. Setiap
Mutasi tercatat — asal, tujuan, dan kapan — sebab tanpa catatan itu Nomor Induk
yang menyebut Daerah lama tidak punya penjelasan di permukaan mana pun.

Berbeda dari **Organisasi Eksternal**, yang mencatat khidmat di luar KAMMI, dan
berbeda dari koreksi salah input, yang membetulkan sesuatu yang sejak awal
keliru. Mutasi mencatat perpindahan yang benar pada kedua sisinya.
_Avoid_: Pindah struktur, Transfer, Perpindahan cabang

### Struktur

**Struktur**:
Satu unit kepengurusan KAMMI. Setiap Struktur punya induk, sehingga seluruhnya
membentuk satu pohon nasional.
_Avoid_: Organisasi, Wilayah, Branch, Cabang

**Struktur Anak**:
Struktur yang induknya adalah sebuah Struktur tertentu. Dipakai untuk
navigasi satu langkah ke bawah dalam pohon, bukan untuk seluruh keturunan.
_Avoid_: Sub-struktur

**Jenjang**:
Posisi sebuah Struktur di dalam pohon, dari yang tertinggi ke terendah: Pusat
(PP), Wilayah (PW), Daerah (PD) dan Daerah Luar Negeri (PDLN) yang sejajar,
lalu Komisariat (PK).
_Avoid_: Level, Tingkat

**Cakupan**:
Struktur milik sebuah Akun beserta seluruh Struktur turunannya. Cakupan
menentukan data siapa saja yang boleh disentuh Akun tersebut.
_Avoid_: Scope, Jangkauan, Binaan

**Organisasi Eksternal**:
Organisasi di luar KAMMI tempat seorang Kader pernah berkhidmat — dicatat
sebagai riwayat, bukan sebagai Struktur.
_Avoid_: Organisasi (tanpa kualifikasi)

### Kewenangan

**Root**:
Kewenangan penuh atas seluruh Struktur, tanpa batas Cakupan.

**BPH**:
Kewenangan memantau seluruh data dalam Cakupannya. BPH dapat menyunting
identitas **Strukturnya sendiri**, tetapi bukan kedudukannya di pohon maupun
Keadaannya; BPH juga dapat mereset Akun Kepengurusan setiap Struktur
turunannya. Selain keduanya, BPH tidak memiliki hak ubah.

**BPK**:
Kewenangan mengelola kekaderan: Member, Daurah, dan Perangkat.

**BPW**:
Kewenangan mengelola kestrukturan — Struktur **di bawah** Strukturnya sendiri,
tidak pernah Strukturnya sendiri. Jenjang Strukturnya menentukan dua hal
sekaligus: seberapa jauh ke bawah jangkauannya, **dan seberapa jauh haknya di
situ**. Dalam pengelolaan Struktur, yang paling bawah cuma memantau dan
membetulkan identitas — membuat dan menghapus Struktur tersentralisasi, bukan
tersebar mengikuti jangkauan. Di luar itu, BPW dapat mereset Akun Kepengurusan
setiap Struktur turunannya.

**Humas**:
Kewenangan mengelola publikasi: Artikel dan Pengaturan Situs. Satu-satunya
kewenangan yang Cakupannya tidak turun ke Struktur di bawahnya — terbatas pada
Strukturnya sendiri.

**Akun Kader**:
Kewenangan paling dasar: hanya atas datanya sendiri. Dipegang oleh Kader yang
punya Akun tanpa peran operasional.
_Avoid_: Member (sebagai nama kewenangan), Personal

### Keadaan Struktur

Sebuah Struktur berada pada **tepat satu** Keadaan dalam satu waktu. Keadaan
saling meniadakan, dan Struktur Terhapus mendahului Struktur Non-Aktif —
Struktur yang dihapus berhenti disebut Non-Aktif. Keadaan Struktur berjalan
terpisah dari Keadaan Kader di dalamnya.

**Struktur Aktif**:
Struktur yang kepengurusannya sedang berjalan. Keadaan asali setiap Struktur
yang baru dibuat, dan satu-satunya Keadaan yang tidak membatasi apa pun.

**Struktur Non-Aktif**:
Struktur yang kepengurusannya sedang tidak berjalan. Menyangkut keadaan
kepengurusan, bukan keadaan Kader di dalamnya. Selama Non-Aktif ia tidak
mencatat Kader baru, tidak menyelenggarakan Daurah, **Akun kepengurusannya**
berhenti bisa dipakai, dan **Situs Strukturnya** berhenti melayani — tapi ia dan
seluruh isinya tetap terlihat dari dalam dasbor, dan Akun Kader di dalamnya
tetap hidup.

Berhenti melayani menyangkut situsnya, bukan arsipnya. Beranda dan seluruh
navigasi Situs Struktur itu hilang, sementara **Permalink** setiap **Berita**
yang telanjur **Terbit** tetap terbuka, dan Berita itu tetap terbaca lewat
**Berita KAMMI se-Indonesia**. Sebuah kepengurusan yang berhenti tidak membatalkan apa
yang pernah ia terbitkan.

**Struktur Terhapus**:
Struktur yang dicabut dari pohon karena tercatat keliru — salah Jenjang,
duplikat, atau dibuat lalu tidak jadi berjalan. Karena itu hanya Struktur yang
belum mengumpulkan apa pun yang bisa dihapus; yang sudah punya sejarah tidak
keliru, ia hanya berhenti. Struktur Terhapus diperlakukan seolah barisnya tidak
pernah ada — ia tidak menahan penghapusan induknya, dan tidak terbaca di
permukaan mana pun kecuali satu: tempat Root dan BPW PP melihat serta
memulihkannya. Memulihkannya mengembalikannya sebagai Struktur Aktif.
_Avoid_: Dihapus permanen, Diarsipkan, Dibubarkan

### Keadaan Kader

Seorang Kader berada pada **tepat satu** Keadaan dalam satu waktu. Keadaan
saling meniadakan: menetapkan yang satu membatalkan yang lain, dan Kader
Terhapus mendahului semuanya. Keadaan berjalan terpisah dari Jenjang Kekaderan
dan dari sertifikasi Perangkat, yang keduanya punya sumbunya sendiri.

**Aktif**:
Kader yang tidak sedang berada dalam Keadaan lain — masih terlibat berkegiatan
dan masih dalam pembinaan.

**Sanksi**:
Kader yang haknya dibekukan karena keputusan organisasi. Bersifat sementara —
seorang Kader bisa kembali Aktif.
_Avoid_: Suspended, Dibekukan

**Non-Aktif**:
Kader yang berhenti terlibat berkegiatan, namun belum menuntaskan masa
kekaderannya. Berbeda dari Sanksi: ini keadaan, bukan hukuman.
_Avoid_: Tidak aktif, Vakum, Keluar

**Alumni**:
Kader yang telah menuntaskan masa kekaderannya secara sah. Menggantikan Keadaan
sebelumnya — seorang Alumni tidak lagi tercatat Non-Aktif maupun Sanksi.
_Avoid_: Mantan kader, Lulusan

**Kader Terhapus**:
Kader yang barisnya dicabut dari daftar karena tercatat keliru — salah ketik,
duplikat, atau didaftarkan lalu ternyata bukan orangnya. Mendahului seluruh
Keadaan lain: seorang Kader Terhapus berhenti disebut Aktif, Non-Aktif, Sanksi,
maupun Alumni. Ia tidak terbaca di permukaan mana pun kecuali satu, tempat
kepengurusan yang menaunginya melihat dan memulihkannya. Akun-nya ikut
tersimpan dan ikut kembali saat ia dipulihkan.

Menghapus bukan mengakhiri kekaderan. Kader yang berhenti terlibat itu
Non-Aktif, dan yang menuntaskannya itu Alumni; Terhapus dipakai ketika barisnya
sendiri yang tidak seharusnya ada.

**Hapus Selamanya** berdiri terpisah dan tidak bisa dibatalkan: ia membuang
baris itu dari basis data untuk seterusnya, hanya boleh ditempuh terhadap Kader
yang **belum mengumpulkan apa pun** — tanpa riwayat Daurah, akademik, karier,
Organisasi Eksternal, maupun Mutasi — dan tidak mengembalikan nomor urut
**Nomor Induk Anggota**-nya.
_Avoid_: Dihapus permanen (untuk soft delete), Diarsipkan, Dikeluarkan

**Jenjang Kekaderan**:
Tahapan pembinaan seorang Kader: AB1, AB2, AB3. Naik jenjang lewat Kelulusan
sebuah Daurah — lihat catatan pada **Kelulusan**: kenaikan itu belum
disambungkan di kode, dan masih disetel dengan tangan.
_Avoid_: Level kader, Tingkat kader, Status

### Daurah

**Daurah**:
Kegiatan pembinaan yang diselenggarakan sebuah Struktur. Jenis Daurah yang
boleh diselenggarakan bergantung pada Jenjang Struktur penyelenggaranya.
_Avoid_: Training, Pelatihan, Diklat

**Daurah Marhalah**:
Daurah yang menaikkan Jenjang Kekaderan: DM1, DM2, dan DM3 (Daurah Marhalah
1–3), ditempuh berurutan.
_Avoid_: Daurah berjenjang, Daurah pokok

**Daurah Sertifikasi**:
Daurah yang berdiri di samping tangga Marhalah dan tidak menaikkan Jenjang
Kekaderan, melainkan menjadikan seorang Kader sebagai Perangkat: DPMK (Daurah
Pemandu Madrasah KAMMI) menghasilkan Pemandu, TFI (Training for Instructors)
menghasilkan Instruktur.
_Avoid_: Daurah tambahan, Daurah khusus

**Peserta**:
Kader yang mengikuti sebuah Daurah.
_Avoid_: Attendant, Partisipan

**Kelulusan**:
Penetapan bahwa seorang Peserta lulus dari sebuah Daurah — inilah yang
menaikkan Jenjang Kekaderan atau memberi sertifikasi Perangkat. Peserta yang
tidak memegang Kelulusan tidak dibedakan antara belum dinilai dan dinilai
tidak lulus: keduanya sama-sama ketiadaan Kelulusan, bukan dua keadaan yang
berbeda.

> **Kode belum menyusul definisi ini.** Menetapkan Kelulusan hanya menulis satu
> boolean pada baris Peserta (`updateAttendantStatus`, `db/query/training.ts`).
> Jenjang Kekaderan, sertifikasi Pemandu, dan sertifikasi Instruktur seluruhnya
> masih disetel dengan tangan lewat permukaan lain. Jangan menulis kode baru
> yang mengandaikan Kelulusan sudah menurunkan ketiganya — sambungan itu belum
> ada, dan apakah ia harus ada adalah keputusan produk yang belum diambil.

_Avoid_: Passing, Kelolosan, Kelulusan negatif

**Masa Penetapan Kelulusan**:
Rentang waktu Kelulusan sebuah Daurah boleh ditetapkan atau dicabut: terbuka
sehari setelah Daurah selesai, tertutup 30 hari sesudahnya. Pencabutan tunduk
pada masa ini lewat pintu mana pun ia terjadi — termasuk ketika Peserta yang
memegangnya dikeluarkan dari Daurah. Mengeluarkan Peserta yang tidak memegang
Kelulusan bukan pencabutan melainkan koreksi roster, dan sah dilakukan kapan
pun. Hanya Root yang boleh menembus masa ini.
_Avoid_: Grading window, Masa penilaian

**Peran Instruktur**:
Peran yang dipegang seorang Instruktur dalam sebuah Daurah: Master of
Training, Assistant Master of Training, Master of Classroom, Instruktur
Materi, Admin Daurah, Ustadz Daurah, dan Observer.
_Avoid_: Panitia, Pemateri

### Publikasi

**Situs Struktur**:
Wajah publik sebuah Struktur — satu untuk tiap Struktur, di alamatnya sendiri.
Isinya milik Struktur itu saja; menelusuri Situs Struktur tidak pernah membawa
pembaca ke isi Struktur lain, kecuali lewat **Berita KAMMI se-Indonesia**.
_Avoid_: Situs publik (tanpa kualifikasi), Microsite, Subsitus

**Situs Aktif**:
Situs Struktur yang sudah dinyalakan oleh Humas-nya. Setiap Struktur berhak
atas Situs Struktur, tapi tidak setiap Struktur memilikinya — sebelum
dinyalakan, alamatnya tidak melayani apa pun. Menyalakan adalah keputusan
Humas Struktur itu sendiri, bukan restu Struktur di atasnya.
_Avoid_: Situs terbit, Go-live, Publish situs

**Artikel**:
Tulisan milik sebuah Struktur. Payung untuk dua jenis yang berbeda perlakuan:
**Berita** dan **Halaman**.

**Berita**:
Artikel bertanggal yang masuk arsip kronologis sebuah Struktur. Tanggal
terbitnya bagian dari identitasnya, bukan sekadar metadata — ia menentukan
letak Berita di dalam arsip dan di dalam **Permalink**-nya.
_Avoid_: Post, Blog, Kabar

**Halaman**:
Artikel tak bertanggal yang berdiri sendiri di alamat akar sebuah Situs
Struktur. Tidak masuk arsip, tidak muncul di **Berita KAMMI se-Indonesia**.
_Avoid_: Halaman statik, Page

**Terbit**:
Keadaan sebuah Artikel yang sudah boleh dibaca publik. Terbit menuntut dua hal
sekaligus: Artikel itu dinyatakan terbit, **dan** tanggal terbitnya sudah
lewat. Artikel bertanggal masa depan sudah dinyatakan, tapi belum Terbit.
_Avoid_: Published, Live, Tayang

**Diarsipkan**:
Keadaan sebuah Artikel yang ditarik dari seluruh daftar namun **Permalink**-nya
tetap terbuka. Mengarsipkan bukan menyangkal bahwa tulisannya pernah ada.
_Avoid_: Dihapus, Disembunyikan

**Permalink**:
Alamat tetap sebuah Berita. Satu Berita punya tepat satu Permalink yang sah
pada satu waktu; alamat lain yang pernah menunjuk padanya tetap mengantar ke
situ, tidak melayaninya sendiri.
_Avoid_: URL (sebagai istilah domain), Link berita

**Salinan Markdown**:
Bentuk kedua sebuah Berita atau Halaman: isi yang sama tanpa perancah
tampilan, ditujukan untuk agen AI yang membacanya. Ia bukan alamat tandingan —
**Permalink** tetap yang berkuasa, dan Salinan Markdown selalu menunjuk balik
ke sana.
_Avoid_: Versi AI, Plain text, Raw

**Penulis**:
Nama orang yang menulis sebuah Berita, dicatat sebagai teks. Bukan Kader dan
bukan Akun — penulis Berita sering bukan pemegang Akun, dan namanya tetap
tercantum tanpa bergantung pada data siapa pun.
_Avoid_: Author, Kontributor, Kader penulis

**Berita KAMMI se-Indonesia**:
Kumpulan Berita dari seluruh Struktur, disusun kronologis dan disajikan hanya
oleh Situs Struktur milik PP. Satu-satunya permukaan tempat Berita lintas
Struktur berkumpul; dari sana pembaca selalu dilempar ke Situs Struktur
penerbitnya.
Term ini **dulu bernama "Berita Jaringan"**, dan nama lama itu masih dipakai
di ADR 0012 & 0013, di nama berkas komponen, di cache tag, dan di nama index
basis data — semuanya sengaja tidak ikut di-rename. Yang berubah adalah
istilah domain dan apa yang dibaca pembaca.
_Avoid_: Berita Jaringan (nama lama), Feed nasional, Agregat berita

**Gambar Utama**:
Satu gambar yang mewakili sebuah Artikel di luar halamannya sendiri — di
kartu arsip, di kartu Berita KAMMI se-Indonesia, dan sebagai gambar yang
muncul saat Permalink-nya dibagikan. Tepat satu, dan selalu ditunjuk
eksplisit: ia tidak disimpulkan dari urutan **Galeri**.
_Avoid_: Thumbnail, Cover, Featured image

**Galeri**:
Kumpulan gambar tambahan milik sebuah Artikel, tampil berurutan di halaman
Artikel itu saja. Galeri tidak pernah mewakili Artikel di permukaan lain —
itu tugas **Gambar Utama**. Urutannya ditentukan Humas dan bermakna.
_Avoid_: Album, Lampiran, Slider

**Pengaturan Situs**:
Konfigurasi tampilan publik milik sebuah Struktur.
