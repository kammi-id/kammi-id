# 02 — Semai per-tes di berkas yang hanya membaca

**What to build:** Berkas tes yang tidak mengubah apa pun menyemai sekali di
`beforeAll`, bukan `TRUNCATE` + semai ulang di tiap `beforeEach`.

**Blocked by:** None. Berdiri sendiri dari tiket 01 — ini meringankan gejala,
tiket 01 menyentuh sebabnya.

**Status:** ready-for-agent

`tests/access-control.test.ts` menyemai hierarki enam Struktur (PP → dua PW → PD
→ dua PK) di `beforeEach`, lalu ketujuh tesnya cuma memanggil
`fetchAllowedOrgIds` dan memeriksa hasilnya. Tidak satu pun menulis. Jadi enam
dari tujuh semai itu membangun ulang keadaan yang identik dengan yang barusan
dihapus.

Polanya sudah pernah diperbaiki sekali. `src/lib/auth/kekaderan.test.ts`
dipindah ke `beforeAll` dan turun dari **48 detik jadi 5 detik**, hijau tiga kali
berturut-turut.

## Kenapa ini aman di sini

Ada satu jebakan yang kelihatannya membatalkan pemindahan ini:
`fetchAllowedOrgIds` (`src/db/query/organization.ts`) dibungkus `cache()` React.
Kalau ia memoize, tes kedua dan seterusnya akan melihat nilai basi dari semai
yang pertama.

Ia tidak memoize. `cache()` hanya hidup di dalam konteks request, dan tes tidak
punya satu pun — sudah diprobe langsung. Perhatikan juga ia di-key pada
**primitif**, bukan objek; kalau di-key pada objek, tiap pemanggil membuat
literal baru dan cache-nya tidak pernah kena sama sekali.

Catat ini di komentar berkas tesnya. Tanpa itu, orang berikutnya akan
mengembalikannya ke `beforeEach` "supaya aman".

## Bentuknya

Sapu kesembilan berkas ber-`TRUNCATE` (daftarnya ada di tiket 01), pisahkan yang
hanya membaca dari yang menulis. Yang membaca pindah ke `beforeAll`. Yang
menulis **tetap** `beforeEach` — jangan dipaksa, isolasi antar-tes lebih mahal
untuk dilepas daripada beberapa detik.

Sudah pasti menulis, jangan disentuh: `delete-member`, `delete-training`,
`delete-member-button`, `reset-password`, `bulk-upload`,
`training-detail-view/action.test.ts` (yang terakhir menghapus baris Peserta).

- [ ] `tests/access-control.test.ts` menyemai di `beforeAll`
- [ ] Alasan `cache()` tidak jadi masalah tercatat di komentar berkasnya
- [ ] Berkas ber-`TRUNCATE` lain sudah disapu; yang menulis dibiarkan `beforeEach`
- [ ] Seluruh tes lolos
