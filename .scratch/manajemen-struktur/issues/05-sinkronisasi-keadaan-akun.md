# 05 — Sinkronisasi keadaan Akun dengan keadaan Struktur

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Charting memilih keadaan Akun sebagai **kolom tersimpan**, bukan turunan dari
Struktur yang terhubung. Pilihan itu final. Harganya juga sudah diterima: tiap
jalur yang mengubah keadaan Struktur wajib ikut menyapu Akunnya, dan yang lupa
jadi bug diam yang tidak kelihatan sampai seseorang berhasil login ke Struktur
yang sudah tidak ada. Tiket ini memikul kewajiban itu dan memutuskan bagaimana
ia dijaga.

Yang harus terjawab:

1. **Bentuk kolomnya.** Boolean `isNonActive` sejajar dengan yang ada di
   `organization` dan `member`, atau sesuatu yang menyimpan **sebab** —
   Akun mati karena Strukturnya Non-Aktif itu berbeda dari Akun mati karena
   Strukturnya Terhapus, dan hanya yang pertama hidup lagi saat Struktur
   diaktifkan. Kalau sebabnya tidak disimpan, pemulihan tidak bisa tahu Akun
   mana yang layak dihidupkan.

2. **Siapa yang menulis.** Satu tempat atau tersebar? `AGENTS.md` sudah
   melarang logika otorisasi diduplikasi lintas `action.ts`; pola yang sama
   masuk akal di sini. Kandidatnya: satu fungsi di `src/db/query/` yang
   memindahkan keadaan Struktur **dan** Akunnya dalam satu transaksi, sehingga
   tidak ada pemanggil yang bisa melakukan setengahnya.

3. **Akun yang lahir belakangan.** `createOrganization`
   (`db/query/organization.ts:113`) otomatis membuat empat Akun. Kalau ada
   jalur yang membuat Akun untuk Struktur yang sudah Non-Aktif, Akun itu lahir
   hidup di Struktur mati. Cegah di mana — di pembuatan Akun, atau di jalur
   login yang toh sudah harus memeriksa?

4. **Jalur login memeriksa apa.** Kalau login tetap ikut memeriksa keadaan
   Struktur, kolomnya jadi cache belaka dan drift-nya tidak berbahaya. Kalau
   login hanya memeriksa kolom Akun, kolom itu jadi satu-satunya penjaga dan
   drift-nya berarti pintu terbuka. Dua sikap yang berbeda, pilih sadar.

5. **Bagaimana drift ketahuan.** Tes, constraint, atau skrip pemeriksa? Ini
   pertanyaan yang paling mudah dilewat dan paling mahal kalau dilewat.

**Root adalah kasus khusus.** Akun `root` dibuat terhubung ke PP
(`db/query/organization.ts:136`). Kalau suatu saat PP dinonaktifkan, aturan
apa adanya akan mematikan Root dan mengunci semua orang keluar dari sistem.
Putuskan pengecualiannya di sini, jangan biarkan jadi kejutan.

Sesi ini juga harus menuliskan **satu baris ke `CONTEXT.md`** kalau hasilnya
melahirkan istilah baru untuk keadaan Akun — sekarang glosarium hanya
mengenal Akun sebagai kredensial, tanpa keadaan sama sekali.

## Answer

**Tiket ini membatalkan salah satu ketetapan charting**, dengan alasan baru yang
ditemukan di kode. Bacanya jangan dilewat: pertanyaan 1, 2, 3, dan 5 di badan
tiket **menguap** karena benda yang mereka jaga ternyata tidak perlu ada.

### 0. Fakta yang membatalkannya

Sesi **sudah membawa Keadaan Struktur di tiap request**. `withUserCTE`
(`db/query/cte/user.ts:16-26`) men-join `organization` dan ikut memilih
`isNonActive` ke dalam `connectedOrganization`. Jalurnya:
`readActiveSession()` → `validateSession` → `readSession` → `withSessionCTE` →
`withUserCTE`. Tidak ada query tambahan yang perlu ditambahkan; join-nya sudah
terjadi.

Struktur milik **Akun Kader** juga sudah terjangkau lewat jalur kedua:
`withMemberCTE` ikut membawa `organization.isNonActive`
(`db/query/cte/member.ts:11-22`).

### 1. Keadaan Akun adalah **turunan**, bukan kolom tersimpan

Charting memilih kolom tersimpan dan menerima harganya: "tiap jalur yang
mengubah keadaan Struktur wajib ikut menyapu Akunnya, dan yang lupa jadi bug
diam." Harga itu ternyata **tidak membeli apa-apa**:

- _Performa?_ Join-nya sudah terjadi tiap request.
- _Menyimpan sebab (mati karena Non-Aktif vs karena Terhapus)?_ Sebabnya
  **adalah** Keadaan Struktur, dan itu sudah di tangan. Turunan malah lebih
  akurat — kolom tersimpan bisa basi, Keadaan Struktur tidak pernah.
- _Membekukan satu Akun terlepas dari Strukturnya?_ Sudah **Out of scope**.

Jadi: **nol kolom baru di `user`, nol migrasi di tabel itu, nol jalur sapu, nol
deteksi drift.** Bug yang tiket ini dibuat untuk menjaga — "seseorang berhasil
login ke Struktur yang sudah tidak ada" — jadi **mustahil secara konstruksi**,
bukan dijaga oleh kedisiplinan. Tidak ada angka kedua yang bisa berselisih.

Opsi "kolom sebagai cache yang selalu kalah dari Keadaan Struktur" ditolak
paling keras: ia membayar seluruh biaya kolom tersimpan lalu tidak memakai
jawabannya.

### 2. PP tidak bisa dinonaktifkan — larangan pada sasaran, bukan pengecualian pada pelaku

Matriks tiket 02 sudah menutup PP dari BPW PP, jadi satu-satunya yang bisa
menonaktifkan PP adalah **Root** — dan Akun `root` terhubung ke PP
(`db/query/organization.ts:136`). Tombol itu mematikan penekannya sendiri lalu
mengunci semua orang di luar.

**Jenjang PP tidak bisa dinonaktifkan sama sekali.** Ditolak di jalur, bukan
disembunyikan di UI. Alasannya bukan melindungi Root: "kepengurusan pusat sedang
tidak berjalan" bukan keadaan yang punya arti di organisasi ini — ia berarti
seluruh situs publik pusat 404 dan tidak ada Kader baru bisa dicatat di mana
pun. Mengecualikan pelakunya (Root kebal) akan membiarkan keadaan tak bermakna
itu tetap bisa dibuat; melarang sasarannya lebih jujur. PP tidak punya induk,
jadi larangannya satu baris.

**Ini mengamandemen matriks tiket 02**: baris Root, kolom
`nonaktifkan/aktifkan`, tidak lagi berbunyi "semua" melainkan "semua kecuali
PP". Dicatat juga di tiket 02.

**Sengaja tidak diputuskan di sini:** apakah PP juga dilarang **dihapus**.
Prasyarat sudah menolaknya dalam praktik — PP selalu punya anak — tapi itu
perlindungan yang kebetulan, jenis yang tiket 02 justru menuntut dinyatakan.
Kalau seseorang ingin itu jadi kebijakan tertulis, itu keputusan baru.

### 3. Pintunya menutup di **request berikutnya**

Bukan di login berikutnya, dan bukan lewat penghapusan sesi paksa.

"Login berikutnya" berarti sampai tiga hari (`maxAge` 3 hari di
`login-form/action.ts:88`) setelah sebuah Struktur mati, orang-orangnya masih
mencatat Kader dan mengubah data di sana — persis yang penonaktifan dimaksudkan
untuk hentikan. Penghapusan sesi paksa benar hasilnya tapi kerja dua kali, dan
menambah satu lagi jalur-yang-bisa-lupa-dipanggil — kewajiban yang sama yang
poin 1 baru saja dihapus.

### 4. Seam-nya: di dalam `readActiveSession`/`validateSession`

Struktur mati → sesi dianggap tidak ada. **Nol call-site baru**: tiap
`if (!session) redirect('/login')` yang sudah tersebar di seluruh halaman dan
Server Action langsung berlaku apa adanya, dan permukaan yang **belum ditulis**
ikut terjaga karena mereka juga harus lewat situ.

`readAccessScope` ditolak: Server Action yang tidak memakainya lolos. Layout
dasbor dan `AccessGuard` ditolak lebih keras: keduanya menutup **halaman**,
sementara Server Action bisa dipanggil langsung tanpa merender halamannya sama
sekali.

Konsekuensi "jalur sesi jadi bisu dan tidak bisa menjelaskan apa pun" awalnya
dicatat sebagai harga opsi ini. Poin 6 menghapus harga itu — tidak ada yang
menjelaskan apa pun di mana pun, jadi seam yang bisu justru pas.

### 5. Akun Kader **tidak** ikut mati

Yang berhenti bisa dipakai hanya **empat Akun kepengurusan** — BPH, BPK, BPW,
Humas. Akun Kader tetap hidup.

Buktinya ada di kalimat definisinya sendiri: _"Menyangkut keadaan
**kepengurusan**, bukan keadaan Kader di dalamnya."_ Kalau menonaktifkan sebuah
PD ikut mengunci ratusan Kader dari akun mereka sendiri, kalimat itu jadi
bohong. Mereka bukan pengurusnya — mereka orang yang kebetulan terdaftar di
sana.

Struktur **Terhapus** tidak punya kasus ini sama sekali: syaratnya nol Member,
jadi tidak ada Akun Kader yang bisa terdampak.

"Kader boleh masuk tapi read-only" ditolak: itu keadaan Akun ketiga yang tidak
ada di model mana pun.

**Ini mengamandemen tiket 01 dan `CONTEXT.md`**: klausa "Akun-akunnya berhenti
bisa dipakai" terlalu luas dan sudah diganti jadi "Akun kepengurusannya", dengan
tambahan bahwa Akun Kader tetap hidup. Dicatat juga di tiket 01.

### 6. Pesan penolakan: **generik untuk dua-duanya**

Baik Struktur Non-Aktif maupun Struktur Terhapus menghasilkan pesan yang sama
persis dengan password yang benar-benar salah: **"Username atau password
salah."**

Ini **bukan** rekomendasi agen — agen mengusulkan pesan yang berbeda untuk
Non-Aktif, dengan alasan Non-Aktif bukan rahasia dan pengurus yang sah akan
mengira lupa password. Pengguna memilih generik dua-duanya, dan itu keputusannya.

Konsekuensi yang harus dipikul di tempat lain: **sistem sengaja tidak memberi
tahu**, jadi yang menonaktifkan sebuah Struktur wajib memberi tahu orangnya di
luar sistem. Itu dititipkan ke **tiket 08** sebagai isi dialog konfirmasi.

### Yang tidak jadi ditulis

Tidak ada istilah baru untuk keadaan Akun, jadi **tidak ada baris baru di
`CONTEXT.md`** untuk itu. Akun tidak punya Keadaan sendiri — ia mewarisi Keadaan
Strukturnya saat dibaca. Satu-satunya suntingan `CONTEXT.md` dari tiket ini
adalah amandemen klausa di poin 5.
