# 19 — Gerbang sesi: Struktur mati = sesi tidak ada

**Type:** implementation
**Status:** open
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
