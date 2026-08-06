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

**Perangkat**:
Payung untuk Kader yang tersertifikasi menjalankan Daurah — yaitu Pemandu dan
Instruktur. Bukan entitas tersendiri, melainkan cara memandang sekumpulan
Kader.
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
Identitas permanen seorang Kader, tersusun dari Struktur tempatnya terdaftar,
tahun masuknya, dan nomor urutnya di sana. Dipakai sekaligus sebagai identitas
login.
_Avoid_: Register number, NIK, Nomor anggota

### Struktur

**Struktur**:
Satu unit kepengurusan KAMMI. Setiap Struktur punya induk, sehingga seluruhnya
membentuk satu pohon nasional.
_Avoid_: Organisasi, Wilayah, Branch, Cabang

**Jenjang**:
Posisi sebuah Struktur di dalam pohon, dari yang tertinggi ke terendah: Pusat
(PP), Wilayah (PW), Daerah (PD) dan Daerah Luar Negeri (PDLN) yang sejajar,
lalu Komisariat (PK).
_Avoid_: Level, Tingkat

**Cakupan**:
Struktur milik sebuah Akun beserta seluruh Struktur turunannya. Cakupan
menentukan data siapa saja yang boleh disentuh Akun tersebut.
_Avoid_: Scope, Jangkauan, Binaan

**Struktur Non-Aktif**:
Struktur yang kepengurusannya sedang tidak berjalan. Menyangkut keadaan
kepengurusan, bukan keadaan Kader di dalamnya.

**Organisasi Eksternal**:
Organisasi di luar KAMMI tempat seorang Kader pernah berkhidmat — dicatat
sebagai riwayat, bukan sebagai Struktur.
_Avoid_: Organisasi (tanpa kualifikasi)

### Kewenangan

**Root**:
Kewenangan penuh atas seluruh Struktur, tanpa batas Cakupan.

**BPH**:
Kewenangan memantau — melihat data kekaderan maupun kestrukturan, tanpa boleh
mengubahnya.

**BPK**:
Kewenangan mengelola kekaderan: Member, Daurah, dan Perangkat.

**BPW**:
Kewenangan mengelola kestrukturan: Struktur beserta pohonnya.

**Humas**:
Kewenangan mengelola publikasi: Artikel dan Pengaturan Situs. Satu-satunya
kewenangan yang Cakupannya tidak turun ke Struktur di bawahnya — terbatas pada
Strukturnya sendiri.

**Akun Kader**:
Kewenangan paling dasar: hanya atas datanya sendiri. Dipegang oleh Kader yang
punya Akun tanpa peran operasional.
_Avoid_: Member (sebagai nama kewenangan), Personal

### Keadaan Kader

Seorang Kader berada pada **tepat satu** Keadaan dalam satu waktu. Keadaan
saling meniadakan: menetapkan yang satu membatalkan yang lain. Keadaan berjalan
terpisah dari Jenjang Kekaderan dan dari sertifikasi Perangkat, yang keduanya
punya sumbunya sendiri.

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

**Artikel**:
Tulisan yang diterbitkan sebuah Struktur ke situs publiknya.

**Pengaturan Situs**:
Konfigurasi tampilan publik milik sebuah Struktur.
