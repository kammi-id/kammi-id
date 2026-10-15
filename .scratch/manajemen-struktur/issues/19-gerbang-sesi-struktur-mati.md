# 19 — Gerbang sesi: Struktur mati = sesi tidak ada

**Type:** implementation
**Status:** resolved
**Blocked by:** 13

Spec: [`../spec.md`](../spec.md) §5 (seluruhnya)

## Pekerjaan

**Akun tidak punya Keadaan sendiri — ia mewarisi Keadaan Strukturnya saat dibaca.**

**Nol kolom baru di `user`.** Nol migrasi di tabel itu, nol jalur sapu, nol deteksi
drift. Kalau muncul dorongan menambahkan `user.is_non_active` atau semacamnya, itu
tanda tiket ini sedang dibaca terbalik — baca spec §5.1 lebih dulu.

### Seam-nya di `readActiveSession` / `validateSession`

Struktur mati → **sesi dianggap tidak ada**.

**Nol call-site baru.** Tiap `if (!session) redirect('/login')` yang sudah tersebar di
seluruh halaman dan Server Action langsung berlaku apa adanya, dan permukaan yang
**belum ditulis** ikut terjaga karena mereka juga harus lewat situ.

Tiga seam alternatif sudah ditolak, dengan alasan:

- **`readAccessScope`** — Server Action yang tidak memakainya lolos.
- **Layout dasbor** dan **`AccessGuard`** — keduanya menutup **halaman**, sementara
  Server Action bisa dipanggil langsung tanpa merender halamannya sama sekali.

### Datanya sudah di tangan

`withUserCTE` (`src/db/query/cte/user.ts:16-26`) sudah men-join `organization` dan
memilih `isNonActive` ke dalam `connectedOrganization`. Jalurnya
`readActiveSession()` → `validateSession` → `readSession` → `withSessionCTE` →
`withUserCTE`. **Nol query tambahan.**

Perluas CTE itu agar ikut membawa kolom **Keadaan** (bukan cuma `isNonActive`) begitu
kolom generated tiket 13 mendarat. `withMemberCTE`
(`src/db/query/cte/member.ts:11-22`) adalah jalur kedua untuk Akun Kader.

### Yang mati dan yang tidak

**Hanya empat Akun kepengurusan** — BPH, BPK, BPW, Humas. **Akun Kader tetap hidup.**

Buktinya di kalimat definisi Non-Aktif sendiri: _"Menyangkut keadaan kepengurusan,
bukan keadaan Kader di dalamnya."_ Kalau menonaktifkan sebuah PD ikut mengunci ratusan
Kader dari akun mereka sendiri, kalimat itu jadi bohong.

Struktur **Terhapus** tidak punya kasus Akun Kader sama sekali — prasyaratnya nol
Member.

### Pintunya menutup di request berikutnya

Bukan di login berikutnya (`maxAge` 3 hari di `login-form/action.ts:88` berarti
orang-orangnya masih mencatat Kader selama tiga hari setelah Strukturnya mati), dan
bukan lewat penghapusan sesi paksa (benar hasilnya, tapi kerja dua kali dan menambah
satu lagi jalur-yang-bisa-lupa-dipanggil).

### Pesan penolakan: generik untuk dua-duanya

Non-Aktif maupun Terhapus menghasilkan pesan **sama persis** dengan password yang
benar-benar salah: **"Username atau password salah."**

> Ini **pilihan pengguna**, menolak usulan agen yang membedakan pesan untuk
> Non-Aktif. Jangan dibuka ulang.

Konsekuensinya dipikul dialog konfirmasi tiket 26: sistem sengaja tidak memberi tahu,
jadi yang menonaktifkan wajib memberi tahu orangnya **di luar sistem**.

## Selesai bila

- Akun kepengurusan Struktur Non-Aktif atau Terhapus ditolak di **request
  berikutnya**, di halaman **dan** di Server Action yang dipanggil langsung
- Akun Kader di Struktur Non-Aktif masih bisa masuk
- Nol kolom baru di `user`

## Answer

**Nol kolom baru di `user`, dan itu dikunci sebuah tes** yang membaca
`information_schema` dan menolak kolom apa pun bernama `state`/`non_active`/
`deleted` di tabel itu. Keadaan Akun tetap turunan.

### Gerbangnya

`mayHoldSession(role, strukturState)` di `src/lib/auth/keadaan-akun.ts` —
murni, nol basis data. Ia dinamai menurut **hak yang diberikannya**, bukan
menurut tindakan memeriksanya, mengikuti aturan AGENTS.md; versi pertamanya
bernama `deriveKeadaanAkun` dan mengembalikan `'hidup' | 'mati'`, yang memaksa
tiap pemanggil mengeja ulang polaritasnya sebagai `=== 'mati'`.

Di dalamnya **`Record<UserRole, boolean>`, bukan daftar empat peran yang mati.**
Bentuk itu yang penting: menambah Kewenangan ke enum jadi galat `tsc` di sini
sampai ada yang menyatakan ia jatuh di sisi mana. Daftar akan membiarkan
Kewenangan baru diam-diam berasali "selamat" — persis arah kegagalan yang salah.
Peran tak dikenal saat runtime juga dijawab mati; di seam ini, diam berarti
tidak.

### Seam-nya, dan pintu yang tadinya lolos

Gerbangnya di `validateSession`, jadi tiap `if (!session) redirect('/login')`
yang sudah tersebar berlaku apa adanya — **nol call-site baru**. Server Action
yang dipanggil langsung ikut tertutup:
`dashboard/user/account/_components/action/action.ts` memanggil
`validateSession` sendiri dan mewarisinya tanpa diubah.

**`readSession` di `lib/auth/api.ts` ikut digerbangi.** Ia diekspor dan hari ini
nol pemanggil — dan justru itu alasannya: pintu ter-ekspor yang dibiarkan tanpa
gerbang persis "jalur-yang-bisa-lupa-dipanggil" yang §5.3 pakai untuk menolak
alternatif. Keduanya lewat satu helper, `ifAkunMayHoldIt`.

Nol `deleteSession`. Pintunya menutup di **request berikutnya** dan membuka lagi
begitu Strukturnya diaktifkan kembali, tanpa siapa pun login ulang — dan itu
satu kasus tes tersendiri.

### Jalur login digerbangi terpisah, dan wajib

Login membuat sesi, jadi ia **tidak pernah lewat `validateSession`**. Tanpa
gerbang kedua di sana, cookie-nya terpasang lalu request berikutnya
membuangnya — itu redirect loop, bukan penolakan. Pesannya **"Username atau
password salah."**, identik untuk Non-Aktif, Terhapus, dan password yang memang
salah. Itu pilihan pengguna (§5.5) dan tidak dibuka ulang.

Datanya ikut di baris yang sudah dibaca: `readUserCredential` sekarang membawa
`id`, `role`, dan `strukturState` lewat `leftJoin` ke `organization` langsung —
**nol round trip tambahan**, dan kueri kedua di aksi login yang cuma mengambil
`id` jadi hilang.

`withUserCTE` ikut membawa `state` ke `connected_organization`. Ia join ke tabel
`organization` langsung (warisan tiket 20), dan di sini alasannya berbuah: join
yang menyaring Terhapus akan menyerahkan `null` untuk satu-satunya kasus yang
gerbang ini ada untuk menangkap.

### Keputusan yang spec tidak buat

**Akun kepengurusan tanpa Struktur terhubung (`strukturState` null) dianggap
mati.** Spec tidak menyebutnya. Ia tidak terjangkau oleh data yang sehat —
`createOrganization` selalu mengisi `connected_organization_id` — dan untuk
Kewenangan yang seluruh otoritasnya bersandar pada sebuah Struktur, "tidak punya
Struktur" bukan kasus yang lebih ringan daripada Terhapus. Fail-closed di seam
keamanan. Dilaporkan ke pengguna, tidak dibantah.

**Root diloloskan** meski §5.4 menyebut "empat Akun kepengurusan" tanpa
menyebutnya. Perlindungan Root ada di tempat lain dan lebih kuat: PP tidak bisa
dinonaktifkan oleh siapa pun (§2.3) dan prasyarat penghapusan menolaknya dalam
praktik. Mencantumkannya tidak membeli apa pun, dan akan membuat PP yang entah
bagaimana mati mengunci satu-satunya Akun yang bisa membatalkannya.

### Yang tidak dikerjakan, dan kenapa

**`withMemberCTE` tidak diperluas.** Tiket menyebutnya "jalur kedua untuk Akun
Kader", tapi §5.4 memutuskan Akun Kader tetap hidup — jadi jalur itu tidak punya
pertanyaan untuk dijawab. Membawa `state` ke sana hari ini adalah kolom yang nol
pembacanya.

### Temuan sampingan, tidak diperbaiki

**Kedaluwarsa karena tidak aktif tidak pernah berjalan.** `inactivityTimeoutMS`
(3 hari) hanya ditegakkan di `readSession`, yang nol pemanggil;
`validateSession` cuma menyegarkan `lastVerifiedAt` dan tidak pernah menolak
sesi yang sudah lama diam. Pra-ada, di luar tiket ini, dan memperbaikinya akan
mengeluarkan orang dari sesinya — jadi ia keputusan tersendiri, bukan efek
samping.

### Tes

- `src/lib/auth/keadaan-akun.test.ts` — 22 kasus, tabel argumen-ke-hasil, nol
  fixture. Enam Kewenangan kali tiga Keadaan, plus baris tanpa Struktur. Tabelnya
  ditulis penuh alih-alih dihasilkan dari daftar yang sama yang dipakai
  implementasinya: tabel yang meminjam daftar dari yang diujinya tidak menguji
  daftarnya. Satu kasus terakhir menuntut tiap Kewenangan benar-benar tercakup.
- `tests/keadaan-akun-sesi.test.ts` — 7 kasus seam. Sesinya sengaja dibuat
  **saat Struktur masih Aktif** lalu Strukturnya dimatikan, sebab itu bentuk
  kejadiannya: penonaktifan terjadi di tengah `maxAge` tiga hari, bukan sebelum
  orangnya login.

`bun test`: 449 lolos, 0 gagal. `check:types`, `check:lint`, `check:structure`
bersih.

## Comments

**8 Agustus 2026 — "Temuan sampingan, tidak diperbaiki" ditutup, dan alasannya
ternyata terbalik.**

Kedaluwarsa tak-aktif sekarang ditegakkan di `validateSession`, bukan cuma di
`readSession`. Pengguna memutuskan menegakkannya.

**Peringatan yang ikut dicatat di §Answer — "memperbaikinya akan mengeluarkan
orang dari sesinya" — tidak benar, dan itu terlihat setelah cookie-nya dibaca.**
`kammi_id_session` di-`set` sekali saat login dengan `maxAge` tiga hari dan
**tidak pernah diperbarui**, sementara `lastVerifiedAt` mulai dari waktu login
yang sama dan hanya bergerak maju. Jadi `lastVerifiedAt` tidak akan pernah basi
tiga hari selagi cookie yang membawanya masih hidup: untuk peramban jujur,
gerbang ini **nol efek**.

Yang sebenarnya ditambal beda dan lebih besar: sebelum ini `validateSession`
**tidak pernah menolak sesi karena umur sama sekali**, jadi sebuah baris di
`session` berlaku selamanya. `maxAge` mengikat peramban dan tidak mengikat
server, jadi token yang keluar dari peramban — disalin dari log, dari perangkat
yang hilang, dari mana pun — tidak punya satu pun pintu yang menolaknya. Itu
lubang keamanan, bukan sekadar konstanta yang menganggur.

Dua urutan yang menentukan, dan dua-duanya diuji:

- **Sesudah rahasianya**, sebab id sesi bukan rahasia (ia separuh pertama token).
  Kalau umur ditanya lebih dulu, siapa pun yang memegang id bisa membuat pembaca
  ini menghapus baris orang lain.
- **Sebelum penyegaran `lastVerifiedAt`**, sebab menyegarkan lebih dulu justru
  memperpanjang sesi yang gerbang ini ada untuk mempensiunkan — dan tes yang cuma
  memeriksa `undefined` akan tetap hijau. Jadi yang dituntut adalah barisnya
  hilang.

`tests/sesi-kedaluwarsa.test.ts` — 7 kasus, fixture bersufiks, nol `TRUNCATE`.

**Yang sengaja tidak ikut diubah:** cookie tetap absolut tiga hari sejak login,
bukan sliding. Menjadikannya sliding adalah keputusan produk (berapa lama orang
boleh tetap masuk tanpa login ulang), bukan efek samping dari menutup lubang ini.
