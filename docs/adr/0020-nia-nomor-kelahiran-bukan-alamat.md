# Nomor Induk Anggota adalah nomor kelahiran, bukan alamat — dan tidak pernah terbit ulang

`CONTEXT.md` selama ini mendefinisikan Nomor Induk Anggota sebagai tersusun
dari "Wilayah dan Daerah **tempatnya bernaung**". Selama seorang Kader tidak
pernah berpindah Struktur, definisi itu benar dan tidak ada yang menagihnya.
Mutasi menagihnya.

Kader berpindah Struktur karena alasan yang berulang dan sah — pulang ke
kampung halaman, menikah dan mengikuti pasangan, pindah kuliah. Sampai
sekarang sistem tidak punya jalan untuk itu: `organizationId` tidak ada di
`profileSchema`, jadi satu-satunya cara "memindahkan" seorang Kader adalah
menghapusnya di sini dan mendaftarkannya lagi di sana — yang memutus riwayat
Daurah-nya dan menerbitkan NIA kedua untuk orang yang sama.

Begitu mutasi diizinkan sambil NIA dipertahankan, dua digit PD di dalam NIA
berhenti menunjuk tempat Kader itu berada. Itu bukan efek samping yang bisa
ditambal; itu konsekuensi langsung dari "NIA permanen".

## Decision

**NIA mencatat di mana seorang Kader pertama kali terdaftar, dan tidak pernah
berubah sesudahnya.** Ia identitas kelahiran, bukan alamat tinggal. Struktur
tempat Kader bernaung dibaca dari `member.organization_id`, tidak pernah
diurai dari NIA-nya.

Konsekuensi yang mengikat, dan sengaja disebut satu per satu:

1. **Mutasi mengubah `organization_id`, titik.** NIA tidak disentuh, Akun
   tidak diterbitkan ulang, riwayat Daurah tidak berpindah.
2. **Mutasi dicatat, tidak ditimpa.** Tabel `member_mutation` menyimpan asal,
   tujuan, waktu, dan pelakunya. Tanpa ini, NIA yang menyebut PD Sleman
   sementara Kader-nya terdaftar di PD Bantul adalah kontradiksi yang tidak
   punya penjelasan di permukaan mana pun. Catatan itulah penjelasannya.
3. **Bukan `member_organization_history`.** Tabel itu sudah berarti lain —
   riwayat Organisasi Eksternal, yakni organisasi **di luar** KAMMI, dicatat
   sebagai teks bebas. Menaruh Struktur di situ merusak satu istilah yang
   sudah bersih.
4. **Wewenangnya Root dan BPK PP saja.** Alasannya bukan kehati-hatian umum:
   mutasi memindahkan seorang Kader menyeberangi batas Cakupan, dan tidak ada
   BPK daerah yang berdiri di kedua sisi batas itu sekaligus. BPK PD asal
   kehilangan hak atas Kader tersebut tepat pada saat aksinya berhasil.
5. **Setiap permukaan yang menyebut asal membacanya dari `organization_id`.**
   Termasuk kolom "Asal PW" di combobox Peserta Daurah, yang sudah benar hari
   ini (`pwNameSubquery` menelusuri pohon dari `member.organization_id`) dan
   harus tetap begitu.

**Dan nomor urut NIA tidak pernah terbit ulang.** Ini sisi kedua dari
keputusan yang sama, karena keduanya menjawab pertanyaan yang sama: apa yang
terjadi pada NIA ketika baris di bawahnya berubah.

`generateRegisterNumber` hari ini menebak nomor berikutnya dengan membaca
`MAX(register_number)` atas baris yang ada, lalu menambah satu. Cara itu punya
dua lubang:

- **Alokasi balapan.** Membaca lalu menulis adalah dua perjalanan terpisah ke
  basis data. Dua pendaftaran serentak pada prefix yang sama membaca `MAX`
  yang sama dan menulis nomor yang sama. Tidak ada yang menahannya: tabel
  `member` hanya punya satu indeks, primary key `id` — **tidak ada
  `UNIQUE (register_number)`**. Yang menolong selama ini hanyalah `user_name_key`,
  dan itu pun cuma berlaku bagi Kader yang punya Akun, sementara `deleteMember`
  membuang baris `user`-nya sehingga kunci itu terlepas.
- **Nomor turun kembali.** Menghapus baris ber-NIA tertinggi pada sebuah
  prefix menurunkan `MAX`, dan pendaftar berikutnya menerima nomor yang sudah
  pernah tercetak — di kartu, di ekspor, di absensi Daurah, dan sebagai
  identitas login.

Keduanya ditutup oleh satu perubahan: **tabel high-water mark
`(prefix → last_seq)` yang angkanya hanya boleh naik**, dialokasikan lewat satu
pernyataan atomik (`INSERT … ON CONFLICT DO UPDATE … RETURNING`) alih-alih
baca-lalu-tulis. Basis data sendiri yang mengantre pendaftaran serentak, dan
karena angkanya tidak pernah turun, penghapusan baris tidak membebaskan nomor.
`UNIQUE (register_number)` dipasang sebagai jaring pengaman terakhir.

Seed awalnya dihitung dari `MAX` per prefix atas **seluruh** baris `member`,
termasuk yang sudah di-soft-delete. Justru itu intinya: nomor yang telanjur
dipegang seseorang yang kemudian dihapus tetap hangus.

## Considered Options

**Menerbitkan NIA baru saat mutasi**, supaya NIA selalu cocok dengan Struktur
tempat Kader berada. Ditolak: itu membatalkan sifat permanen NIA, memutus
login (NIA adalah identitas login), dan memutus sambungan ke riwayat Daurah
yang tercatat atas nomor lama. Satu orang akan punya dua nomor, dan pertanyaan
"mana yang sah" tidak punya jawaban yang lebih baik daripada "yang pertama" —
yang berarti kita kembali ke keputusan ini lewat jalan memutar.

**Melarang mutasi**, dan memperlakukan perpindahan sebagai hapus-lalu-daftar-
ulang. Ditolak dengan alasan yang sama, ditambah hilangnya seluruh riwayat.

**Membiarkan mutasi menimpa `organization_id` tanpa catatan.** Ditolak: itu
menghasilkan NIA yang bertentangan dengan Strukturnya tanpa satu pun permukaan
yang bisa menjelaskan kenapa. Catatan mutasi bukan kemewahan audit, ia satu-
satunya yang membuat NIA-sebagai-nomor-kelahiran terbaca oleh manusia.

**Tombstone daftar NIA** (tabel berisi setiap NIA yang pernah terbit, dilewati
oleh generator) sebagai ganti high-water mark. Ditolak: memberi jaminan yang
sama dengan ongkos satu tabel yang tumbuh selamanya, dan tetap membiarkan
alokasi balapan terbuka karena ia hanya menyaring, tidak mengalokasikan.

**Membiarkan nomor direklamasi** setelah Hapus Selamanya, dengan alasan yang
dihapus hanyalah salah input yang belum sempat dipakai. Ditolak secara sadar:
NIA sudah tercetak pada saat baris itu dibuat, bukan pada saat ia dipakai.
Konsekuensinya diterima — lihat di bawah.

## Consequences

- **Hapus Selamanya tidak mengembalikan nomor urut.** Menghapus `…037`
  membuat pendaftar berikutnya tetap menerima `…038`; `037` hangus selamanya.
  Ini harga langsung dari "tidak pernah terbit ulang", dan ia mengurangi
  manfaat Hapus Selamanya (lihat ADR 0021) menjadi sekadar "barisnya benar-
  benar hilang" — bukan "nomornya kembali".
- **Deret NIA sebuah Daerah akan berlubang** seiring waktu, dan lubang itu
  permanen. Siapa pun yang membaca deret NIA sebagai hitungan jumlah Kader
  akan salah. Ia memang bukan hitungan; ia penomoran.
- **Dua digit PD di dalam NIA berhenti bisa dipercaya sebagai asal** begitu
  ada satu saja Kader yang bermutasi. Kode yang mengurai NIA untuk menebak
  Struktur — jika ada yang ditulis kemudian — akan salah tanpa peringatan.
  Tidak ada pengurai semacam itu hari ini, dan tidak boleh ada.
- **`UNIQUE (register_number)` bisa gagal dipasang** jika production ternyata
  menyimpan duplikat. Pada staging, per 30 Agustus 2026, duplikat nol.
  Kegagalan pemasangan adalah temuan yang harus dilaporkan, bukan dipaksa
  lewat.
- `CONTEXT.md` diamandemen: definisi **Nomor Induk Anggota** diperbaiki, dan
  istilah **Mutasi** ditambahkan.
